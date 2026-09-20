"""Medical RAG Vector Retriever for BloomCare AI Assistant.

Implements a pure-Python, zero-dependency hybrid vector retriever (TF-IDF + Cosine Similarity
+ Semantic Keyword Boosting) with persistent indexing and source transparency.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from .processor import DocumentChunk, MedicalDocumentProcessor

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
    "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
    "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "she", "should", "so", "some", "such", "than", "that", "the", "their",
    "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "we", "were",
    "what", "when", "where", "which", "while", "who", "whom", "why", "with", "would",
    "you", "your", "yours", "yourself", "yourselves"
}


def tokenize(text: str) -> List[str]:
    """Tokenizes and normalizes text into alphanumeric lowercase tokens."""
    tokens = re.findall(r"\b[a-zA-Z0-9_\-]{2,}\b", text.lower())
    return [t for t in tokens if t not in STOP_WORDS]


class MedicalRAGRetriever:
    """Hybrid Vector Space Retriever for BloomCare trusted medical knowledge."""

    def __init__(self, processor: Optional[MedicalDocumentProcessor] = None, index_file: Optional[Path] = None):
        self.processor = processor or MedicalDocumentProcessor()
        base_dir = Path(__file__).parent.parent / "data"
        self.index_file = index_file or (base_dir / "rag_index.json")

        self.chunks: List[DocumentChunk] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.chunk_vectors: List[Dict[str, float]] = []
        self.chunk_norms: List[float] = []

        self.initialize_index()

    def initialize_index(self, force_rebuild: bool = False) -> None:
        """Loads chunks and builds TF-IDF vector index."""
        if not force_rebuild and self._load_cached_index():
            return

        self.chunks = self.processor.load_all_chunks()
        self._build_vector_index()
        self._save_cached_index()

    def _build_vector_index(self) -> None:
        """Computes TF-IDF index across all document chunks."""
        n_docs = len(self.chunks)
        if n_docs == 0:
            return

        doc_frequencies: Dict[str, int] = {}
        chunk_tfs: List[Dict[str, float]] = []

        for chunk in self.chunks:
            # Emphasize title and section in text weighting
            full_text = f"{chunk.title} {chunk.title} {chunk.section} {chunk.content} {' '.join(chunk.tags)}"
            tokens = tokenize(full_text)
            term_counts: Dict[str, int] = {}
            for t in tokens:
                term_counts[t] = term_counts.get(t, 0) + 1

            # Sub-linear term frequency
            tf: Dict[str, float] = {}
            total = len(tokens) or 1
            for t, count in term_counts.items():
                tf[t] = 1.0 + math.log(count)

            chunk_tfs.append(tf)

            for term in term_counts.keys():
                doc_frequencies[term] = doc_frequencies.get(term, 0) + 1

        # Calculate IDF
        self.idf = {}
        for term, df in doc_frequencies.items():
            # Smooth IDF
            self.idf[term] = math.log((n_docs + 1) / (df + 1)) + 1.0

        # Calculate TF-IDF vectors and Euclidean norms
        self.chunk_vectors = []
        self.chunk_norms = []

        for tf in chunk_tfs:
            vec: Dict[str, float] = {}
            sum_sq = 0.0
            for term, val in tf.items():
                tfidf = val * self.idf.get(term, 1.0)
                vec[term] = tfidf
                sum_sq += tfidf * tfidf

            norm = math.sqrt(sum_sq) or 1.0
            self.chunk_vectors.append(vec)
            self.chunk_norms.append(norm)

    def _save_cached_index(self) -> None:
        """Saves current index metadata to disk."""
        try:
            payload = {
                "chunks": [c.to_dict() for c in self.chunks],
                "idf": self.idf,
                "timestamp": str(Path(__file__).stat().st_mtime),
            }
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"[RAG Retriever] Warning: Could not cache index: {e}")

    def _load_cached_index(self) -> bool:
        """Loads cached index if available."""
        if not self.index_file.exists():
            return False
        try:
            with open(self.index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            chunks_data = data.get("chunks", [])
            if not chunks_data:
                return False

            self.chunks = [DocumentChunk.from_dict(d) for d in chunks_data]
            self.idf = data.get("idf", {})
            self._build_vector_index()
            return True
        except Exception:
            return False

    def retrieve(self, query: str, top_k: int = 3, min_score: float = 0.12) -> Tuple[List[Dict[str, Any]], bool]:
        """Retrieves top-k most relevant chunks using hybrid vector similarity and keyword booster.

        Returns:
            Tuple of (ranked_results, is_confident).
        """
        query_tokens = tokenize(query)
        if not query_tokens or not self.chunk_vectors:
            return [], False

        # Build query TF-IDF vector
        q_counts: Dict[str, int] = {}
        for t in query_tokens:
            q_counts[t] = q_counts.get(t, 0) + 1

        q_vec: Dict[str, float] = {}
        q_sum_sq = 0.0
        for t, count in q_counts.items():
            if t in self.idf:
                val = (1.0 + math.log(count)) * self.idf[t]
                q_vec[t] = val
                q_sum_sq += val * val

        q_norm = math.sqrt(q_sum_sq)
        if q_norm == 0.0:
            return [], False

        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        q_terms_set = set(query_tokens)
        query_lower = query.lower()

        for idx, (c_vec, c_norm, chunk) in enumerate(zip(self.chunk_vectors, self.chunk_norms, self.chunks)):
            # 1. Cosine similarity
            dot_product = 0.0
            for t, q_val in q_vec.items():
                if t in c_vec:
                    dot_product += q_val * c_vec[t]

            cosine_sim = dot_product / (q_norm * c_norm) if (q_norm * c_norm) > 0 else 0.0

            # 2. Semantic Keyword & Title Booster
            title_lower = chunk.title.lower()
            section_lower = chunk.section.lower()
            content_lower = chunk.content.lower()

            # Generic terms that should not artificially boost matching
            GENERIC_EXCLUDE = {"bloomcare", "clinical", "guidance", "common", "diseases", "disease", "symptoms", "symptom", "protocols", "emergency", "health", "medical", "first", "care", "information"}

            # Exact section or drug name match in query
            if len(section_lower) > 3 and section_lower not in GENERIC_EXCLUDE and section_lower in query_lower:
                boost += 0.45
            elif any(w in query_lower for w in section_lower.split() if len(w) > 3 and w not in GENERIC_EXCLUDE):
                boost += 0.20

            # Matching tags
            tag_matches = sum(1 for tag in chunk.tags if tag in q_terms_set and tag not in GENERIC_EXCLUDE)
            if tag_matches > 0:
                boost += min(0.30, tag_matches * 0.10)

            # Check if query contains core specific symptoms/terms of this condition
            if "malaria" in query_lower and "malaria" in title_lower:
                boost += 0.50
            if "cough" in query_lower and "cough" in title_lower:
                boost += 0.50
            if "paracetamol" in query_lower and "paracetamol" in title_lower:
                boost += 0.50
            if "burn" in query_lower and "burn" in title_lower:
                boost += 0.50
            if "pregnan" in query_lower and "pregnan" in title_lower:
                boost += 0.40
            if "amoxicillin" in query_lower and "amoxicillin" in title_lower:
                boost += 0.50

            # Only allow boost if there is genuine content similarity
            if cosine_sim < 0.06:
                boost = boost * 0.25

            final_score = cosine_sim + boost

            if final_score >= min_score:
                scored_chunks.append((final_score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_chunks[:top_k]

        results: List[Dict[str, Any]] = []
        for score, chunk in top_matches:
            results.append({
                "chunk_id": chunk.chunk_id,
                "title": chunk.title,
                "section": chunk.section,
                "category": chunk.category,
                "content": chunk.content,
                "source_name": chunk.source_name,
                "score": round(score, 4),
            })

        # Confidence assessment
        is_confident = False
        if results and results[0]["score"] >= 0.28:
            is_confident = True

        return results, is_confident

    def format_source_attribution(self, chunk: Dict[str, Any]) -> str:
        """Formats clean source citation for transparent attribution."""
        src = chunk.get("source_name", "BloomCare Medical Knowledge Base")
        sec = chunk.get("section") or chunk.get("title", "")
        return f"📚 Information source: {src} — Section: {sec}"


# Singleton instance
_GLOBAL_RETRIEVER: Optional[MedicalRAGRetriever] = None


def get_default_retriever() -> MedicalRAGRetriever:
    """Returns or lazily initializes the singleton MedicalRAGRetriever."""
    global _GLOBAL_RETRIEVER
    if _GLOBAL_RETRIEVER is None:
        _GLOBAL_RETRIEVER = MedicalRAGRetriever()
    return _GLOBAL_RETRIEVER

