"""
Elite Real Estate Agent
=======================
The most intelligent real estate agent powered by:
- OpenAI GPT-4 for reasoning and conversation
- FAISS + Sentence Transformers for semantic search
- LangGraph for multi-step agent workflows
- RAG for property-aware responses

This agent understands natural language, finds perfect properties,
negotiates, and provides expert real estate advice.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, TypedDict, Literal, Annotated
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

from openai import OpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from vector_store import PropertyVectorStore
from embeddings import PropertyEmbedder

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = "gpt-4o"  # Best model for real estate expertise

# Log API key status
if OPENAI_API_KEY:
    logger.info(f"OpenAI API key loaded: {OPENAI_API_KEY[:10]}...")
else:
    logger.warning("OpenAI API key not found!")

# System prompt for the elite real estate agent
AGENT_SYSTEM_PROMPT = """Tu es NOUR, l'agent immobilier IA le plus sophistiqué du Maroc. Tu travailles pour At Home, agence premium à Casablanca.

## TON IDENTITÉ
- Nom: NOUR (At Home Universal Real-estate)
- Expertise: 20+ ans d'expérience virtuelle dans l'immobilier de luxe marocain
- Spécialité: Casablanca et ses quartiers premium (Anfa, Californie, Racine, Gauthier, Bouskoura)
- Style: Professionnel, chaleureux, expert, persuasif mais jamais agressif

## TES CAPACITÉS
1. **Recherche Intelligente**: Tu as accès à une base de données de propriétés via RAG/FAISS
2. **Expertise Marché**: Tu connais les prix, tendances, et spécificités de chaque quartier
3. **Conseil Personnalisé**: Tu comprends les besoins et proposes des biens adaptés
4. **Négociation**: Tu peux conseiller sur les stratégies de négociation
5. **Analyse Comparative**: Tu compares les biens et justifies les prix

## RÈGLES D'OR
- TOUJOURS utiliser les outils de recherche quand on te demande des propriétés
- JAMAIS inventer de propriétés - utilise uniquement les données RAG
- Poser des questions pour affiner les besoins (budget, chambres, quartier, critères)
- Présenter les biens de manière attrayante mais honnête
- Proposer des alternatives si rien ne correspond exactement
- Terminer par une action concrète (visite, contact, plus d'infos)

## FORMAT DE PRÉSENTATION DES BIENS
Quand tu présentes des propriétés, utilise ce format:
🏠 **[Nom du bien]**
📍 [Quartier], Casablanca
💰 [Prix] MAD
🛏️ [Chambres] ch | 🚿 [SDB] sdb | 📐 [Surface]
✨ [2-3 caractéristiques clés]
---

## CONVERSATION
- Salue chaleureusement les nouveaux clients
- Utilise des emojis avec modération (🏠💰📍✨🌟)
- Sois concis mais complet
- Adapte ton registre au client (formel/décontracté)
- En français par défaut, peux switcher en arabe/anglais si demandé

## EXPERTISE QUARTIERS CASABLANCA
- **Anfa**: Luxe absolu, villas somptueuses, ambassades, prix élevés
- **Californie**: Résidentiel haut standing, calme, familles aisées
- **Racine**: Central, dynamique, appartements modernes
- **Gauthier**: Quartier d'affaires, bureaux, appartements standing
- **Maarif**: Populaire, commerces, bon rapport qualité/prix
- **Bouskoura**: Villas avec jardins, golf, expatriés
- **Ain Diab/Corniche**: Vue mer, lifestyle, restaurants

Tu es le meilleur. Chaque client doit repartir satisfait ou avec un plan d'action clair."""


# ============================================================================
# AGENT STATE
# ============================================================================

class Message(TypedDict):
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    tool_calls: Optional[List[Dict]]
    tool_call_id: Optional[str]


class AgentState(TypedDict):
    """State for the real estate agent workflow."""
    messages: Annotated[List[Message], add_messages]
    user_query: str
    search_results: List[Dict[str, Any]]
    client_profile: Dict[str, Any]
    conversation_summary: str
    current_intent: str
    properties_shown: List[str]
    iteration: int


# ============================================================================
# TOOLS DEFINITION
# ============================================================================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_properties",
            "description": "Recherche des propriétés immobilières selon les critères du client. Utilise cette fonction quand le client cherche un bien à acheter ou louer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "La requête de recherche en langage naturel, ex: 'villa 4 chambres avec piscine à Anfa'"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["SALE", "RENT"],
                        "description": "Type de transaction: SALE pour achat, RENT pour location"
                    },
                    "property_type": {
                        "type": "string",
                        "enum": ["Villa", "Appartement", "Bureau", "Magasin", "Terrain", "Studio", "Duplex", "Riad"],
                        "description": "Type de bien recherché"
                    },
                    "location": {
                        "type": "string",
                        "description": "Quartier ou zone géographique, ex: 'Anfa', 'Californie', 'Maarif'"
                    },
                    "min_beds": {
                        "type": "integer",
                        "description": "Nombre minimum de chambres"
                    },
                    "max_price": {
                        "type": "number",
                        "description": "Budget maximum en MAD"
                    },
                    "features": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Caractéristiques souhaitées: 'Piscine', 'Terrasse', 'Meublé', 'Jardin', etc."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_property_details",
            "description": "Obtenir les détails complets d'une propriété spécifique par son ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "property_id": {
                        "type": "string",
                        "description": "L'identifiant unique de la propriété, ex: 'NO-12345'"
                    }
                },
                "required": ["property_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_similar_properties",
            "description": "Trouver des propriétés similaires à une propriété donnée.",
            "parameters": {
                "type": "object",
                "properties": {
                    "property_id": {
                        "type": "string",
                        "description": "L'identifiant de la propriété de référence"
                    },
                    "count": {
                        "type": "integer",
                        "description": "Nombre de propriétés similaires à retourner (défaut: 5)"
                    }
                },
                "required": ["property_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_market_insights",
            "description": "Obtenir des insights sur le marché immobilier (prix moyens, tendances) pour une zone.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Quartier ou ville pour l'analyse"
                    },
                    "property_type": {
                        "type": "string",
                        "description": "Type de bien pour l'analyse"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["SALE", "RENT"],
                        "description": "Achat ou location"
                    }
                },
                "required": ["location"]
            }
        }
    }
]


