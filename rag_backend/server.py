"""
FastAPI Production Server
=========================
Production-ready API server that loads pre-computed FAISS index.
Uses OpenAI embeddings for query encoding - no PyTorch needed!

Memory: ~100MB (vs 1GB+ with Sentence Transformers)
"""

import logging
import time
import json
import os
import pickle
import numpy as np
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

SERVER_HOST = "0.0.0.0"
SERVER_PORT = int(os.getenv("PORT", 8001))
CORS_ORIGINS = ["*"]

# Paths
BASE_DIR = Path(__file__).parent
INDEX_DIR = BASE_DIR / "faiss_index"
EMBEDDINGS_CACHE = BASE_DIR / "embeddings_cache.pkl"

# OpenAI config
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSION = 384  # We'll truncate OpenAI embeddings to match

# ============================================================================
# GLOBAL STATE
# ============================================================================

faiss_index = None
properties: List[Dict[str, Any]] = []
embeddings_cache: Optional[np.ndarray] = None
property_ids: List[str] = []
openai_client = None
is_ready = False

# Conversation storage for session analysis
conversations: Dict[str, List[Dict[str, str]]] = {}

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(default=12, ge=1, le=50)
    mode: str = Field(default="semantic")
    filters: Optional[Dict[str, Any]] = None


class QuickSearchResponse(BaseModel):
    success: bool
    query: str
    results: List[Dict[str, Any]]
    processing_time_ms: float


class ChatRequest(BaseModel):
    message: str = ""
    conversation_id: str = "default"
    stream: bool = False


class HealthResponse(BaseModel):
    status: str
    version: str
    index_loaded: bool
    total_properties: int
    embedding_model: str
    chatbot_ready: bool


# ============================================================================
# EMBEDDING FUNCTIONS
# ============================================================================

def get_query_embedding_openai(query: str) -> np.ndarray:
    """Get embedding for query using OpenAI API."""
    global openai_client

    if not openai_client:
        raise ValueError("OpenAI client not initialized")

    response = openai_client.embeddings.create(
        model=OPENAI_EMBEDDING_MODEL,
        input=query,
        dimensions=EMBEDDING_DIMENSION  # OpenAI supports dimension reduction
    )

    embedding = np.array(response.data[0].embedding, dtype=np.float32)

    # Normalize for cosine similarity
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding


def get_query_embedding_fallback(query: str) -> np.ndarray:
    """Fallback: Create simple TF-IDF-like embedding."""
    # This is a very basic fallback - won't be as good as real embeddings
    # but allows the system to work without OpenAI API
    import hashlib

    # Create deterministic pseudo-embedding from query terms
    terms = query.lower().split()
    embedding = np.zeros(EMBEDDING_DIMENSION, dtype=np.float32)

    for term in terms:
        # Hash each term to get reproducible vector positions
        hash_val = int(hashlib.md5(term.encode()).hexdigest(), 16)
        positions = [(hash_val >> i) % EMBEDDING_DIMENSION for i in range(0, 128, 8)]
        for pos in positions:
            embedding[pos] += 1.0

    # Normalize
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding


# ============================================================================
# SEARCH FUNCTIONS
# ============================================================================

def semantic_search(query: str, top_k: int = 12) -> List[Dict[str, Any]]:
    """Perform semantic search using FAISS."""
    global faiss_index, properties, openai_client

    if faiss_index is None or not properties:
        return []

    try:
        # Get query embedding
        if openai_client:
            query_embedding = get_query_embedding_openai(query)
        else:
            logger.warning("OpenAI not available, using fallback embedding")
            query_embedding = get_query_embedding_fallback(query)

        # Reshape for FAISS
        query_embedding = query_embedding.reshape(1, -1)

        # Search FAISS index
        scores, indices = faiss_index.search(query_embedding, min(top_k * 2, len(properties)))

        # Build results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(properties):
                continue

            prop = properties[idx]
            result = {
                "id": prop.get("id"),
                "name": prop.get("name"),
                "type": prop.get("type"),
                "category": prop.get("category"),
                "location": prop.get("location"),
                "city": prop.get("city", ""),
                "price": prop.get("price"),
                "priceNumeric": prop.get("priceNumeric"),
                "beds": prop.get("beds"),
                "baths": prop.get("baths"),
                "area": prop.get("area"),
                "areaNumeric": prop.get("areaNumeric"),
                "image": prop.get("image"),
                "images": prop.get("images", []),
                "features": prop.get("features", []),
                "smartTags": prop.get("smartTags", []),
                "description": prop.get("description", ""),
                "url": prop.get("url", ""),
                "_score": float(score)
            }
            results.append(result)

        return results[:top_k]

    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        # Fallback to keyword search
        return keyword_search(query, top_k)


