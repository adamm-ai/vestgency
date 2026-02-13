"""
Embeddings Module
=================
Sentence Transformers-based embedding generation for property documents.
Optimized for French real estate content.
"""

import pickle
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

from config import (
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSION,
    EMBEDDINGS_CACHE,
    CHUNK_FIELDS,
    CHUNK_SEPARATOR
)

logger = logging.getLogger(__name__)


class PropertyEmbedder:
    """
    Generates high-quality embeddings for property documents using
    Sentence Transformers multilingual models.
    """

    def __init__(self, model_name: str = EMBEDDING_MODEL):
        """Initialize the embedding model."""
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Model loaded. Embedding dimension: {self.dimension}")

    def create_document_text(self, property_data: Dict[str, Any]) -> str:
        """
        Create a rich text representation of a property for embedding.
        Combines multiple fields for comprehensive semantic understanding.
        """
        parts = []

        # Property name (highest importance)
        if property_data.get("name"):
            parts.append(f"Bien: {property_data['name']}")

        # Type and category
        prop_type = property_data.get("type", "")
        category = property_data.get("category", "")
        category_fr = "à vendre" if category == "SALE" else "à louer"
        if prop_type:
            parts.append(f"Type: {prop_type} {category_fr}")

        # Location
        location = property_data.get("location", "")
        city = property_data.get("city", "Casablanca")
        if location:
            parts.append(f"Localisation: {location}, {city}")

        # Price
        price = property_data.get("price", "")
        if price:
            parts.append(f"Prix: {price}")

        # Specifications
        specs = []
        if property_data.get("beds"):
            specs.append(f"{property_data['beds']} chambres")
        if property_data.get("baths"):
            specs.append(f"{property_data['baths']} salles de bain")
        if property_data.get("area"):
            specs.append(f"Surface: {property_data['area']}")
        if specs:
            parts.append(f"Caractéristiques: {', '.join(specs)}")

        # Features
        features = property_data.get("features", [])
        if features:
            parts.append(f"Équipements: {', '.join(features)}")

        # Smart tags
        smart_tags = property_data.get("smartTags", [])
        if smart_tags:
            parts.append(f"Tags: {', '.join(smart_tags)}")

        # Description (truncated for embedding efficiency)
        description = property_data.get("description", "")
        if description:
            # Keep first 500 chars of description
            desc_truncated = description[:500] + "..." if len(description) > 500 else description
            parts.append(f"Description: {desc_truncated}")

        return CHUNK_SEPARATOR.join(parts)

    def embed_text(self, text: str) -> np.ndarray:
        """Generate embedding for a single text."""
        return self.model.encode(text, normalize_embeddings=True, show_progress_bar=False)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings for multiple texts with batching."""
        logger.info(f"Embedding {len(texts)} texts...")
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=batch_size,
            show_progress_bar=True
        )
        logger.info(f"Embeddings generated. Shape: {embeddings.shape}")
        return embeddings

    def embed_properties(self, properties: List[Dict[str, Any]]) -> tuple[np.ndarray, List[str]]:
        """
        Generate embeddings for all properties.
        Returns embeddings array and list of property IDs.
        """
        texts = []
        ids = []

        for prop in properties:
            doc_text = self.create_document_text(prop)
            texts.append(doc_text)
            ids.append(prop["id"])

        embeddings = self.embed_texts(texts)
        return embeddings, ids

    def embed_query(self, query: str) -> np.ndarray:
        """
        Generate embedding for a search query.
        Adds query-specific prefix for better retrieval.
        """
        # Prefix for asymmetric search (query vs documents)
        prefixed_query = f"Recherche immobilière: {query}"
        return self.embed_text(prefixed_query)

    def save_embeddings(
        self,
        embeddings: np.ndarray,
        property_ids: List[str],
        path: Path = EMBEDDINGS_CACHE
    ) -> None:
        """Save embeddings to cache file."""
        cache_data = {
            "embeddings": embeddings,
            "property_ids": property_ids,
            "model_name": self.model_name,
            "dimension": self.dimension
        }
        with open(path, "wb") as f:
            pickle.dump(cache_data, f)
        logger.info(f"Embeddings cached to {path}")

    def load_embeddings(self, path: Path = EMBEDDINGS_CACHE) -> Optional[tuple[np.ndarray, List[str]]]:
        """Load embeddings from cache if available."""
        if not path.exists():
            return None

        try:
            with open(path, "rb") as f:
                cache_data = pickle.load(f)

            # Verify model compatibility
            if cache_data.get("model_name") != self.model_name:
                logger.warning("Cache model mismatch. Regenerating embeddings.")
                return None

            logger.info(f"Loaded cached embeddings: {len(cache_data['property_ids'])} properties")
            return cache_data["embeddings"], cache_data["property_ids"]
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
            return None


class QueryExpander:
    """
    Expands user queries with synonyms and related terms
    for better semantic search coverage.
    """

    # French real estate synonyms
    SYNONYMS = {
        "appartement": ["appart", "flat", "logement", "résidence"],
        "villa": ["maison", "demeure", "propriété", "pavillon"],
        "bureau": ["office", "local professionnel", "espace de travail"],
        "magasin": ["boutique", "commerce", "local commercial", "shop"],
        "luxe": ["haut standing", "prestige", "premium", "haut de gamme"],
        "meublé": ["équipé", "aménagé", "furnished"],
        "terrasse": ["balcon", "rooftop", "extérieur"],
        "piscine": ["pool", "bassin"],
        "garage": ["parking", "stationnement", "place de parking"],
        "neuf": ["nouveau", "récent", "moderne", "contemporain"],
        "centre ville": ["centre", "downtown", "hyper centre"],
        "calme": ["tranquille", "paisible", "résidentiel"],
        "vue mer": ["vue océan", "front de mer", "bord de mer"],
        "jardin": ["espace vert", "terrain", "extérieur"],
        "lumineux": ["clair", "ensoleillé", "baigné de lumière"],
        "spacieux": ["grand", "vaste", "généreux"],
        "standing": ["luxe", "haut de gamme", "prestige"],
        "location": ["louer", "à louer", "bail"],
        "achat": ["vente", "acheter", "à vendre"],
        "chambres": ["pièces", "ch", "bedroom"],
    }

    # Location aliases
    LOCATION_ALIASES = {
        "casa": "casablanca",
        "anfa": "anfa",
        "californie": "californie",
        "bouskoura": "bouskoura",
        "ain diab": "ain diab",
        "maarif": "maarif",
        "racine": "racine",
        "gauthier": "gauthier",
        "triangle d'or": "triangle d'or",
        "corniche": "corniche",
    }

    @classmethod
    def expand_query(cls, query: str) -> List[str]:
        """
        Generate expanded versions of the query.
        Returns original query + expanded versions.
        """
        expanded = [query]
        query_lower = query.lower()

        # Add synonym expansions
        for term, synonyms in cls.SYNONYMS.items():
            if term in query_lower:
                for synonym in synonyms[:2]:  # Limit to 2 synonyms per term
                    expanded_query = query_lower.replace(term, synonym)
                    if expanded_query not in expanded:
                        expanded.append(expanded_query)

        # Add location expansions
        for alias, full_name in cls.LOCATION_ALIASES.items():
            if alias in query_lower and alias != full_name:
                expanded_query = query_lower.replace(alias, full_name)
                if expanded_query not in expanded:
                    expanded.append(expanded_query)

        return expanded[:4]  # Limit total expansions
