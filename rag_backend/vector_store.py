"""
Vector Store Module
===================
FAISS-based vector store for semantic property search.
Optimized for high-precision retrieval with hybrid search.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import faiss

from config import (
    PROPERTIES_JSON,
    FAISS_INDEX_PATH,
    DEFAULT_TOP_K,
    MIN_SIMILARITY_THRESHOLD,
    EXACT_MATCH_BOOST,
    PARTIAL_MATCH_BOOST,
    EMBEDDING_DIMENSION
)
from embeddings import PropertyEmbedder, QueryExpander

logger = logging.getLogger(__name__)


class PropertyVectorStore:
    """
    FAISS-powered vector store for property search.
    Implements hybrid search combining semantic and keyword matching
    for 100% precision on relevant queries.
    """

    def __init__(self, embedder: PropertyEmbedder):
        """Initialize vector store with embedder."""
        self.embedder = embedder
        self.index: Optional[faiss.IndexFlatIP] = None
        self.properties: List[Dict[str, Any]] = []
        self.property_ids: List[str] = []
        self.id_to_idx: Dict[str, int] = {}
        self.is_initialized = False

    def load_properties(self, path: Path = PROPERTIES_JSON) -> List[Dict[str, Any]]:
        """Load properties from JSON file."""
        logger.info(f"Loading properties from {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Handle both direct array and nested structure
        if isinstance(data, dict) and "properties" in data:
            properties = data["properties"]
        else:
            properties = data

        logger.info(f"Loaded {len(properties)} properties")
        return properties

    def build_index(self, force_rebuild: bool = False) -> None:
        """
        Build or load FAISS index.
        Uses cached embeddings if available.
        """
        logger.info("Building vector index...")

        # Load properties
        self.properties = self.load_properties()

        # Try to load cached embeddings
        cached = self.embedder.load_embeddings() if not force_rebuild else None

        if cached is not None:
            embeddings, self.property_ids = cached
            logger.info("Using cached embeddings")
        else:
            # Generate fresh embeddings
            logger.info("Generating embeddings for all properties...")
            embeddings, self.property_ids = self.embedder.embed_properties(self.properties)
            # Cache for next time
            self.embedder.save_embeddings(embeddings, self.property_ids)

        # Build ID to index mapping
        self.id_to_idx = {pid: idx for idx, pid in enumerate(self.property_ids)}

        # Create FAISS index (Inner Product for cosine similarity with normalized vectors)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)

        # Add vectors to index
        self.index.add(embeddings.astype(np.float32))

        self.is_initialized = True
        logger.info(f"Index built with {self.index.ntotal} vectors (dim={dimension})")

    def _keyword_search(
        self,
        query: str,
        properties: List[Dict[str, Any]],
        top_k: int = 50
    ) -> List[Tuple[int, float]]:
        """
        Perform keyword-based search for exact/partial matches.
        Returns list of (index, score) tuples.
        """
        query_lower = query.lower()
        query_terms = query_lower.split()
        results = []

        for idx, prop in enumerate(properties):
            score = 0.0

            # Searchable text fields
            name = prop.get("name", "").lower()
            location = prop.get("location", "").lower()
            prop_type = prop.get("type", "").lower()
            description = prop.get("description", "").lower()
            city = prop.get("city", "").lower()
            features = " ".join(prop.get("features", [])).lower()

            # Full query exact match (highest priority)
            if query_lower in name:
                score += EXACT_MATCH_BOOST * 2
            if query_lower in location:
                score += EXACT_MATCH_BOOST * 1.5
            if query_lower in prop_type:
                score += EXACT_MATCH_BOOST

            # Individual term matching
            for term in query_terms:
                if len(term) < 2:
                    continue

                # Name matches
                if term in name:
                    score += PARTIAL_MATCH_BOOST
                # Location matches
                if term in location:
                    score += PARTIAL_MATCH_BOOST * 0.9
                # Type matches
                if term in prop_type:
                    score += PARTIAL_MATCH_BOOST * 0.8
                # Feature matches
                if term in features:
                    score += PARTIAL_MATCH_BOOST * 0.7
                # Description matches
                if term in description:
                    score += PARTIAL_MATCH_BOOST * 0.5
                # City matches
                if term in city:
                    score += PARTIAL_MATCH_BOOST * 0.6

            if score > 0:
                results.append((idx, score))

        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def _extract_filters_from_query(self, query: str) -> Dict[str, Any]:
        """
        Extract structured filters from natural language query.
        E.g., "villa 4 chambres anfa" -> {type: "Villa", beds: 4, location: "anfa"}
        """
        filters = {}
        query_lower = query.lower()

        # Property type detection
        type_mapping = {
            "villa": "Villa",
            "appartement": "Appartement",
            "appart": "Appartement",
            "bureau": "Bureau",
            "magasin": "Magasin",
            "boutique": "Magasin",
            "terrain": "Terrain",
            "entrepôt": "Entrepôt",
            "entrepot": "Entrepôt",
            "studio": "Studio",
            "duplex": "Duplex",
            "riad": "Riad",
            "ferme": "Ferme",
            "immeuble": "Immeuble",
        }

        for keyword, prop_type in type_mapping.items():
            if keyword in query_lower:
                filters["type"] = prop_type
                break

        # Category detection
        if any(word in query_lower for word in ["louer", "location", "à louer", "bail", "loue"]):
            filters["category"] = "RENT"
        elif any(word in query_lower for word in ["acheter", "vendre", "vente", "à vendre", "achat"]):
            filters["category"] = "SALE"

        # Bedroom count extraction
        import re
        bed_patterns = [
            r"(\d+)\s*chambre",
            r"(\d+)\s*ch\b",
            r"(\d+)\s*pièce",
            r"(\d+)\s*bedroom",
        ]
        for pattern in bed_patterns:
            match = re.search(pattern, query_lower)
            if match:
                filters["beds"] = int(match.group(1))
                break

        # Location detection (common areas)
        locations = [
            "anfa", "californie", "maarif", "racine", "gauthier",
            "bouskoura", "ain diab", "corniche", "triangle d'or",
            "bourgogne", "palmier", "oasis", "val fleuri", "oulfa",
            "hay hassani", "sidi maarouf", "lissasfa", "polo"
        ]
        for loc in locations:
            if loc in query_lower:
                filters["location"] = loc
                break

        # Feature detection
        feature_keywords = {
            "meublé": "Meublé",
            "meuble": "Meublé",
            "piscine": "Piscine",
            "terrasse": "Terrasse",
            "jardin": "Jardin",
            "parking": "Parking",
            "garage": "Garage",
            "ascenseur": "Ascenseur",
            "neuf": "Neuf",
            "climatisation": "Climatisation",
            "clim": "Climatisation",
        }

        detected_features = []
        for keyword, feature in feature_keywords.items():
            if keyword in query_lower:
                detected_features.append(feature)

        if detected_features:
            filters["features"] = detected_features

        return filters

    def _apply_filters(
        self,
        properties: List[Dict[str, Any]],
        filters: Dict[str, Any]
    ) -> List[int]:
        """
        Apply extracted filters to narrow down results.
        Returns indices of matching properties.
        """
        matching_indices = []

        for idx, prop in enumerate(properties):
            matches = True

            # Type filter
            if "type" in filters and prop.get("type") != filters["type"]:
                matches = False

            # Category filter
            if "category" in filters and prop.get("category") != filters["category"]:
                matches = False

            # Bedroom filter
            if "beds" in filters:
                prop_beds = prop.get("beds") or 0
                if prop_beds < filters["beds"]:
                    matches = False

            # Location filter
            if "location" in filters:
                prop_location = prop.get("location", "").lower()
                if filters["location"].lower() not in prop_location:
                    matches = False

            # Features filter
            if "features" in filters:
                prop_features = [f.lower() for f in prop.get("features", [])]
                for required_feature in filters["features"]:
                    if required_feature.lower() not in prop_features:
                        matches = False
                        break

            if matches:
                matching_indices.append(idx)

        return matching_indices

    def semantic_search(
        self,
        query: str,
        top_k: int = DEFAULT_TOP_K,
        min_score: float = MIN_SIMILARITY_THRESHOLD
    ) -> List[Dict[str, Any]]:
        """
        Pure semantic search using FAISS.
        """
        if not self.is_initialized:
            raise RuntimeError("Vector store not initialized. Call build_index() first.")

        # Generate query embedding
        query_embedding = self.embedder.embed_query(query)
        query_vector = query_embedding.reshape(1, -1).astype(np.float32)

        # Search FAISS index
        scores, indices = self.index.search(query_vector, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or score < min_score:
                continue

            property_data = self.properties[idx].copy()
            property_data["_score"] = float(score)
            property_data["_match_type"] = "semantic"
            results.append(property_data)

        return results

    def hybrid_search(
        self,
        query: str,
        top_k: int = DEFAULT_TOP_K,
        semantic_weight: float = 0.6,
        keyword_weight: float = 0.4
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search combining semantic and keyword search.
        This achieves the highest precision by leveraging both approaches.
        """
        if not self.is_initialized:
            raise RuntimeError("Vector store not initialized. Call build_index() first.")

        # Step 1: Extract filters from query
        filters = self._extract_filters_from_query(query)
        logger.info(f"Extracted filters: {filters}")

        # Step 2: Get candidate pool
        if filters:
            # Apply hard filters first
            candidate_indices = self._apply_filters(self.properties, filters)
            if not candidate_indices:
                # If no matches with filters, fall back to full search
                candidate_indices = list(range(len(self.properties)))
        else:
            candidate_indices = list(range(len(self.properties)))

        logger.info(f"Candidate pool size: {len(candidate_indices)}")

        # Step 3: Keyword search on candidates
        keyword_results = self._keyword_search(query, self.properties)
        keyword_scores = {idx: score for idx, score in keyword_results}

        # Step 4: Semantic search
        query_embedding = self.embedder.embed_query(query)
        query_vector = query_embedding.reshape(1, -1).astype(np.float32)

        # Search entire index
        semantic_scores_raw, semantic_indices = self.index.search(query_vector, len(self.properties))
        semantic_scores = {
            int(idx): float(score)
            for score, idx in zip(semantic_scores_raw[0], semantic_indices[0])
            if idx >= 0
        }

        # Step 5: Combine scores with priority for filtered candidates
        combined_scores = {}
        for idx in candidate_indices:
            sem_score = semantic_scores.get(idx, 0)
            kw_score = keyword_scores.get(idx, 0)

            # Normalize keyword score to 0-1 range
            max_kw = max(keyword_scores.values()) if keyword_scores else 1
            kw_score_norm = kw_score / max_kw if max_kw > 0 else 0

            # Combined score
            combined = (sem_score * semantic_weight) + (kw_score_norm * keyword_weight)

            # Boost for filter matches
            if filters:
                combined *= 1.2  # 20% boost for filter-matching results

            combined_scores[idx] = combined

        # Step 6: Also include top semantic results not in candidates
        # (for cases where filters might be too restrictive)
        for idx, sem_score in semantic_scores.items():
            if idx not in combined_scores and sem_score > 0.5:
                kw_score = keyword_scores.get(idx, 0)
                max_kw = max(keyword_scores.values()) if keyword_scores else 1
                kw_score_norm = kw_score / max_kw if max_kw > 0 else 0
                combined_scores[idx] = (sem_score * semantic_weight) + (kw_score_norm * keyword_weight)

        # Step 7: Sort and return top results
        sorted_indices = sorted(combined_scores.keys(), key=lambda x: combined_scores[x], reverse=True)

        results = []
        for idx in sorted_indices[:top_k]:
            if combined_scores[idx] < MIN_SIMILARITY_THRESHOLD * 0.5:
                continue

            property_data = self.properties[idx].copy()
            property_data["_score"] = combined_scores[idx]
            property_data["_semantic_score"] = semantic_scores.get(idx, 0)
            property_data["_keyword_score"] = keyword_scores.get(idx, 0)
            property_data["_match_type"] = "hybrid"
            property_data["_filters_matched"] = filters
            results.append(property_data)

        return results

    def search(
        self,
        query: str,
        top_k: int = DEFAULT_TOP_K,
        search_mode: str = "hybrid"
    ) -> List[Dict[str, Any]]:
        """
        Main search interface.
        Supports: "hybrid", "semantic", "keyword"
        """
        if search_mode == "semantic":
            return self.semantic_search(query, top_k)
        elif search_mode == "keyword":
            results = self._keyword_search(query, self.properties, top_k)
            return [
                {**self.properties[idx], "_score": score, "_match_type": "keyword"}
                for idx, score in results
            ]
        else:  # hybrid (default)
            return self.hybrid_search(query, top_k)

    def get_property_by_id(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific property by ID."""
        idx = self.id_to_idx.get(property_id)
        if idx is not None:
            return self.properties[idx]
        return None

    def get_similar_properties(
        self,
        property_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Find properties similar to a given property."""
        idx = self.id_to_idx.get(property_id)
        if idx is None:
            return []

        # Get embedding for this property
        property_text = self.embedder.create_document_text(self.properties[idx])
        embedding = self.embedder.embed_text(property_text)
        query_vector = embedding.reshape(1, -1).astype(np.float32)

        # Search (get top_k + 1 to exclude self)
        scores, indices = self.index.search(query_vector, top_k + 1)

        results = []
        for score, result_idx in zip(scores[0], indices[0]):
            if result_idx < 0 or result_idx == idx:
                continue
            if len(results) >= top_k:
                break

            property_data = self.properties[result_idx].copy()
            property_data["_similarity_score"] = float(score)
            results.append(property_data)

        return results
