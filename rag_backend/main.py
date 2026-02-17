#!/usr/bin/env python3
"""
At Home RAG Search System
===========================
Entry point for the intelligent property search system.

Usage:
    python main.py          # Start the server
    python main.py --build  # Build index only
    python main.py --test   # Run test queries
"""

import argparse
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def build_index():
    """Build the FAISS index from properties."""
    from embeddings import PropertyEmbedder
    from vector_store import PropertyVectorStore

    logger.info("Building FAISS index...")

    embedder = PropertyEmbedder()
    store = PropertyVectorStore(embedder)
    store.build_index(force_rebuild=True)

    logger.info(f"Index built successfully with {store.index.ntotal} vectors")
    return store


def test_search():
    """Run test queries to verify the system."""
    from embeddings import PropertyEmbedder
    from vector_store import PropertyVectorStore
    from agent import PropertySearchAgent

    logger.info("Running test queries...")

    # Initialize
    embedder = PropertyEmbedder()
    store = PropertyVectorStore(embedder)
    store.build_index()
    agent = PropertySearchAgent(store)

    # Test queries
    test_queries = [
        "villa avec piscine à anfa",
        "appartement 3 chambres à louer maarif",
        "bureau moderne centre ville",
        "grand appartement lumineux",
        "maison familiale avec jardin",
        "studio meublé location",
        "local commercial californie",
        "villa luxe bouskoura",
    ]

    results_summary = []

    for query in test_queries:
        logger.info(f"\n{'='*60}")
        logger.info(f"Query: {query}")
        logger.info("="*60)

        result = agent.search(query)

        logger.info(f"Intent: {result['intent']} (confidence: {result['confidence']:.2f})")
        logger.info(f"Filters detected: {result['filters_detected']}")
        logger.info(f"Results: {result['total_results']}")

        if result['results']:
            logger.info("\nTop 3 results:")
            for i, prop in enumerate(result['results'][:3], 1):
                logger.info(f"  {i}. {prop['name'][:50]}...")
                logger.info(f"     Type: {prop['type']} | Location: {prop['location']} | Price: {prop['price']}")
                logger.info(f"     Score: {prop.get('_final_score', prop.get('_score', 0)):.4f}")

        results_summary.append({
            "query": query,
            "intent": result["intent"],
            "count": result["total_results"]
        })

    # Summary
    logger.info(f"\n{'='*60}")
    logger.info("TEST SUMMARY")
    logger.info("="*60)
    for r in results_summary:
        logger.info(f"  [{r['intent']:12}] {r['query'][:40]:40} -> {r['count']} results")


def start_server():
    """Start the FastAPI server."""
    import uvicorn
    from config import SERVER_HOST, SERVER_PORT

    logger.info(f"Starting RAG server on {SERVER_HOST}:{SERVER_PORT}")

    uvicorn.run(
        "server:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=False,
        workers=1,
        log_level="info"
    )


def main():
    parser = argparse.ArgumentParser(description="At Home RAG Search System")
    parser.add_argument("--build", action="store_true", help="Build index only")
    parser.add_argument("--test", action="store_true", help="Run test queries")
    parser.add_argument("--port", type=int, default=8001, help="Server port")

    args = parser.parse_args()

    if args.build:
        build_index()
    elif args.test:
        test_search()
    else:
        # Update port if specified
        if args.port != 8001:
            import config
            config.SERVER_PORT = args.port
        start_server()


if __name__ == "__main__":
    main()
