# RAG Service Documentation

AI-powered semantic search service using FastAPI, FAISS, and OpenAI.

## Overview

The RAG (Retrieval-Augmented Generation) backend provides:
- **Semantic property search** using vector embeddings
- **Intent detection** (buy/rent/location/features)
- **AI chatbot** (NOUR) for conversational assistance
- **Hybrid search** combining semantic + keyword matching

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Server                           │
│                     (server.py)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Search     │  │   Chat       │  │  Properties  │      │
│  │   Endpoints  │  │   Endpoints  │  │  Endpoints   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                 ┌─────────▼─────────┐                       │
│                 │  PropertyVector   │                       │
│                 │  Store            │                       │
│                 └─────────┬─────────┘                       │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   FAISS     │  │   OpenAI    │  │  Metadata   │        │
│  │   Index     │  │   API       │  │  (JSON)     │        │
│  │  (384-dim)  │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd rag_backend
pip install -r requirements.txt
```

### 2. Configure Environment

```env
OPENAI_API_KEY=sk-your-key-here
PORT=8001
```

### 3. Start Server

```bash
python server.py
```

### 4. Verify

```bash
curl http://localhost:8001/health
```

---

## API Endpoints

### Health Check

```
GET /health

Response:
{
  "status": "healthy",
  "version": "2.1.0-memory",
  "index_loaded": true,
  "total_properties": 180,
  "embedding_model": "openai/text-embedding-3-small",
  "chatbot_ready": true
}
```

### Semantic Search

```
POST /api/search

Request:
{
  "query": "villa avec piscine à anfa",
  "top_k": 12,
  "mode": "hybrid",
  "filters": {
    "category": "SALE"
  }
}

Response:
{
  "success": true,
  "query": "villa avec piscine à anfa",
  "intent": "buy",
  "confidence": 0.85,
  "filters_detected": {
    "type": "Villa",
    "location": "anfa",
    "features": ["Piscine"]
  },
  "total_results": 3,
  "results": [
    {
      "id": "prop-123",
      "name": "Villa Luxe Anfa",
      "type": "Villa",
      "category": "SALE",
      "price": "15,000,000 MAD",
      "_score": 0.92
    }
  ],
  "processing_time_ms": 145
}
```

### Quick Search (Autocomplete)

```
GET /api/quick-search?q=villa&limit=8

Response:
{
  "success": true,
  "query": "villa",
  "results": [...],
  "processing_time_ms": 45
}
```

### AI Chat

```
POST /api/chat

Request:
{
  "message": "Je cherche un appartement à Maarif",
  "conversation_id": "session-123",
  "stream": false
}

Response:
{
  "success": true,
  "response": "Je vous ai trouvé plusieurs appartements...",
  "conversation_id": "session-123",
  "analysis": {
    "urgency": "medium",
    "reason": "Standard property search"
  },
  "message_count": 3
}
```

### Chat Status

```
GET /api/chat/status

Response:
{
  "ready": true,
  "agent_name": "NOUR",
  "capabilities": ["property_search", "property_details", "urgency_detection"],
  "model": "gpt-4o-mini"
}
```

### Properties

```
GET /api/properties?category=SALE&type=Villa&page=1&limit=12

GET /api/property/{property_id}

GET /api/filters

GET /api/stats
```

---

## Vector Search

### FAISS Configuration

```python
Index Type: IndexFlatIP (Inner Product)
Dimensions: 384
Similarity: Cosine (via L2 normalization)
```

### Embedding Model

```python
Model: text-embedding-3-small (OpenAI)
Dimensions: 384 (truncated)
Normalization: L2
```

### Index Files

```
faiss_index/
├── index.faiss      # FAISS binary index (~55KB)
└── metadata.json    # Property metadata (~66KB)
```

### Hybrid Search Algorithm

```
1. EXTRACT FILTERS
   - Detect: type, category, location, beds, features
   
2. GET CANDIDATES
   - Apply hard filters if extracted
   
3. KEYWORD SEARCH
   - Exact match boost: 2.0x
   - Partial match boost: 1.5x
   
4. SEMANTIC SEARCH
   - Generate query embedding (OpenAI)
   - FAISS similarity search (top_k * 2)
   
5. SCORE COMBINATION
   - Combined = (semantic * 0.6) + (keyword * 0.4)
   - Filter match boost: 1.2x
   
6. RANK & RETURN
   - Sort by combined score
   - Return top_k results
