import hashlib
import logging
from typing import List, Optional
import numpy as np
import ollama

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingError(Exception):
    """Raised when vector embedding generation fails."""
    pass


class EmbeddingService:
    """
    Vector embedding generator utilizing Ollama (model: qwen3-embedding:4b).
    Includes a deterministic fallback vectorizer for offline testing and CI.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 2.0,
        fallback_dim: int = 128,
        force_fallback: bool = False,
    ):
        self.model = model or settings.OLLAMA_EMBEDDING_MODEL
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.timeout = timeout
        self.client = ollama.Client(host=self.base_url, timeout=self.timeout)
        self.fallback_dim = fallback_dim
        self.force_fallback = force_fallback
        self._ollama_connected: Optional[bool] = None

    def is_available(self) -> bool:
        """Check if local Ollama daemon is reachable."""
        if self.force_fallback:
            return False
        try:
            self.client.list()
            self._ollama_connected = True
            return True
        except Exception:
            self._ollama_connected = False
            return False

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a single text string."""
        if not text or not text.strip():
            raise EmbeddingError("Cannot embed empty text.")
        vectors = self.embed_batch([text])
        return vectors[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embedding vectors for a batch of text chunks.
        Falls back gracefully if Ollama daemon is not running.
        """
        if not texts:
            return []

        clean_texts = [t.strip() for t in texts]

        # 1. Attempt live Ollama embedding if not previously marked unreachable
        if not self.force_fallback and self._ollama_connected is not False:
            try:
                response = self.client.embed(
                    model=self.model,
                    input=clean_texts,
                )
                if hasattr(response, "embeddings") and response.embeddings:
                    self._ollama_connected = True
                    return response.embeddings
            except Exception as exc:
                self._ollama_connected = False
                logger.warning(
                    f"Ollama embedding via '{self.model}' at {self.base_url} failed: {exc}. "
                    "Switching to deterministic fallback vectorizer."
                )

        # 2. Resilient deterministic test vectorizer for offline/test environments
        return [self._deterministic_fallback_vector(t) for t in clean_texts]

    FALLBACK_STOP_WORDS = {
        "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
        "which", "this", "that", "these", "those", "then", "just", "so", "than",
        "such", "both", "through", "about", "for", "is", "of", "while", "during",
        "to", "from", "in", "out", "on", "off", "again", "further", "then", "once",
        "here", "there", "when", "where", "why", "how", "all", "any", "both",
        "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
        "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will",
        "just", "don", "should", "now", "are", "do", "does", "did", "have", "has", "had"
    }

    def _deterministic_fallback_vector(self, text: str) -> List[float]:
        """
        Computes a normalized, deterministic dense embedding vector from token n-grams.
        Ensures identical words produce identical vectors and semantic similarity can be tested
        reliably even when the local Ollama server is offline. Stop words are downweighted
        to prevent spurious high similarities between unrelated texts.
        """
        vec = np.zeros(self.fallback_dim, dtype=np.float32)
        raw_tokens = [t.strip(".,;:?!'\"()[]{}") for t in text.lower().split()]
        words = [t for t in raw_tokens if t]
        if not words:
            return vec.tolist()

        substantive_words = [w for w in words if w not in self.FALLBACK_STOP_WORDS]
        tokens_to_process = words if not substantive_words else words

        for w in tokens_to_process:
            # Hash word into bucket index
            h = int(hashlib.sha256(w.encode("utf-8")).hexdigest(), 16)
            idx = h % self.fallback_dim
            sign = 1.0 if ((h >> 8) & 1) else -1.0
            weight = 0.05 if w in self.FALLBACK_STOP_WORDS else 1.0
            vec[idx] += sign * weight

        # Add 3-gram char hashes for sub-word matching, prioritizing substantive words
        words_for_ngrams = substantive_words if substantive_words else words
        for w in words_for_ngrams:
            if len(w) >= 3:
                for i in range(len(w) - 2):
                    tri = w[i : i + 3]
                    h = int(hashlib.md5(tri.encode("utf-8")).hexdigest(), 16)
                    idx = h % self.fallback_dim
                    vec[idx] += 0.3

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return [round(float(val), 6) for val in vec]


# Global singleton instance
embedding_service = EmbeddingService()