def keyword_search(query: str, limit: int = 12) -> List[Dict[str, Any]]:
    """Fallback keyword-based search."""
    if not properties:
        return []

    query_lower = query.lower()
    query_terms = query_lower.split()

    scored_results = []

    for prop in properties:
        score = 0.0

        name = prop.get("name", "").lower()
        location = prop.get("location", "").lower()
        prop_type = prop.get("type", "").lower()
        city = prop.get("city", "").lower()
        description = prop.get("description", "").lower()
        features = " ".join(prop.get("features", [])).lower()

        # Full query match
        if query_lower in name:
            score += 10
        if query_lower in location:
            score += 8

        # Term matches
        for term in query_terms:
            if len(term) < 2:
                continue
            if term in name:
                score += 3
            if term in location:
                score += 2.5
            if term in prop_type:
                score += 2
            if term in city:
                score += 1.5
            if term in features:
                score += 1
            if term in description:
                score += 0.5

        # Category detection
        if any(w in query_lower for w in ["louer", "location", "à louer"]):
            if prop.get("category") == "RENT":
                score += 5
        elif any(w in query_lower for w in ["acheter", "vente", "à vendre"]):
            if prop.get("category") == "SALE":
                score += 5

        if score > 0:
            scored_results.append((prop, score))

    scored_results.sort(key=lambda x: x[1], reverse=True)

    return [
        {
            "id": p.get("id"),
            "name": p.get("name"),
            "type": p.get("type"),
            "category": p.get("category"),
            "location": p.get("location"),
            "city": p.get("city", ""),
            "price": p.get("price"),
            "priceNumeric": p.get("priceNumeric"),
            "beds": p.get("beds"),
            "baths": p.get("baths"),
            "area": p.get("area"),
            "areaNumeric": p.get("areaNumeric"),
            "image": p.get("image"),
            "images": p.get("images", []),
            "features": p.get("features", []),
            "smartTags": p.get("smartTags", []),
            "description": p.get("description", ""),
            "url": p.get("url", ""),
            "_score": score
        }
        for p, score in scored_results[:limit]
    ]


def detect_intent(query: str) -> Dict[str, Any]:
    """Detect search intent from query."""
    query_lower = query.lower()

    intent = "general"
    confidence = 0.5

    if any(w in query_lower for w in ["louer", "location"]):
        intent = "rent"
        confidence = 0.9
    elif any(w in query_lower for w in ["acheter", "vente"]):
        intent = "buy"
        confidence = 0.9
    elif any(w in query_lower for w in ["villa", "appartement", "bureau", "maison"]):
        intent = "search_type"
        confidence = 0.8
    elif any(w in query_lower for w in ["anfa", "maarif", "californie", "bouskoura"]):
        intent = "search_location"
        confidence = 0.85

    return {"intent": intent, "confidence": confidence}


