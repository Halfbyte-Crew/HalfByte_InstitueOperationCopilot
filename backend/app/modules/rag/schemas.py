from datetime import date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ExtractedPage(BaseModel):
    """Represents text extracted from a single physical PDF page."""
    page_number: int = Field(..., ge=1, description="1-indexed physical page number in the document")
    text: str = Field(..., description="Raw cleaned text from this page")
    char_count: int = Field(..., ge=0, description="Number of characters on this page")


class ExtractedDocument(BaseModel):
    """Container for the complete document extraction result."""
    filename: str
    title: str
    total_pages: int = Field(..., ge=0)
    file_hash: str = Field(..., description="SHA-256 checksum of document bytes")
    pages: List[ExtractedPage]
    pdf_metadata: Dict[str, Any] = Field(default_factory=dict)


class ChunkPayload(BaseModel):
    """Represents a discrete searchable chunk ready for embedding and indexing."""
    chunk_index: int = Field(..., ge=0, description="Sequential chunk index within document")
    page_number: int = Field(..., ge=1, description="1-indexed source page number for citations")
    content: str = Field(..., min_length=1, description="Text passage content")
    token_count: int = Field(..., ge=0, description="Estimated token count of this chunk")
    chunk_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Contextual tags or headers")
