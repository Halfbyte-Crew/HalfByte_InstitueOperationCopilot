import re
from typing import List, Optional
from app.modules.rag.schemas import ChunkPayload, ExtractedDocument, ExtractedPage


class DocumentChunker:
    """
    Splits extracted PDF pages into searchable chunks with overlap
    while strictly preserving physical page numbers for trustworthy citations.
    """

    def __init__(
        self,
        chunk_size: int = 600,
        chunk_overlap: int = 100,
        min_chunk_length: int = 30,
    ):
        """
        :param chunk_size: Target maximum characters per chunk.
        :param chunk_overlap: Number of characters shared between adjacent chunks.
        :param min_chunk_length: Minimum character length to retain (discards noise/blank pages).
        """
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size.")

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_length = min_chunk_length

    def chunk_document(self, doc: ExtractedDocument) -> List[ChunkPayload]:
        """
        Process all extracted pages of a document and return an ordered list of ChunkPayloads.
        Each chunk retains the source page number.
        """
        chunks: List[ChunkPayload] = []
        global_chunk_index = 0

        for page in doc.pages:
            page_chunks = self.chunk_page(page, start_index=global_chunk_index)
            chunks.extend(page_chunks)
            global_chunk_index += len(page_chunks)

        return chunks

    def chunk_page(self, page: ExtractedPage, start_index: int = 0) -> List[ChunkPayload]:
        """
        Chunks text from a single page, ensuring every generated chunk maps to `page.page_number`.
        Uses recursive splitting: paragraph breaks -> sentence breaks -> whitespace.
        """
        text = page.text.strip()
        if len(text) < self.min_chunk_length:
            return []

        # If text comfortably fits within chunk_size, return it as a single chunk
        if len(text) <= self.chunk_size:
            return [
                ChunkPayload(
                    chunk_index=start_index,
                    page_number=page.page_number,
                    content=text,
                    token_count=self.estimate_tokens(text),
                    chunk_metadata={"source_page": page.page_number},
                )
            ]

        # Otherwise, split text with sliding window and overlap
        text_segments = self._split_text_with_overlap(text)
        page_chunks: List[ChunkPayload] = []

        for idx, segment in enumerate(text_segments):
            clean_segment = segment.strip()
            if len(clean_segment) >= self.min_chunk_length:
                page_chunks.append(
                    ChunkPayload(
                        chunk_index=start_index + len(page_chunks),
                        page_number=page.page_number,
                        content=clean_segment,
                        token_count=self.estimate_tokens(clean_segment),
                        chunk_metadata={
                            "source_page": page.page_number,
                            "page_chunk_index": idx,
                        },
                    )
                )

        return page_chunks

    def _split_text_with_overlap(self, text: str) -> List[str]:
        """
        Sliding window text chunker that attempts to split cleanly at
        paragraph or sentence boundaries where available.
        """
        chunks: List[str] = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + self.chunk_size

            if end >= text_len:
                # Last remaining piece
                chunk = text[start:].strip()
                if chunk:
                    chunks.append(chunk)
                break

            # Find the best boundary near the end: paragraph > sentence > space
            cut = self._find_best_split_point(text, start, end)
            chunk = text[start:cut].strip()
            if chunk:
                chunks.append(chunk)

            # Advance start window, backing up by overlap amount
            start = cut - self.chunk_overlap
            if start <= 0 or start >= text_len:
                break

        return chunks

    def _find_best_split_point(self, text: str, start: int, target_end: int) -> int:
        """Find the most natural breakpoint (paragraph, sentence, or word boundary)."""
        window = text[start:target_end]

        # 1. Try paragraph break (\n\n) in the latter half of the window
        last_para = window.rfind("\n\n")
        if last_para != -1 and last_para > len(window) * 0.4:
            return start + last_para + 2

        # 2. Try single newline
        last_nl = window.rfind("\n")
        if last_nl != -1 and last_nl > len(window) * 0.5:
            return start + last_nl + 1

        # 3. Try sentence end punctuation (. ! ?)
        match = None
        for m in re.finditer(r"[.!?]\s+", window):
            match = m
        if match and match.end() > len(window) * 0.5:
            return start + match.end()

        # 4. Fallback to space
        last_space = window.rfind(" ")
        if last_space != -1 and last_space > len(window) * 0.3:
            return start + last_space + 1

        # 5. Hard cut if no delimiters exist
        return target_end

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Approximate token count for the given text (approx 1 token ~= 4 chars or 0.75 words)."""
        if not text:
            return 0
        word_count = len(text.split())
        char_est = len(text) // 4
        return max(1, max(word_count, char_est))
