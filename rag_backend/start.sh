#!/bin/bash
# =============================================================================
# At Home RAG Search Server Startup Script
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          AT HOME RAG SEARCH SYSTEM                          ║"
echo "║   FAISS + Sentence Transformers + LangChain + LangGraph     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Change to script directory
cd "$(dirname "$0")"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if index needs to be built
if [ ! -f "embeddings_cache.pkl" ]; then
    echo -e "${YELLOW}Building FAISS index (first time setup)...${NC}"
    python main.py --build
fi

# Start server
echo -e "${GREEN}Starting RAG server on port 8001...${NC}"
echo -e "${BLUE}API Endpoints:${NC}"
echo "  - POST /api/search        - Intelligent RAG search"
echo "  - GET  /api/quick-search  - Fast autocomplete"
echo "  - POST /api/similar       - Similar properties"
echo "  - GET  /health            - Health check"
echo ""
echo -e "${GREEN}Server starting...${NC}"

python main.py
