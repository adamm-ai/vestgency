"""
RAG Chain Module
================
LangChain-based RAG pipeline for intelligent property retrieval.
Implements context-aware search with re-ranking.
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun

from vector_store import PropertyVectorStore
from embeddings import QueryExpander

logger = logging.getLogger(__name__)


@dataclass
class SearchContext:
    """Context for a search session."""
    query: str
    expanded_queries: List[str] = field(default_factory=list)
    filters: Dict[str, Any] = field(default_factory=dict)
    intent: str = "general"
    confidence: float = 0.0


class IntentClassifier:
    """
    Classifies user intent from natural language queries.
    Helps optimize search strategy.
    """

    INTENTS = {
        "buy": {
            "keywords": ["acheter", "achat", "vendre", "vente", "à vendre", "investir", "investissement"],
            "category": "SALE"
        },
        "rent": {
            "keywords": ["louer", "location", "à louer", "bail", "mensuel", "mois"],
            "category": "RENT"
        },
        "search_type": {
            "keywords": ["villa", "appartement", "bureau", "magasin", "terrain", "studio"],
            "action": "filter_type"
        },
        "search_location": {
            "keywords": ["anfa", "californie", "maarif", "bouskoura", "où", "quartier", "zone"],
            "action": "filter_location"
        },
        "search_features": {
            "keywords": ["meublé", "piscine", "terrasse", "jardin", "parking", "neuf"],
            "action": "filter_features"
        },
        "search_specs": {
            "keywords": ["chambre", "pièce", "m²", "surface", "grand", "spacieux"],
            "action": "filter_specs"
        },
        "similar": {
            "keywords": ["similaire", "comme", "ressemblant", "même genre", "du même type"],
            "action": "find_similar"
        },
        "recommendations": {
            "keywords": ["recommander", "suggérer", "conseiller", "proposer", "meilleur"],
            "action": "recommend"
        }
    }

    @classmethod
    def classify(cls, query: str) -> tuple[str, float]:
        """
        Classify the intent of a query.
        Returns (intent, confidence).
        """
        query_lower = query.lower()
        intent_scores = {}

        for intent, config in cls.INTENTS.items():
            score = 0
            for keyword in config["keywords"]:
                if keyword in query_lower:
                    score += 1

            if score > 0:
                intent_scores[intent] = score / len(config["keywords"])

        if not intent_scores:
            return "general", 0.5

        best_intent = max(intent_scores, key=intent_scores.get)
        confidence = min(intent_scores[best_intent] * 2, 1.0)  # Scale to 0-1

        return best_intent, confidence


class PropertyRetriever(BaseRetriever):
    """
    LangChain-compatible retriever for properties.
    Wraps the FAISS vector store with LangChain interface.
    """

    vector_store: PropertyVectorStore
    search_mode: str = "hybrid"
    top_k: int = 10

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        """Retrieve relevant property documents."""
        results = self.vector_store.search(
            query=query,
            top_k=self.top_k,
            search_mode=self.search_mode
        )

        documents = []
        for prop in results:
            # Create document content
            content = self._format_property_content(prop)

            # Metadata includes full property data
            metadata = {
                "id": prop["id"],
                "category": prop["category"],
                "type": prop["type"],
                "location": prop["location"],
                "price": prop["price"],
                "score": prop.get("_score", 0),
                "full_data": prop
            }

            documents.append(Document(page_content=content, metadata=metadata))

        return documents

    def _format_property_content(self, prop: Dict[str, Any]) -> str:
        """Format property data as readable content."""
        lines = [
            f"ID: {prop['id']}",
            f"Bien: {prop['name']}",
            f"Type: {prop['type']} ({prop['category']})",
            f"Localisation: {prop['location']}, {prop.get('city', 'Casablanca')}",
            f"Prix: {prop['price']}",
        ]

        if prop.get("beds"):
            lines.append(f"Chambres: {prop['beds']}")
        if prop.get("baths"):
            lines.append(f"Salles de bain: {prop['baths']}")
        if prop.get("area"):
            lines.append(f"Surface: {prop['area']}")
        if prop.get("features"):
            lines.append(f"Équipements: {', '.join(prop['features'])}")

        return "\n".join(lines)


class RAGSearchPipeline:
    """
    Complete RAG pipeline for property search.
    Combines intent classification, query expansion, and retrieval.
    """

    def __init__(self, vector_store: PropertyVectorStore):
        self.vector_store = vector_store
        self.retriever = PropertyRetriever(
            vector_store=vector_store,
            search_mode="hybrid",
            top_k=20
        )

    def analyze_query(self, query: str) -> SearchContext:
        """
        Analyze query to create search context.
        """
        context = SearchContext(query=query)

        # Classify intent
        context.intent, context.confidence = IntentClassifier.classify(query)

        # Expand query
        context.expanded_queries = QueryExpander.expand_query(query)

        # Extract filters from vector store
        context.filters = self.vector_store._extract_filters_from_query(query)

        logger.info(f"Query analysis: intent={context.intent}, confidence={context.confidence:.2f}")
        logger.info(f"Filters: {context.filters}")
        logger.info(f"Expanded queries: {context.expanded_queries}")

        return context

    def search(
        self,
        query: str,
        top_k: int = 10,
        include_context: bool = True
    ) -> Dict[str, Any]:
        """
        Execute RAG search pipeline.
        """
        # Analyze query
        context = self.analyze_query(query)

        # Execute search
        results = self.vector_store.hybrid_search(query, top_k=top_k * 2)

        # Re-rank based on intent
        reranked = self._rerank_by_intent(results, context)

        # Format response
        response = {
            "query": query,
            "intent": context.intent,
            "confidence": context.confidence,
            "filters_detected": context.filters,
            "total_results": len(reranked),
            "results": reranked[:top_k]
        }

        if include_context:
            response["expanded_queries"] = context.expanded_queries

        return response

    def _rerank_by_intent(
        self,
        results: List[Dict[str, Any]],
        context: SearchContext
    ) -> List[Dict[str, Any]]:
        """
        Re-rank results based on detected intent.
        """
        for result in results:
            score = result.get("_score", 0)

            # Intent-based boosting
            if context.intent in ["buy", "rent"]:
                expected_category = "SALE" if context.intent == "buy" else "RENT"
                if result.get("category") == expected_category:
                    score *= 1.3

            # Location match boost
            if "location" in context.filters:
                if context.filters["location"].lower() in result.get("location", "").lower():
                    score *= 1.25

            # Type match boost
            if "type" in context.filters:
                if result.get("type") == context.filters["type"]:
                    score *= 1.2

            # Feature match boost
            if "features" in context.filters:
                prop_features = [f.lower() for f in result.get("features", [])]
                matches = sum(1 for f in context.filters["features"] if f.lower() in prop_features)
                if matches > 0:
                    score *= (1 + 0.1 * matches)

            result["_final_score"] = score

        # Sort by final score
        results.sort(key=lambda x: x.get("_final_score", 0), reverse=True)

        return results

    def get_similar(self, property_id: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Get properties similar to a given property.
        """
        base_property = self.vector_store.get_property_by_id(property_id)
        if not base_property:
            return {"error": "Property not found", "results": []}

        similar = self.vector_store.get_similar_properties(property_id, top_k)

        return {
            "base_property": base_property,
            "similar_properties": similar
        }