def analyze_conversation_urgency(conversation_history: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Use AI to analyze conversation and detect urgency level.
    Returns urgency (low/medium/high/critical) with reasoning.
    """
    global openai_client

    if not openai_client or len(conversation_history) < 2:
        return {"urgency": "medium", "reason": "default"}

    try:
        # Format conversation for analysis
        conv_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in conversation_history[-10:]  # Last 10 messages
        ])

        analysis_prompt = f"""Analyze this real estate conversation and determine the client's urgency level.

CONVERSATION:
{conv_text}

Based on the conversation, determine:
1. URGENCY: low, medium, high, or critical
2. REASON: Brief explanation (max 20 words)

Consider these factors:
- Explicit urgency mentions (urgent, ASAP, pressé, vite, rapidement)
- Time constraints (deadline, déménagement, fin de bail, dans X jours/semaines)
- Emotional tone (stressed, anxious, excited, casual)
- Decision readiness (ready to visit, ready to sign, just browsing)
- Follow-up frequency and engagement level

Respond ONLY with valid JSON:
{{"urgency": "low|medium|high|critical", "reason": "brief explanation"}}"""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": analysis_prompt}],
            max_tokens=100,
            temperature=0.3
        )

        result_text = response.choices[0].message.content.strip()
        # Parse JSON response
        result = json.loads(result_text)

        # Validate urgency value
        if result.get("urgency") not in ["low", "medium", "high", "critical"]:
            result["urgency"] = "medium"

        return result

    except Exception as e:
        logger.error(f"Urgency analysis error: {e}")
        return {"urgency": "medium", "reason": "analysis_failed"}


# ============================================================================
# LIFECYCLE
# ============================================================================

def load_index():
    """Load pre-computed FAISS index and metadata."""
    global faiss_index, properties, embeddings_cache, property_ids, openai_client, is_ready

    try:
        # Initialize OpenAI client
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            openai_client = openai.OpenAI(api_key=openai_key)
            logger.info("OpenAI client initialized")
        else:
            logger.warning("OPENAI_API_KEY not set - semantic search will use fallback")

        # Load FAISS index
        index_path = INDEX_DIR / "index.faiss"
        if index_path.exists():
            import faiss
            faiss_index = faiss.read_index(str(index_path))
            logger.info(f"Loaded FAISS index with {faiss_index.ntotal} vectors")
        else:
            logger.error(f"FAISS index not found at {index_path}")
            is_ready = False
            return

        # Load metadata
        metadata_path = INDEX_DIR / "metadata.json"
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                properties = json.load(f)
            logger.info(f"Loaded {len(properties)} properties from metadata")
        else:
            logger.error(f"Metadata not found at {metadata_path}")
            is_ready = False
            return

        # Load embeddings cache (optional, for similar property search)
        if EMBEDDINGS_CACHE.exists():
            with open(EMBEDDINGS_CACHE, "rb") as f:
                cache_data = pickle.load(f)
                embeddings_cache = cache_data.get("embeddings")
                property_ids = cache_data.get("property_ids", [])
            logger.info("Loaded embeddings cache")

        is_ready = True
        logger.info("Server ready!")

    except Exception as e:
        logger.error(f"Failed to load index: {e}")
        is_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle."""
    logger.info("Starting RAG Production Server...")
    load_index()
    yield
    logger.info("Shutting down...")


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Nourreska RAG API",
    description="Semantic property search with conversation memory",
    version="2.1.0-memory",
    default_response_class=ORJSONResponse,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="2.1.0-memory",
        index_loaded=is_ready,
        total_properties=len(properties),
        embedding_model="openai/text-embedding-3-small",
        chatbot_ready=openai_client is not None
    )


@app.post("/api/search", tags=["Search"])
async def search(request: SearchRequest):
    """Semantic search endpoint."""
    if not is_ready:
        raise HTTPException(status_code=503, detail="Service not ready")

    start_time = time.time()

    # Use semantic search
    results = semantic_search(request.query, request.top_k)
    intent_info = detect_intent(request.query)

    processing_time = (time.time() - start_time) * 1000

    return {
        "success": True,
        "query": request.query,
        "intent": intent_info["intent"],
        "confidence": intent_info["confidence"],
        "filters_detected": None,
        "explanation": None,
        "total_results": len(results),
        "results": results,
        "suggestions": None,
        "processing_time_ms": round(processing_time, 2)
    }


@app.get("/api/quick-search", response_model=QuickSearchResponse, tags=["Search"])
async def quick_search(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(default=8, ge=1, le=20)
):
    """Quick search for autocomplete."""
    if not is_ready:
        raise HTTPException(status_code=503, detail="Service not ready")

    start_time = time.time()

    results = semantic_search(q, limit)

    processing_time = (time.time() - start_time) * 1000

    return QuickSearchResponse(
        success=True,
        query=q,
        results=results,
        processing_time_ms=round(processing_time, 2)
    )


@app.get("/api/property/{property_id}", tags=["Properties"])
async def get_property(property_id: str):
    """Get property by ID."""
    if not is_ready:
        raise HTTPException(status_code=503, detail="Service not ready")

    for prop in properties:
        if prop.get("id") == property_id:
            return {"success": True, "data": prop}

    raise HTTPException(status_code=404, detail="Property not found")