```

---

## Intent Classification

### Supported Intents

| Intent | Keywords | Action |
|--------|----------|--------|
| buy | acheter, achat, vendre | category=SALE |
| rent | louer, location, bail | category=RENT |
| search_type | villa, appartement, bureau | filter_type |
| search_location | anfa, maarif, california | filter_location |
| search_features | piscine, terrasse, meublé | filter_features |
| similar | similaire, comme, ressemblant | find_similar |

### Location Detection

```python
LOCATIONS = [
  "anfa", "californie", "maarif", "racine", "gauthier",
  "bouskoura", "ain diab", "corniche", "triangle d'or",
  "bourgogne", "palmier", "oasis", "val fleuri", "oulfa"
]
```

### Feature Detection

```python
FEATURES = {
  "meublé": "Meublé",
  "piscine": "Piscine",
  "terrasse": "Terrasse",
  "jardin": "Jardin",
  "parking": "Parking",
  "garage": "Garage",
  "ascenseur": "Ascenseur",
  "climatisation": "Climatisation"
}
```

---

## NOUR Chatbot

### Configuration

```python
Model: gpt-4o-mini
Temperature: 0.3
Max Tokens: 500
Language: French
```

### System Prompt

```
Tu es NOUR, l'assistante immobilière d'élite d'At Home.
Tu parles français principalement et tu es experte du marché immobilier marocain.
Voici les biens pertinents pour la requête du client:
[5 most relevant properties]

Réponds de manière professionnelle et aide le client à trouver le bien idéal.
```

### Conversation Memory

- Maintains last 6 messages per session
- Includes 5 relevant properties as context
- Sessions keyed by `conversation_id`

### Urgency Detection

```python
# Triggered every 3+ messages
# Analyzed before clearing conversation

Levels:
- low: Casual browsing
- medium: Standard interest (default)
- high: Actively comparing, time constraints
- critical: Must act soon

Response:
{
  "urgency": "high",
  "reason": "Client expressed deadline"
}
```

---

## Performance

### Memory Profile

| Component | Size |
|-----------|------|
| FAISS Index | ~55 KB |
| Metadata | ~66 KB |
| Embeddings Cache | ~56 KB |
| OpenAI Client | <1 MB |
| FastAPI Runtime | ~20 MB |
| **Total** | **~100 MB** |

### Latency

| Operation | Time |
|-----------|------|
| Query Embedding | 50-100 ms |
| FAISS Search | 5-10 ms |
| Keyword Search | 20-50 ms |
| Hybrid Total | 100-150 ms |
| Chat Response | 500-2000 ms |

---

## Regenerating Index

### When to Regenerate

- New properties added
- Property data updated
- Embedding model changed

### Process

```bash
cd rag_backend
python generate_index.py
```

### Script Actions

1. Load `properties.json`
2. Generate document text per property
3. Create embeddings (Sentence Transformers)
4. Build FAISS index
5. Save index + metadata

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OPENAI_API_KEY | Yes | - | OpenAI API key |
| PORT | No | 8001 | Server port |
| LOG_LEVEL | No | INFO | Logging level |

### Server Settings

```python
HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", 8001))
CORS_ORIGINS = ["*"]
```

---

## Dependencies

### Production

```
fastapi>=0.100.0
uvicorn[standard]>=0.25.0
pydantic>=2.0.0
faiss-cpu>=1.7.4
openai>=1.0.0
python-dotenv>=1.0.0
httpx>=0.24.0
orjson>=3.9.0
numpy>=1.24.0
python-multipart>=0.0.6
sse-starlette>=1.0.0
```

### Index Generation (Local)

```
sentence-transformers
faiss-cpu
```

---

## Troubleshooting

### Index Not Loading

```bash
# Verify files exist
ls -la faiss_index/

# Check permissions
chmod 644 faiss_index/*

# Regenerate if corrupted
python generate_index.py
```

### OpenAI Errors

```bash
# Verify API key
echo $OPENAI_API_KEY

# Check quota
# Visit: platform.openai.com/usage

# Fallback to keyword search
# System auto-degrades if OpenAI unavailable
```

### Memory Issues

```bash
# Check memory usage
python -c "import faiss; print(faiss.get_num_gpus())"

# Use CPU-only FAISS
pip install faiss-cpu  # Not faiss-gpu
```

### Slow Responses

- Check OpenAI API latency
- Reduce `top_k` parameter
- Enable response caching (TODO)
- Use keyword-only mode for quick searches