class RelevanceScorer:
    """
    Scores relevance of search results for quality assurance.
    Used to ensure 100% precision on targeted queries.
    """

    @staticmethod
    def calculate_relevance(query: str, result: Dict[str, Any]) -> float:
        """
        Calculate how relevant a result is to the query.
        Returns score 0-1.
        """
        query_lower = query.lower()
        query_terms = set(query_lower.split())

        score = 0.0
        total_checks = 0

        # Extract filters from query
        from vector_store import PropertyVectorStore
        filters = PropertyVectorStore._extract_filters_from_query(None, query)

        # Check type match
        if "type" in filters:
            total_checks += 1
            if result.get("type") == filters["type"]:
                score += 1.0

        # Check category match
        if "category" in filters:
            total_checks += 1
            if result.get("category") == filters["category"]:
                score += 1.0

        # Check location match
        if "location" in filters:
            total_checks += 1
            if filters["location"].lower() in result.get("location", "").lower():
                score += 1.0

        # Check bedroom match
        if "beds" in filters:
            total_checks += 1
            if (result.get("beds") or 0) >= filters["beds"]:
                score += 1.0

        # Check feature matches
        if "features" in filters:
            for feature in filters["features"]:
                total_checks += 1
                prop_features = [f.lower() for f in result.get("features", [])]
                if feature.lower() in prop_features:
                    score += 1.0

        # If no structured filters, use semantic score
        if total_checks == 0:
            return result.get("_score", 0.5)

        return score / total_checks

    @staticmethod
    def filter_by_relevance(
        results: List[Dict[str, Any]],
        query: str,
        min_relevance: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Filter results to only include highly relevant ones.
        """
        filtered = []
        for result in results:
            relevance = RelevanceScorer.calculate_relevance(query, result)
            result["_relevance"] = relevance
            if relevance >= min_relevance:
                filtered.append(result)

        return filtered