@app.get("/api/stats", tags=["Properties"])
async def get_stats():
    """Get statistics."""
    if not is_ready:
        raise HTTPException(status_code=503, detail="Service not ready")

    sale_count = sum(1 for p in properties if p.get("category") == "SALE")
    rent_count = sum(1 for p in properties if p.get("category") == "RENT")

    type_counts = {}
    for p in properties:
        t = p.get("type", "Autre")
        type_counts[t] = type_counts.get(t, 0) + 1

    return {
        "success": True,
        "total_properties": len(properties),
        "by_category": {"SALE": sale_count, "RENT": rent_count},
        "by_type": sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
    }


# ============================================================================
# CHATBOT ENDPOINT
# ============================================================================

@app.post("/api/chat", tags=["Chatbot"])
async def chat(request: ChatRequest):
    """Chatbot using OpenAI with conversation memory and urgency detection."""
    global conversations

    message = request.message
    conversation_id = request.conversation_id

    logger.info(f"Chat request: conversation_id={conversation_id}, message_len={len(message)}")

    if not openai_client:
        return {
            "success": False,
            "response": "Chatbot non disponible. Clé OpenAI manquante.",
            "conversation_id": conversation_id,
            "analysis": {"urgency": "medium", "reason": "default"}
        }

    try:
        # Initialize conversation history if needed
        if conversation_id not in conversations:
            conversations[conversation_id] = []
            logger.info(f"New conversation started: {conversation_id}")

        # Add user message to history
        conversations[conversation_id].append({
            "role": "user",
            "content": message
        })

        # Search for relevant properties
        relevant = semantic_search(message, 5)
        context = json.dumps(relevant, ensure_ascii=False) if relevant else "Aucun bien trouvé."

        system_prompt = f"""Tu es NOUR, l'assistante immobilière d'élite de Nourreska.
Tu parles français principalement et tu es experte du marché immobilier marocain.
Voici les biens pertinents pour la requête du client:
{context}

Réponds de manière professionnelle et aide le client à trouver le bien idéal."""

        # Build messages with conversation history (last 6 messages for context)
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversations[conversation_id][-6:])

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500
        )

        assistant_response = response.choices[0].message.content

        # Add assistant response to history
        conversations[conversation_id].append({
            "role": "assistant",
            "content": assistant_response
        })

        # Analyze conversation urgency (every 3+ messages)
        urgency_analysis = {"urgency": "medium", "reason": "default"}
        if len(conversations[conversation_id]) >= 3:
            urgency_analysis = analyze_conversation_urgency(conversations[conversation_id])

        return {
            "success": True,
            "response": assistant_response,
            "conversation_id": conversation_id,
            "analysis": urgency_analysis,
            "message_count": len(conversations[conversation_id])
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {
            "success": False,
            "response": f"Erreur: {str(e)}",
            "conversation_id": conversation_id,
            "analysis": {"urgency": "medium", "reason": "error"}
        }


@app.get("/api/chat/status", tags=["Chatbot"])
async def chat_status():
    """Get chatbot status."""
    return {
        "ready": openai_client is not None,
        "agent_name": "NOUR",
        "capabilities": ["property_search", "property_details", "urgency_detection"],
        "model": "gpt-4o-mini"
    }


@app.post("/api/chat/clear", tags=["Chatbot"])
async def clear_chat(conversation_id: str = "default"):
    """Clear conversation history for a session."""
    global conversations

    if conversation_id in conversations:
        # Analyze final urgency before clearing
        final_analysis = {"urgency": "medium", "reason": "session_cleared"}
        if len(conversations[conversation_id]) >= 2:
            final_analysis = analyze_conversation_urgency(conversations[conversation_id])

        del conversations[conversation_id]

        return {
            "success": True,
            "message": "Conversation cleared",
            "final_analysis": final_analysis
        }

    return {
        "success": True,
        "message": "No conversation to clear",
        "final_analysis": {"urgency": "medium", "reason": "no_history"}
    }


@app.get("/api/chat/analyze/{conversation_id}", tags=["Chatbot"])
async def analyze_chat(conversation_id: str):
    """Get urgency analysis for a specific conversation."""
    global conversations

    if conversation_id not in conversations or len(conversations[conversation_id]) < 2:
        return {
            "success": False,
            "analysis": {"urgency": "medium", "reason": "insufficient_data"}
        }

    analysis = analyze_conversation_urgency(conversations[conversation_id])

    return {
        "success": True,
        "conversation_id": conversation_id,
        "message_count": len(conversations[conversation_id]),
        "analysis": analysis
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host=SERVER_HOST, port=SERVER_PORT, reload=False)
