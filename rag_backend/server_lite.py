"""
FastAPI Server LITE
===================
Lightweight API server for property search without ML dependencies.
Uses keyword-based search - works on Render free tier (512MB RAM).
"""

import logging
import time
import json
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

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

# Data path
BASE_DIR = Path(__file__).parent
LOCAL_DATA = BASE_DIR / "data" / "properties.json"
PARENT_DATA = BASE_DIR.parent / "data" / "properties.json"
PROPERTIES_PATH = LOCAL_DATA if LOCAL_DATA.exists() else PARENT_DATA

# ============================================================================
# GLOBAL STATE
# ============================================================================

properties: List[Dict[str, Any]] = []
is_ready = False

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(default=12, ge=1, le=50)
    mode: str = Field(default="keyword")
    filters: Optional[Dict[str, Any]] = None

class QuickSearchResponse(BaseModel):
    success: bool
    query: str
    results: List[Dict[str, Any]]
    processing_time_ms: float

class HealthResponse(BaseModel):
    status: str
    version: str
    index_loaded: bool
    total_properties: int
    embedding_model: str
    chatbot_ready: bool

# ============================================================================
# SEARCH FUNCTIONS
# ============================================================================

def keyword_search(query: str, limit: int = 12) -> List[Dict[str, Any]]:
    """Simple keyword-based search."""
    if not properties:
        return []

    query_lower = query.lower()
    query_terms = query_lower.split()

    scored_results = []

    for prop in properties:
        score = 0.0

        # Searchable fields
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
        if query_lower in prop_type:
            score += 6

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

    # Sort by score
    scored_results.sort(key=lambda x: x[1], reverse=True)

    # Return top results
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

# ============================================================================
# LIFECYCLE
# ============================================================================

def load_properties():
    """Load properties from JSON file."""
    global properties, is_ready

    try:
        logger.info(f"Loading properties from {PROPERTIES_PATH}")
        with open(PROPERTIES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict) and "properties" in data:
            properties = data["properties"]
        else:
            properties = data

        logger.info(f"Loaded {len(properties)} properties")
        is_ready = True
    except Exception as e:
        logger.error(f"Failed to load properties: {e}")
        is_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle."""
    logger.info("Starting RAG Lite server...")
    load_properties()
    logger.info(f"Server ready! {len(properties)} properties loaded.")
    yield
    logger.info("Shutting down...")

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Nourreska RAG Lite API",
    description="Lightweight property search API (keyword-based)",
    version="2.0.0-lite",
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
        version="2.0.0-lite",
        index_loaded=is_ready,
        total_properties=len(properties),
        embedding_model="keyword-search",
        chatbot_ready=bool(os.getenv("OPENAI_API_KEY"))
    )

@app.post("/api/search", tags=["Search"])
async def search(request: SearchRequest):
    """Search properties."""
    if not is_ready:
        raise HTTPException(status_code=503, detail="Service not ready")

    start_time = time.time()

    results = keyword_search(request.query, request.top_k)
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

    results = keyword_search(q, limit)

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
# CHATBOT ENDPOINT (OpenAI)
# ============================================================================

@app.post("/api/chat", tags=["Chatbot"])
async def chat(message: str = "", conversation_id: str = "default", stream: bool = False):
    """Simple chatbot using OpenAI."""
    openai_key = os.getenv("OPENAI_API_KEY")

    if not openai_key:
        return {
            "success": False,
            "response": "Chatbot non disponible. Clé OpenAI manquante.",
            "conversation_id": conversation_id
        }

    try:
        import openai
        client = openai.OpenAI(api_key=openai_key)

        # Search for relevant properties
        relevant = keyword_search(message, 5)
        context = json.dumps(relevant, ensure_ascii=False) if relevant else "Aucun bien trouvé."

        system_prompt = f"""Tu es NOUR, l'assistante immobilière d'élite de Nourreska.
Tu parles français principalement et tu es experte du marché immobilier marocain.
Voici les biens pertinents pour la requête du client:
{context}

Réponds de manière professionnelle et aide le client à trouver le bien idéal."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=500
        )

        return {
            "success": True,
            "response": response.choices[0].message.content,
            "conversation_id": conversation_id
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {
            "success": False,
            "response": f"Erreur: {str(e)}",
            "conversation_id": conversation_id
        }

@app.get("/api/chat/status", tags=["Chatbot"])
async def chat_status():
    """Get chatbot status."""
    return {
        "ready": bool(os.getenv("OPENAI_API_KEY")),
        "agent_name": "NOUR",
        "capabilities": ["property_search", "property_details"],
        "model": "gpt-4o-mini"
    }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server_lite:app", host=SERVER_HOST, port=SERVER_PORT, reload=False)
