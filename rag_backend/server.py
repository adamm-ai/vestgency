"""
FastAPI Server
==============
Production-ready API server for the RAG search system + Elite Real Estate Chatbot.
"""

import logging
import time
import json
import asyncio
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from config import SERVER_HOST, SERVER_PORT, CORS_ORIGINS, LOG_LEVEL, LOG_FORMAT

# Configure logging
logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# Global instances (initialized on startup)
vector_store = None
search_agent = None
quick_searcher = None
rag_pipeline = None
real_estate_agent = None  # Elite chatbot agent


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SearchRequest(BaseModel):
    """Request model for search endpoint."""
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    top_k: int = Field(default=12, ge=1, le=50, description="Number of results")
    mode: str = Field(default="agent", description="Search mode: agent, hybrid, semantic")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Additional filters")


class QuickSearchRequest(BaseModel):
    """Request for quick autocomplete search."""
    query: str = Field(..., min_length=2, max_length=200)
    limit: int = Field(default=8, ge=1, le=20)


class SimilarRequest(BaseModel):
    """Request for similar properties."""
    property_id: str
    top_k: int = Field(default=5, ge=1, le=20)


class PropertyResult(BaseModel):
    """Property result model."""
    id: str
    name: str
    type: str
    category: str
    location: str
    city: str
    price: str
    priceNumeric: float
    beds: Optional[int]
    baths: Optional[int]
    area: Optional[str]
    areaNumeric: Optional[float]
    image: str
    images: List[str]
    features: List[str]
    smartTags: List[str]
    description: str
    url: str
    score: Optional[float] = None
    relevance: Optional[float] = None


class SearchResponse(BaseModel):
    """Response model for search endpoint."""
    success: bool
    query: str
    intent: Optional[str]
    confidence: Optional[float]
    filters_detected: Optional[Dict[str, Any]]
    explanation: Optional[str]
    total_results: int
    results: List[Dict[str, Any]]
    suggestions: Optional[List[str]]
    processing_time_ms: float


class QuickSearchResponse(BaseModel):
    """Response for quick search."""
    success: bool
    query: str
    results: List[Dict[str, Any]]
    processing_time_ms: float


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    index_loaded: bool
    total_properties: int
    embedding_model: str
    chatbot_ready: bool = False


# ============================================================================
# CHATBOT MODELS
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    conversation_id: str = Field(default="default", description="Conversation ID for context")
    stream: bool = Field(default=True, description="Enable streaming response")


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    success: bool
    response: str
    intent: Optional[str]
    properties_shown: Optional[List[str]]
    conversation_id: str
    processing_time_ms: Optional[float]


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global vector_store, search_agent, quick_searcher, rag_pipeline, real_estate_agent

    logger.info("Starting RAG search server + Elite Real Estate Chatbot...")

    # Initialize components
    try:
        from embeddings import PropertyEmbedder
        from vector_store import PropertyVectorStore
        from agent import PropertySearchAgent, QuickSearcher
        from rag_chain import RAGSearchPipeline
        from real_estate_agent import EliteRealEstateAgent

        # Load environment variables
        from dotenv import load_dotenv
        import os
        load_dotenv()

        # Set OpenAI API key in environment
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if openai_key:
            os.environ["OPENAI_API_KEY"] = openai_key
            logger.info("OpenAI API key loaded")
        else:
            logger.warning("OpenAI API key not found - chatbot will be limited")

        # Create embedder
        logger.info("Loading embedding model...")
        embedder = PropertyEmbedder()

        # Create and build vector store
        logger.info("Building vector index...")
        vector_store = PropertyVectorStore(embedder)
        vector_store.build_index()

        # Create search components
        search_agent = PropertySearchAgent(vector_store)
        quick_searcher = QuickSearcher(vector_store)
        rag_pipeline = RAGSearchPipeline(vector_store)

        # Create Elite Real Estate Chatbot
        logger.info("Initializing Elite Real Estate Agent (OpenAI GPT-4 + RAG)...")
        real_estate_agent = EliteRealEstateAgent(vector_store)
        logger.info("Elite Real Estate Agent ready!")

        logger.info(f"Server ready! {vector_store.index.ntotal} properties indexed.")
        logger.info("Chatbot NOUR is online and ready to assist clients!")

    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        raise

    yield

    # Cleanup
    logger.info("Shutting down...")


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Nourreska RAG Search API",
    description="Intelligent property search using FAISS, Sentence Transformers, LangChain & LangGraph",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan
)

