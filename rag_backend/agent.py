"""
LangGraph Agent Module
======================
Intelligent agent for property search using LangGraph.
Implements multi-step reasoning for complex queries.
"""

import logging
from typing import Dict, Any, List, TypedDict, Annotated, Literal
from dataclasses import dataclass

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from vector_store import PropertyVectorStore
from rag_chain import RAGSearchPipeline, IntentClassifier, RelevanceScorer
from embeddings import QueryExpander

logger = logging.getLogger(__name__)


# ============================================================================
# STATE DEFINITION
# ============================================================================

class AgentState(TypedDict):
    """State maintained throughout the agent workflow."""
    # Input
    query: str
    user_preferences: Dict[str, Any]

    # Analysis
    intent: str
    confidence: float
    extracted_filters: Dict[str, Any]
    expanded_queries: List[str]

    # Search
    search_results: List[Dict[str, Any]]
    refined_results: List[Dict[str, Any]]

    # Output
    final_results: List[Dict[str, Any]]
    explanation: str
    suggestions: List[str]

    # Control
    iteration: int
    should_refine: bool


# ============================================================================
# AGENT NODES
# ============================================================================

class PropertySearchAgent:
    """
    LangGraph-based agent for intelligent property search.
    Implements a multi-node workflow for query processing.
    """

    def __init__(self, vector_store: PropertyVectorStore):
        self.vector_store = vector_store
        self.rag_pipeline = RAGSearchPipeline(vector_store)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        # Create graph
        workflow = StateGraph(AgentState)

        # Add nodes
        workflow.add_node("analyze_query", self._analyze_query)
        workflow.add_node("expand_query", self._expand_query)
        workflow.add_node("execute_search", self._execute_search)
        workflow.add_node("filter_results", self._filter_results)
        workflow.add_node("rank_results", self._rank_results)
        workflow.add_node("generate_suggestions", self._generate_suggestions)
        workflow.add_node("format_output", self._format_output)

        # Set entry point
        workflow.set_entry_point("analyze_query")

        # Add edges
        workflow.add_edge("analyze_query", "expand_query")
        workflow.add_edge("expand_query", "execute_search")
        workflow.add_edge("execute_search", "filter_results")
        workflow.add_edge("filter_results", "rank_results")

        # Conditional edge for refinement
        workflow.add_conditional_edges(
            "rank_results",
            self._should_refine,
            {
                "refine": "execute_search",
                "continue": "generate_suggestions"
            }
        )

        workflow.add_edge("generate_suggestions", "format_output")
        workflow.add_edge("format_output", END)

        return workflow.compile()

    # ========================================================================
    # NODE IMPLEMENTATIONS
    # ========================================================================

    def _analyze_query(self, state: AgentState) -> Dict[str, Any]:
        """Analyze the user query to understand intent and extract filters."""
        query = state["query"]
        logger.info(f"Analyzing query: {query}")

        # Classify intent
        intent, confidence = IntentClassifier.classify(query)

        # Extract structured filters
        filters = self.vector_store._extract_filters_from_query(query)

        return {
            "intent": intent,
            "confidence": confidence,
            "extracted_filters": filters,
            "iteration": 0,
            "should_refine": False
        }

    def _expand_query(self, state: AgentState) -> Dict[str, Any]:
        """Expand query with synonyms and related terms."""
        query = state["query"]

        # Use query expander
        expanded = QueryExpander.expand_query(query)

        logger.info(f"Query expanded to {len(expanded)} variants")

        return {
            "expanded_queries": expanded
        }

    def _execute_search(self, state: AgentState) -> Dict[str, Any]:
        """Execute the search using the RAG pipeline."""
        query = state["query"]
        iteration = state.get("iteration", 0)

        # Adjust search parameters based on iteration
        top_k = 30 if iteration == 0 else 50

        # Execute hybrid search
        results = self.vector_store.hybrid_search(query, top_k=top_k)

        # Also search with expanded queries and merge
        expanded_results = []
        for exp_query in state.get("expanded_queries", [])[:2]:
            if exp_query != query:
                exp_results = self.vector_store.hybrid_search(exp_query, top_k=10)
                expanded_results.extend(exp_results)

        # Deduplicate and merge
        seen_ids = {r["id"] for r in results}
        for r in expanded_results:
            if r["id"] not in seen_ids:
                r["_score"] *= 0.9  # Slight penalty for expanded query matches
                results.append(r)
                seen_ids.add(r["id"])

        logger.info(f"Search returned {len(results)} results (iteration {iteration})")

        return {
            "search_results": results,
            "iteration": iteration + 1
        }

    def _filter_results(self, state: AgentState) -> Dict[str, Any]:
        """Apply hard filters to narrow down results."""
        results = state["search_results"]
        filters = state["extracted_filters"]

        if not filters:
            return {"refined_results": results}

        filtered = []
        for result in results:
            matches = True

            # Apply each filter
            if "type" in filters and result.get("type") != filters["type"]:
                matches = False
            if "category" in filters and result.get("category") != filters["category"]:
                matches = False
            if "beds" in filters and (result.get("beds") or 0) < filters["beds"]:
                matches = False
            if "location" in filters:
                if filters["location"].lower() not in result.get("location", "").lower():
                    matches = False

            if matches:
                # Calculate filter match score
                result["_filter_matches"] = sum([
                    1 for k in filters.keys()
                    if k in ["type", "category", "beds", "location"]
                ])
                filtered.append(result)

        # If filtering removes too many, include some semantic-only matches
        if len(filtered) < 5 and len(results) > len(filtered):
            semantic_fallback = [r for r in results if r not in filtered]
            semantic_fallback.sort(key=lambda x: x.get("_score", 0), reverse=True)
            filtered.extend(semantic_fallback[:5 - len(filtered)])

        logger.info(f"Filtered to {len(filtered)} results")

        return {"refined_results": filtered}

    def _rank_results(self, state: AgentState) -> Dict[str, Any]:
        """Re-rank results using multiple signals."""
        results = state.get("refined_results", state.get("search_results", []))
        query = state["query"]
        intent = state["intent"]
        filters = state["extracted_filters"]

        for result in results:
            base_score = result.get("_score", 0)
            boost = 1.0

            # Intent-based boosting
            if intent == "buy" and result.get("category") == "SALE":
                boost *= 1.2
            elif intent == "rent" and result.get("category") == "RENT":
                boost *= 1.2

            # Filter match boosting
            filter_matches = result.get("_filter_matches", 0)
            boost *= (1 + 0.1 * filter_matches)

            # Relevance scoring
            relevance = RelevanceScorer.calculate_relevance(query, result)
            result["_relevance"] = relevance

            # Premium property boost (if has smart tags)
            if result.get("smartTags"):
                boost *= 1.1

            # Completeness boost (properties with more data)
            completeness = sum([
                1 for field in ["beds", "baths", "area", "description"]
                if result.get(field)
            ]) / 4
            boost *= (1 + 0.1 * completeness)

            result["_final_score"] = base_score * boost

        # Sort by final score
        results.sort(key=lambda x: x.get("_final_score", 0), reverse=True)

        # Check if we need to refine
        should_refine = (
            state.get("iteration", 0) < 2 and
            len(results) < 3 and
            state.get("confidence", 0) < 0.5
        )

        return {
            "refined_results": results,
            "should_refine": should_refine
        }

    def _should_refine(self, state: AgentState) -> Literal["refine", "continue"]:
        """Decide whether to refine search or continue."""
        if state.get("should_refine", False):
            return "refine"
        return "continue"

    def _generate_suggestions(self, state: AgentState) -> Dict[str, Any]:
        """Generate search suggestions based on results."""
        results = state.get("refined_results", [])
        filters = state["extracted_filters"]
        query = state["query"]

        suggestions = []

        # If few results, suggest relaxing filters
        if len(results) < 5:
            if "beds" in filters:
                suggestions.append(f"Essayez avec moins de chambres")
            if "location" in filters:
                suggestions.append(f"Recherchez dans d'autres quartiers")
            if "type" in filters:
                suggestions.append(f"Considérez d'autres types de biens")

        # Suggest related searches
        if results:
            # Get common locations from results
            locations = {}
            for r in results[:10]:
                loc = r.get("location", "")
                locations[loc] = locations.get(loc, 0) + 1

            top_locations = sorted(locations.items(), key=lambda x: x[1], reverse=True)[:3]
            for loc, _ in top_locations:
                if loc.lower() not in query.lower():
                    suggestions.append(f"Biens à {loc}")

            # Get common types
            types = {}
            for r in results[:10]:
                t = r.get("type", "")
                types[t] = types.get(t, 0) + 1

            top_types = sorted(types.items(), key=lambda x: x[1], reverse=True)[:2]
            for t, _ in top_types:
                if t.lower() not in query.lower():
                    suggestions.append(f"{t}s disponibles")

        return {"suggestions": suggestions[:5]}

    def _format_output(self, state: AgentState) -> Dict[str, Any]:
        """Format the final output."""
        results = state.get("refined_results", [])
        query = state["query"]
        intent = state["intent"]
        confidence = state["confidence"]
        filters = state["extracted_filters"]

        # Generate explanation
        explanation_parts = []

        if filters:
            filter_desc = []
            if "type" in filters:
                filter_desc.append(f"type: {filters['type']}")
            if "category" in filters:
                cat_fr = "à vendre" if filters["category"] == "SALE" else "à louer"
                filter_desc.append(cat_fr)
            if "beds" in filters:
                filter_desc.append(f"{filters['beds']}+ chambres")
            if "location" in filters:
                filter_desc.append(f"à {filters['location']}")
            if "features" in filters:
                filter_desc.append(f"avec {', '.join(filters['features'])}")

            explanation_parts.append(f"Recherche: {', '.join(filter_desc)}")

        explanation_parts.append(f"{len(results)} biens trouvés")

        if results:
            # Price range
            prices = [r.get("priceNumeric", 0) for r in results if r.get("priceNumeric", 0) > 0]
            if prices:
                min_price = min(prices)
                max_price = max(prices)
                if filters.get("category") == "RENT":
                    explanation_parts.append(f"Prix: {min_price:,.0f} - {max_price:,.0f} MAD/mois")
                else:
                    explanation_parts.append(f"Prix: {min_price:,.0f} - {max_price:,.0f} MAD")

        return {
            "final_results": results[:20],  # Limit final results
            "explanation": " | ".join(explanation_parts)
        }

    # ========================================================================
    # PUBLIC INTERFACE
    # ========================================================================

    def search(
        self,
        query: str,
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute intelligent search using the LangGraph workflow.
        """
        # Initialize state
        initial_state: AgentState = {
            "query": query,
            "user_preferences": user_preferences or {},
            "intent": "",
            "confidence": 0.0,
            "extracted_filters": {},
            "expanded_queries": [],
            "search_results": [],
            "refined_results": [],
            "final_results": [],
            "explanation": "",
            "suggestions": [],
            "iteration": 0,
            "should_refine": False
        }

        # Run the graph
        logger.info(f"Starting agent search for: {query}")
        result = self.graph.invoke(initial_state)

        # Format response
        return {
            "success": True,
            "query": query,
            "intent": result["intent"],
            "confidence": result["confidence"],
            "filters_detected": result["extracted_filters"],
            "explanation": result["explanation"],
            "total_results": len(result["final_results"]),
            "results": result["final_results"],
            "suggestions": result["suggestions"]
        }


# ============================================================================
# QUICK SEARCH (Non-agent version for autocomplete)
# ============================================================================

class QuickSearcher:
    """
    Fast search for autocomplete suggestions.
    Uses direct vector search without full agent workflow.
    """

    def __init__(self, vector_store: PropertyVectorStore):
        self.vector_store = vector_store

    def search(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        """
        Quick search for autocomplete.
        Returns minimal property data for fast rendering.
        """
        if not query or len(query) < 2:
            return []

        results = self.vector_store.hybrid_search(query, top_k=limit)

        # Return minimal data for autocomplete
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "location": r["location"],
                "price": r["price"],
                "category": r["category"],
                "image": r.get("image", ""),
                "score": r.get("_score", 0)
            }
            for r in results
        ]