# ============================================================================
# REAL ESTATE AGENT
# ============================================================================

class EliteRealEstateAgent:
    """
    The most sophisticated real estate agent powered by OpenAI + RAG.
    """

    def __init__(self, vector_store: PropertyVectorStore):
        self.vector_store = vector_store
        # Explicitly pass API key
        api_key = os.getenv("OPENAI_API_KEY", OPENAI_API_KEY)
        if not api_key:
            raise ValueError("OpenAI API key not found! Set OPENAI_API_KEY environment variable.")
        self.client = OpenAI(api_key=api_key)
        self.conversations: Dict[str, List[Dict]] = {}
        logger.info(f"OpenAI client initialized with key: {api_key[:15]}...")

    def _build_graph(self) -> StateGraph:
        """Build LangGraph workflow for the agent."""
        workflow = StateGraph(AgentState)

        # Add nodes
        workflow.add_node("process_input", self._process_input)
        workflow.add_node("call_llm", self._call_llm)
        workflow.add_node("execute_tools", self._execute_tools)
        workflow.add_node("generate_response", self._generate_response)

        # Set entry point
        workflow.set_entry_point("process_input")

        # Add edges
        workflow.add_edge("process_input", "call_llm")

        # Conditional edge after LLM call
        workflow.add_conditional_edges(
            "call_llm",
            self._should_execute_tools,
            {
                "execute": "execute_tools",
                "respond": "generate_response"
            }
        )

        workflow.add_edge("execute_tools", "call_llm")
        workflow.add_edge("generate_response", END)

        return workflow.compile()

    # ========================================================================
    # NODE IMPLEMENTATIONS
    # ========================================================================

    def _process_input(self, state: AgentState) -> Dict[str, Any]:
        """Process user input and prepare for LLM."""
        user_query = state["user_query"]

        # Detect intent from query
        intent = self._detect_intent(user_query)

        # Update client profile based on query
        profile = state.get("client_profile", {})
        profile = self._update_client_profile(profile, user_query)

        return {
            "current_intent": intent,
            "client_profile": profile,
            "iteration": state.get("iteration", 0)
        }

    def _call_llm(self, state: AgentState) -> Dict[str, Any]:
        """Call OpenAI GPT-4 with tools."""
        messages = state["messages"]

        try:
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=2000
            )

            assistant_message = response.choices[0].message

            # Convert to our message format
            new_message = {
                "role": "assistant",
                "content": assistant_message.content or "",
                "tool_calls": None,
                "tool_call_id": None
            }

            if assistant_message.tool_calls:
                new_message["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in assistant_message.tool_calls
                ]

            return {"messages": [new_message]}

        except Exception as e:
            logger.error(f"LLM call error: {e}")
            return {
                "messages": [{
                    "role": "assistant",
                    "content": "Je rencontre un problème technique. Puis-je vous aider autrement?",
                    "tool_calls": None,
                    "tool_call_id": None
                }]
            }

    def _should_execute_tools(self, state: AgentState) -> Literal["execute", "respond"]:
        """Check if we need to execute tools."""
        last_message = state["messages"][-1]
        if last_message.get("tool_calls"):
            return "execute"
        return "respond"

    def _execute_tools(self, state: AgentState) -> Dict[str, Any]:
        """Execute tool calls and return results."""
        last_message = state["messages"][-1]
        tool_calls = last_message.get("tool_calls", [])

        tool_messages = []
        search_results = state.get("search_results", [])
        properties_shown = state.get("properties_shown", [])

        for tool_call in tool_calls:
            func_name = tool_call["function"]["name"]
            func_args = json.loads(tool_call["function"]["arguments"])

            logger.info(f"Executing tool: {func_name} with args: {func_args}")

            if func_name == "search_properties":
                result = self._tool_search_properties(func_args)
                search_results = result.get("properties", [])
                properties_shown.extend([p["id"] for p in search_results])

            elif func_name == "get_property_details":
                result = self._tool_get_property_details(func_args)

            elif func_name == "get_similar_properties":
                result = self._tool_get_similar_properties(func_args)

            elif func_name == "get_market_insights":
                result = self._tool_get_market_insights(func_args)

            else:
                result = {"error": f"Unknown tool: {func_name}"}

            tool_messages.append({
                "role": "tool",
                "content": json.dumps(result, ensure_ascii=False),
                "tool_call_id": tool_call["id"],
                "tool_calls": None
            })

        return {
            "messages": tool_messages,
            "search_results": search_results,
            "properties_shown": list(set(properties_shown)),
            "iteration": state.get("iteration", 0) + 1
        }

    def _generate_response(self, state: AgentState) -> Dict[str, Any]:
        """Generate final response (passthrough for now)."""
        return {}

    # ========================================================================
    # TOOL IMPLEMENTATIONS
    # ========================================================================

    def _tool_search_properties(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search properties using RAG."""
        query = args.get("query", "")

        # Build enhanced query
        if args.get("property_type"):
            query = f"{args['property_type']} {query}"
        if args.get("location"):
            query = f"{query} {args['location']}"
        if args.get("category"):
            cat = "à vendre" if args["category"] == "SALE" else "à louer"
            query = f"{query} {cat}"

        # Execute search
        results = self.vector_store.hybrid_search(query, top_k=10)

        # Apply additional filters
        filtered = []
        for prop in results:
            include = True

            if args.get("category") and prop.get("category") != args["category"]:
                include = False
            if args.get("property_type") and prop.get("type") != args["property_type"]:
                include = False
            if args.get("min_beds") and (prop.get("beds") or 0) < args["min_beds"]:
                include = False
            if args.get("max_price") and prop.get("priceNumeric", 0) > args["max_price"]:
                include = False
            if args.get("location"):
                if args["location"].lower() not in prop.get("location", "").lower():
                    include = False

            if include:
                filtered.append(prop)

        # Format for response
        properties = []
        for prop in filtered[:8]:
            properties.append({
                "id": prop["id"],
                "name": prop["name"],
                "type": prop["type"],
                "category": prop["category"],
                "location": prop["location"],
                "price": prop["price"],
                "priceNumeric": prop.get("priceNumeric", 0),
                "beds": prop.get("beds"),
                "baths": prop.get("baths"),
                "area": prop.get("area"),
                "features": prop.get("features", [])[:5],
                "description": prop.get("description", "")[:200] + "...",
                "image": prop.get("image", ""),
                "score": prop.get("_score", 0)
            })

        return {
            "query": query,
            "total_found": len(filtered),
            "showing": len(properties),
            "properties": properties
        }

    def _tool_get_property_details(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed info about a property."""
        property_id = args.get("property_id", "")
        prop = self.vector_store.get_property_by_id(property_id)

        if not prop:
            return {"error": f"Propriété {property_id} non trouvée"}

        return {
            "id": prop["id"],
            "name": prop["name"],
            "type": prop["type"],
            "category": prop["category"],
            "location": prop["location"],
            "city": prop.get("city", "Casablanca"),
            "price": prop["price"],
            "priceNumeric": prop.get("priceNumeric", 0),
            "beds": prop.get("beds"),
            "baths": prop.get("baths"),
            "area": prop.get("area"),
            "areaNumeric": prop.get("areaNumeric"),
            "features": prop.get("features", []),
            "smartTags": prop.get("smartTags", []),
            "description": prop.get("description", ""),
            "images": prop.get("images", []),
            "url": prop.get("url", "")
        }

    def _tool_get_similar_properties(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Find similar properties."""
        property_id = args.get("property_id", "")
        count = args.get("count", 5)

        similar = self.vector_store.get_similar_properties(property_id, top_k=count)

        if not similar:
            return {"error": "Aucune propriété similaire trouvée"}

        return {
            "reference_id": property_id,
            "similar_properties": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "type": p["type"],
                    "location": p["location"],
                    "price": p["price"],
                    "beds": p.get("beds"),
                    "area": p.get("area"),
                    "similarity_score": p.get("_similarity_score", 0)
                }
                for p in similar
            ]
        }

    def _tool_get_market_insights(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get market insights for a location."""
        location = args.get("location", "").lower()
        prop_type = args.get("property_type", "")
        category = args.get("category", "")

        # Filter properties for the location
        relevant = []
        for prop in self.vector_store.properties:
            if location in prop.get("location", "").lower():
                if prop_type and prop.get("type") != prop_type:
                    continue
                if category and prop.get("category") != category:
                    continue
                if prop.get("priceNumeric", 0) > 0:
                    relevant.append(prop)

        if not relevant:
            return {
                "location": location,
                "message": "Pas assez de données pour cette zone"
            }

        # Calculate statistics
        prices = [p["priceNumeric"] for p in relevant]
        areas = [p["areaNumeric"] for p in relevant if p.get("areaNumeric")]

        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)

        avg_area = sum(areas) / len(areas) if areas else 0
        price_per_m2 = avg_price / avg_area if avg_area > 0 else 0

        # Count by type
        by_type = {}
        for p in relevant:
            t = p.get("type", "Autre")
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "location": location,
            "total_properties": len(relevant),
            "price_stats": {
                "average": round(avg_price),
                "min": round(min_price),
                "max": round(max_price),
                "price_per_m2": round(price_per_m2) if price_per_m2 > 0 else None
            },
            "average_area_m2": round(avg_area) if avg_area else None,
            "by_type": by_type,
            "market_trend": "stable"  # Could be enhanced with historical data
        }

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    def _detect_intent(self, query: str) -> str:
        """Detect user intent from query."""
        query_lower = query.lower()

        if any(w in query_lower for w in ["cherche", "recherche", "trouve", "montre", "veux"]):
            return "search"
        if any(w in query_lower for w in ["prix", "coût", "budget", "combien"]):
            return "price_inquiry"
        if any(w in query_lower for w in ["quartier", "zone", "où", "localisation"]):
            return "location_inquiry"
        if any(w in query_lower for w in ["similaire", "comme", "autre", "alternative"]):
            return "similar_search"
        if any(w in query_lower for w in ["détail", "plus d'info", "description"]):
            return "details"
        if any(w in query_lower for w in ["bonjour", "salut", "hello", "bonsoir"]):
            return "greeting"
        if any(w in query_lower for w in ["merci", "au revoir", "bye"]):
            return "farewell"

        return "general"

    def _update_client_profile(self, profile: Dict, query: str) -> Dict:
        """Update client profile based on conversation."""
        query_lower = query.lower()

        # Detect budget mentions
        import re
        budget_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:millions?|m|mad|dh)', query_lower)
        if budget_match:
            value = float(budget_match.group(1))
            if "million" in query_lower or "m" in budget_match.group(0):
                value *= 1_000_000
            profile["budget"] = value

        # Detect bedroom preferences
        bed_match = re.search(r'(\d+)\s*(?:chambre|ch\b|bedroom)', query_lower)
        if bed_match:
            profile["preferred_beds"] = int(bed_match.group(1))

        # Detect location preferences
        locations = ["anfa", "californie", "maarif", "racine", "gauthier", "bouskoura"]
        for loc in locations:
            if loc in query_lower:
                profile.setdefault("preferred_locations", []).append(loc)
                profile["preferred_locations"] = list(set(profile["preferred_locations"]))

        # Detect transaction type
        if any(w in query_lower for w in ["acheter", "achat", "vente"]):
            profile["transaction_type"] = "SALE"
        elif any(w in query_lower for w in ["louer", "location", "bail"]):
            profile["transaction_type"] = "RENT"

        return profile

    # ========================================================================
    # PUBLIC API
    # ========================================================================

    def chat(
        self,
        message: str,
        conversation_id: str = "default",
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Main chat interface for the agent.
        Uses direct OpenAI calls with tool support.
        """
        # Get or create conversation history
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = [{
                "role": "system",
                "content": AGENT_SYSTEM_PROMPT
            }]

        history = self.conversations[conversation_id]

        # Add user message
        history.append({
            "role": "user",
            "content": message
        })

        try:
            # Call OpenAI with tools
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=history,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=2000
            )

            assistant_message = response.choices[0].message

            # Handle tool calls
            if assistant_message.tool_calls:
                # Add assistant message with tool calls
                history.append({
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in assistant_message.tool_calls
                    ]
                })

                # Execute tools and add results
                properties_shown = []
                for tool_call in assistant_message.tool_calls:
                    func_name = tool_call.function.name
                    func_args = json.loads(tool_call.function.arguments)

                    logger.info(f"Executing tool: {func_name}")

                    if func_name == "search_properties":
                        result = self._tool_search_properties(func_args)
                        properties_shown.extend([p["id"] for p in result.get("properties", [])])
                    elif func_name == "get_property_details":
                        result = self._tool_get_property_details(func_args)
                    elif func_name == "get_similar_properties":
                        result = self._tool_get_similar_properties(func_args)
                    elif func_name == "get_market_insights":
                        result = self._tool_get_market_insights(func_args)
                    else:
                        result = {"error": f"Unknown tool: {func_name}"}

                    history.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result, ensure_ascii=False)
                    })

                # Get final response
                final_response = self.client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=history,
                    temperature=0.7,
                    max_tokens=2000
                )

                response_content = final_response.choices[0].message.content
            else:
                response_content = assistant_message.content
                properties_shown = []

            # Add assistant response to history
            history.append({
                "role": "assistant",
                "content": response_content
            })

            # Keep history manageable
            if len(history) > 30:
                history = [history[0]] + history[-20:]
                self.conversations[conversation_id] = history

            return {
                "success": True,
                "response": response_content,
                "intent": self._detect_intent(message),
                "properties_shown": properties_shown,
                "conversation_id": conversation_id
            }

        except Exception as e:
            logger.error(f"Chat error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "response": "Je rencontre un problème technique. Pouvez-vous reformuler votre demande?",
                "error": str(e),
                "conversation_id": conversation_id
            }

    def stream_chat(
        self,
        message: str,
        conversation_id: str = "default"
    ):
        """
        Streaming chat interface.
        Yields response chunks for real-time display.
        """
        # Get or create conversation history
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = [{
                "role": "system",
                "content": AGENT_SYSTEM_PROMPT
            }]

        history = self.conversations[conversation_id]

        # Add user message
        history.append({
            "role": "user",
            "content": message
        })

        try:
            # First, check if we need to call tools
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=history,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=2000
            )

            assistant_message = response.choices[0].message

            # If tools needed, execute them first
            if assistant_message.tool_calls:
                tool_results = []
                for tool_call in assistant_message.tool_calls:
                    func_name = tool_call.function.name
                    func_args = json.loads(tool_call.function.arguments)

                    if func_name == "search_properties":
                        result = self._tool_search_properties(func_args)
                    elif func_name == "get_property_details":
                        result = self._tool_get_property_details(func_args)
                    elif func_name == "get_similar_properties":
                        result = self._tool_get_similar_properties(func_args)
                    elif func_name == "get_market_insights":
                        result = self._tool_get_market_insights(func_args)
                    else:
                        result = {"error": f"Unknown tool: {func_name}"}

                    tool_results.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result, ensure_ascii=False)
                    })

                # Add assistant message with tool calls
                history.append({
                    "role": "assistant",
                    "content": assistant_message.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in assistant_message.tool_calls
                    ]
                })

                # Add tool results
                history.extend(tool_results)

                # Now stream the final response
                stream = self.client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=history,
                    temperature=0.7,
                    max_tokens=2000,
                    stream=True
                )

                full_response = ""
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield {"type": "content", "content": content}

                # Save to history
                history.append({
                    "role": "assistant",
                    "content": full_response
                })

            else:
                # No tools needed, stream directly
                stream = self.client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=history,
                    temperature=0.7,
                    max_tokens=2000,
                    stream=True
                )

                full_response = ""
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield {"type": "content", "content": content}

                # Save to history
                history.append({
                    "role": "assistant",
                    "content": full_response
                })

            # Keep history manageable
            if len(history) > 30:
                history = [history[0]] + history[-20:]
                self.conversations[conversation_id] = history

            yield {"type": "done", "conversation_id": conversation_id}

        except Exception as e:
            logger.error(f"Stream chat error: {e}")
            yield {
                "type": "error",
                "error": str(e)
            }

    def clear_conversation(self, conversation_id: str = "default"):
        """Clear conversation history."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id] = [{
                "role": "system",
                "content": AGENT_SYSTEM_PROMPT
            }]
        return {"success": True, "message": "Conversation cleared"}