# CORS middleware
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
    """Check server health and status."""
    from config import EMBEDDING_MODEL

    return HealthResponse(
        status="healthy" if vector_store and vector_store.is_initialized else "initializing",
        version="2.0.0",
        index_loaded=vector_store.is_initialized if vector_store else False,
        total_properties=vector_store.index.ntotal if vector_store and vector_store.index else 0,
        embedding_model=EMBEDDING_MODEL,
        chatbot_ready=real_estate_agent is not None
    )


@app.post("/api/search", response_model=SearchResponse, tags=["Search"])
async def search(request: SearchRequest):
    """
    Intelligent property search using RAG.

    Modes:
    - agent: Full LangGraph agent with multi-step reasoning (best quality)
    - hybrid: Combined semantic + keyword search (fast)
    - semantic: Pure semantic search (fastest)
    """
    if not vector_store or not vector_store.is_initialized:
        raise HTTPException(status_code=503, detail="Search service not ready")

    start_time = time.time()

    try:
        if request.mode == "agent":
            # Use full agent workflow
            result = search_agent.search(request.query)
        else:
            # Use RAG pipeline directly
            result = rag_pipeline.search(
                request.query,
                top_k=request.top_k,
                include_context=True
            )

        processing_time = (time.time() - start_time) * 1000

        return SearchResponse(
            success=True,
            query=request.query,
            intent=result.get("intent"),
            confidence=result.get("confidence"),
            filters_detected=result.get("filters_detected"),
            explanation=result.get("explanation"),
            total_results=result.get("total_results", len(result.get("results", []))),
            results=result.get("results", [])[:request.top_k],
            suggestions=result.get("suggestions"),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quick-search", response_model=QuickSearchResponse, tags=["Search"])
async def quick_search(
    q: str = Query(..., min_length=2, max_length=200, description="Search query"),
    limit: int = Query(default=8, ge=1, le=20, description="Result limit")
):
    """
    Fast search for autocomplete suggestions.
    Optimized for low latency.
    """
    if not quick_searcher:
        raise HTTPException(status_code=503, detail="Search service not ready")

    start_time = time.time()

    try:
        results = quick_searcher.search(q, limit=limit)
        processing_time = (time.time() - start_time) * 1000

        return QuickSearchResponse(
            success=True,
            query=q,
            results=results,
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        logger.error(f"Quick search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/similar", tags=["Search"])
async def get_similar(request: SimilarRequest):
    """
    Get properties similar to a given property.
    Uses vector similarity.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="Search service not ready")

    start_time = time.time()

    try:
        result = rag_pipeline.get_similar(request.property_id, request.top_k)
        processing_time = (time.time() - start_time) * 1000

        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])

        return {
            "success": True,
            "base_property": result["base_property"],
            "similar_properties": result["similar_properties"],
            "processing_time_ms": round(processing_time, 2)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Similar search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/property/{property_id}", tags=["Properties"])
async def get_property(property_id: str):
    """Get a specific property by ID."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Service not ready")

    prop = vector_store.get_property_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    return {
        "success": True,
        "data": prop
    }


@app.get("/api/stats", tags=["Properties"])
async def get_stats():
    """Get index statistics."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Service not ready")

    properties = vector_store.properties

    # Count by category
    sale_count = sum(1 for p in properties if p.get("category") == "SALE")
    rent_count = sum(1 for p in properties if p.get("category") == "RENT")

    # Count by type
    type_counts = {}
    for p in properties:
        t = p.get("type", "Autre")
        type_counts[t] = type_counts.get(t, 0) + 1

    # Count by location
    location_counts = {}
    for p in properties:
        loc = p.get("location", "")
        if loc:
            location_counts[loc] = location_counts.get(loc, 0) + 1

    return {
        "success": True,
        "total_properties": len(properties),
        "by_category": {
            "SALE": sale_count,
            "RENT": rent_count
        },
        "by_type": sorted(type_counts.items(), key=lambda x: x[1], reverse=True),
        "by_location": sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:20],
        "index_dimension": vector_store.index.d if vector_store.index else 0
    }


@app.post("/api/rebuild-index", tags=["System"])
async def rebuild_index(background_tasks: BackgroundTasks):
    """
    Rebuild the FAISS index.
    Runs in background.
    """
    if not vector_store:
        raise HTTPException(status_code=503, detail="Service not ready")

    def rebuild():
        logger.info("Rebuilding index...")
        vector_store.build_index(force_rebuild=True)
        logger.info("Index rebuilt successfully")

    background_tasks.add_task(rebuild)

    return {
        "success": True,
        "message": "Index rebuild started in background"
    }


# ============================================================================
# CHATBOT ENDPOINTS
# ============================================================================

@app.post("/api/chat", tags=["Chatbot"])
async def chat(request: ChatRequest):
    """
    Chat with NOUR, the Elite Real Estate Agent.

    This endpoint supports both streaming and non-streaming responses.
    For streaming, set stream=true and consume as Server-Sent Events.
    """
    if not real_estate_agent:
        raise HTTPException(status_code=503, detail="Chatbot not ready")

    start_time = time.time()

    if request.stream:
        # Streaming response
        async def generate():
            try:
                for chunk in real_estate_agent.stream_chat(
                    request.message,
                    conversation_id=request.conversation_id
                ):
                    if chunk["type"] == "content":
                        yield {
                            "event": "message",
                            "data": json.dumps({
                                "type": "content",
                                "content": chunk["content"]
                            })
                        }
                    elif chunk["type"] == "done":
                        yield {
                            "event": "message",
                            "data": json.dumps({
                                "type": "done",
                                "conversation_id": chunk["conversation_id"]
                            })
                        }
                    elif chunk["type"] == "error":
                        yield {
                            "event": "error",
                            "data": json.dumps({
                                "type": "error",
                                "error": chunk["error"]
                            })
                        }
            except Exception as e:
                logger.error(f"Stream chat error: {e}")
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "type": "error",
                        "error": str(e)
                    })
                }

        return EventSourceResponse(generate())

    else:
        # Non-streaming response
        try:
            result = real_estate_agent.chat(
                request.message,
                conversation_id=request.conversation_id
            )

            processing_time = (time.time() - start_time) * 1000

            return {
                "success": result["success"],
                "response": result["response"],
                "intent": result.get("intent"),
                "properties_shown": result.get("properties_shown"),
                "conversation_id": result["conversation_id"],
                "processing_time_ms": round(processing_time, 2)
            }

        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/clear", tags=["Chatbot"])
async def clear_chat(conversation_id: str = "default"):
    """Clear conversation history for a given conversation ID."""
    if not real_estate_agent:
        raise HTTPException(status_code=503, detail="Chatbot not ready")

    result = real_estate_agent.clear_conversation(conversation_id)
    return result


@app.get("/api/chat/status", tags=["Chatbot"])
async def chat_status():
    """Get chatbot status and capabilities."""
    return {
        "ready": real_estate_agent is not None,
        "agent_name": "NOUR",
        "capabilities": [
            "property_search",
            "property_details",
            "similar_properties",
            "market_insights",
            "neighborhood_expertise",
            "price_negotiation_advice"
        ],
        "supported_languages": ["fr", "ar", "en"],
        "model": "gpt-4o"
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=False,
        workers=1,
        log_level="info"
    )
