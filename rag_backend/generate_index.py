"""
Generate FAISS Index Locally
=============================
Run this script locally to pre-compute embeddings and build the FAISS index.
This allows the production server to run without loading ML models.

Usage:
    python generate_index.py

Requirements (local only):
    pip install sentence-transformers faiss-cpu
"""

import json
import pickle
import numpy as np
from pathlib import Path

# Try to import sentence-transformers (only needed locally)
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("ERROR: sentence-transformers not installed.")
    print("Run: pip install sentence-transformers")
    exit(1)

try:
    import faiss
except ImportError:
    print("ERROR: faiss-cpu not installed.")
    print("Run: pip install faiss-cpu")
    exit(1)

# Configuration
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR.parent / "data"
PROPERTIES_JSON = DATA_DIR / "properties.json"
INDEX_DIR = BASE_DIR / "faiss_index"
EMBEDDINGS_CACHE = BASE_DIR / "embeddings_cache.pkl"

# Model - multilingual for French support
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIMENSION = 384


def load_properties():
    """Load properties from JSON file."""
    print(f"Loading properties from {PROPERTIES_JSON}")

    with open(PROPERTIES_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict) and "properties" in data:
        properties = data["properties"]
    else:
        properties = data

    print(f"Loaded {len(properties)} properties")
    return properties


def create_search_text(prop: dict) -> str:
    """Create searchable text from property."""
    parts = []

    # Name and type
    if prop.get("name"):
        parts.append(prop["name"])
    if prop.get("type"):
        parts.append(prop["type"])

    # Location info
    if prop.get("location"):
        parts.append(prop["location"])
    if prop.get("city"):
        parts.append(prop["city"])

    # Category
    category = prop.get("category", "")
    if category == "SALE":
        parts.append("à vendre vente achat")
    elif category == "RENT":
        parts.append("à louer location")

    # Features
    features = prop.get("features", [])
    if features:
        parts.append(" ".join(features))

    # Description (truncated)
    desc = prop.get("description", "")
    if desc:
        parts.append(desc[:500])

    # Price info
    price = prop.get("price", "")
    if price:
        parts.append(price)

    # Size info
    if prop.get("beds"):
        parts.append(f"{prop['beds']} chambres")
    if prop.get("baths"):
        parts.append(f"{prop['baths']} salles de bain")
    if prop.get("area"):
        parts.append(prop["area"])

    return " | ".join(parts)


def generate_embeddings(properties: list, model: SentenceTransformer) -> np.ndarray:
    """Generate embeddings for all properties."""
    print(f"Generating embeddings for {len(properties)} properties...")

    # Create search texts
    texts = [create_search_text(prop) for prop in properties]

    # Generate embeddings in batches
    batch_size = 32
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        embeddings = model.encode(batch, show_progress_bar=False, normalize_embeddings=True)
        all_embeddings.append(embeddings)
        print(f"  Processed {min(i + batch_size, len(texts))}/{len(texts)}")

    embeddings_array = np.vstack(all_embeddings).astype(np.float32)
    print(f"Generated embeddings with shape: {embeddings_array.shape}")

    return embeddings_array


def build_faiss_index(embeddings: np.ndarray) -> faiss.Index:
    """Build FAISS index from embeddings."""
    print("Building FAISS index...")

    dimension = embeddings.shape[1]

    # Use IndexFlatIP for cosine similarity (embeddings are normalized)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    print(f"FAISS index built with {index.ntotal} vectors")
    return index


def save_index(index: faiss.Index, properties: list, embeddings: np.ndarray):
    """Save FAISS index and metadata."""
    # Create index directory
    INDEX_DIR.mkdir(exist_ok=True)

    # Save FAISS index
    index_path = INDEX_DIR / "index.faiss"
    faiss.write_index(index, str(index_path))
    print(f"Saved FAISS index to {index_path}")

    # Save property metadata (without embeddings, just for ID lookup)
    metadata = []
    for prop in properties:
        metadata.append({
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
            "url": prop.get("url", "")
        })

    metadata_path = INDEX_DIR / "metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"Saved metadata to {metadata_path}")

    # Save embeddings cache (for similar property search)
    cache_data = {
        "embeddings": embeddings,
        "property_ids": [p.get("id") for p in properties]
    }
    with open(EMBEDDINGS_CACHE, "wb") as f:
        pickle.dump(cache_data, f)
    print(f"Saved embeddings cache to {EMBEDDINGS_CACHE}")


def main():
    """Main function to generate index."""
    print("=" * 60)
    print("FAISS Index Generator")
    print("=" * 60)

    # Load properties
    properties = load_properties()

    # Load embedding model
    print(f"\nLoading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print("Model loaded successfully")

    # Generate embeddings
    embeddings = generate_embeddings(properties, model)

    # Build FAISS index
    index = build_faiss_index(embeddings)

    # Save everything
    save_index(index, properties, embeddings)

    print("\n" + "=" * 60)
    print("Index generation complete!")
    print("=" * 60)
    print(f"\nFiles created:")
    print(f"  - {INDEX_DIR / 'index.faiss'}")
    print(f"  - {INDEX_DIR / 'metadata.json'}")
    print(f"  - {EMBEDDINGS_CACHE}")
    print(f"\nNow commit these files and deploy to Render.")


if __name__ == "__main__":
    main()
