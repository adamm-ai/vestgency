"""
Configuration for RAG System
============================
CTO-level configuration for the intelligent property search system.
"""

import os
from pathlib import Path
from typing import Literal

# ============================================================================
# PATHS
# ============================================================================

BASE_DIR = Path(__file__).parent
PROJECT_DIR = BASE_DIR.parent

# Check if running in Render (data copied to rag_backend/data) or locally (../data)
LOCAL_DATA_DIR = BASE_DIR / "data"
PARENT_DATA_DIR = PROJECT_DIR / "data"
DATA_DIR = LOCAL_DATA_DIR if LOCAL_DATA_DIR.exists() else PARENT_DATA_DIR
PROPERTIES_JSON = DATA_DIR / "properties.json"
FAISS_INDEX_PATH = BASE_DIR / "faiss_index"
EMBEDDINGS_CACHE = BASE_DIR / "embeddings_cache.pkl"

# ============================================================================
# MODEL CONFIGURATION
# ============================================================================

# Sentence Transformer model - multilingual for French support
# Options:
# - "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" (384 dim, fast)
# - "sentence-transformers/distiluse-base-multilingual-cased-v2" (512 dim, balanced)
# - "sentence-transformers/paraphrase-multilingual-mpnet-base-v2" (768 dim, best quality)
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
EMBEDDING_DIMENSION = 768

# Alternative lightweight model for faster inference
EMBEDDING_MODEL_LITE = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIMENSION_LITE = 384

# ============================================================================
# SEARCH CONFIGURATION
# ============================================================================

# Top-K results for semantic search
DEFAULT_TOP_K = 20
MAX_TOP_K = 50

# Minimum similarity score (0-1) to include results
MIN_SIMILARITY_THRESHOLD = 0.25

# Boost factors for different match types
EXACT_MATCH_BOOST = 2.0
PARTIAL_MATCH_BOOST = 1.5
SEMANTIC_MATCH_BOOST = 1.0

# ============================================================================
# RAG CONFIGURATION
# ============================================================================

# Document chunking for embeddings
CHUNK_FIELDS = ["name", "description", "features", "location", "type", "city"]
CHUNK_SEPARATOR = " | "

# Query expansion
ENABLE_QUERY_EXPANSION = True
MAX_QUERY_EXPANSIONS = 3

# ============================================================================
# LANGGRAPH AGENT CONFIGURATION
# ============================================================================

# Agent workflow settings
AGENT_MAX_ITERATIONS = 3
AGENT_TIMEOUT_SECONDS = 30

# Intent classification thresholds
INTENT_CONFIDENCE_THRESHOLD = 0.7

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

SERVER_HOST = "0.0.0.0"
SERVER_PORT = int(os.getenv("PORT", 8001))  # Render uses PORT env var
CORS_ORIGINS = [
    "http://localhost:8000",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5173",
    "*"
]

# ============================================================================
# LOGGING
# ============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
