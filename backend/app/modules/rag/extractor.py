import hashlib
import io
import logging
import os
import re
from typing import List, Optional, Union
import pymupdf

from app.modules.rag.schemas import ExtractedDocument, ExtractedPage

logger = logging.getLogger(__name__)


class DocumentExtractionError(Exception):
    """Raised when document reading or text parsing fails."""
    pass


# Backward-compatibility alias
PDFExtractionError = DocumentExtractionError


class DocumentExtractor:
    """
    Unified extractor supporting both PDF documents (.pdf via PyMuPDF)
    and Markdown / text documents (.md, .txt) with page and section preservation.
    """

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        """Compute SHA-256 hash of file content to detect duplicate uploads."""
        hasher = hashlib.sha256()
        hasher.update(data)
        return hasher.hexdigest()

    @classmethod
    def extract_from_file(
        cls,
        filepath: str,
        override_title: Optional[str] = None,
    ) -> ExtractedDocument:
        """Auto-detect format by extension (.pdf, .md, .txt) and extract."""
        try:
            with open(filepath, "rb") as f:
                data = f.read()
        except OSError as exc:
            raise DocumentExtractionError(f"Could not read file at '{filepath}': {exc}") from exc

        filename = os.path.basename(filepath)
        ext = os.path.splitext(filename)[1].lower()

        if ext == ".pdf":
            return cls.extract_pdf_bytes(data, filename=filename, override_title=override_title)
        elif ext in [".md", ".markdown", ".txt"]:
            return cls.extract_markdown_bytes(data, filename=filename, override_title=override_title)
        else:
            raise DocumentExtractionError(
                f"Unsupported file format '{ext}' for file '{filename}'. Supported: .pdf, .md, .txt"
            )

    @classmethod
    def extract_pdf_bytes(
        cls,
        pdf_bytes: bytes,
        filename: str = "document.pdf",
        override_title: Optional[str] = None,
    ) -> ExtractedDocument:
        """Extract text page-by-page from in-memory PDF bytes using PyMuPDF."""
        if not pdf_bytes:
            raise DocumentExtractionError(f"Provided PDF file '{filename}' is empty (0 bytes).")

        file_hash = cls.compute_sha256(pdf_bytes)

        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        except Exception as exc:
            logger.error(f"Failed to open PDF stream for {filename}: {exc}")
            raise DocumentExtractionError(f"Unable to parse PDF '{filename}': Invalid or corrupt format.") from exc

        try:
            if doc.is_encrypted:
                raise DocumentExtractionError(
                    f"PDF '{filename}' is password-protected or encrypted. Decrypt it before ingestion."
                )

            total_pages = len(doc)
            if total_pages == 0:
                raise DocumentExtractionError(f"PDF '{filename}' contains 0 pages.")

            extracted_pages = []
            for page_index in range(total_pages):
                page = doc.load_page(page_index)
                raw_text = page.get_text("text") or ""
                cleaned_text = cls._clean_text(raw_text)

                extracted_pages.append(
                    ExtractedPage(
                        page_number=page_index + 1,  # 1-indexed
                        text=cleaned_text,
                        char_count=len(cleaned_text),
                    )
                )

            meta = doc.metadata or {}
            pdf_title = (override_title or meta.get("title") or "").strip()
            if not pdf_title:
                base_name = filename.rsplit(".", 1)[0]
                pdf_title = base_name.replace("_", " ").replace("-", " ").title()

            return ExtractedDocument(
                filename=filename,
                title=pdf_title,
                total_pages=total_pages,
                file_hash=file_hash,
                pages=extracted_pages,
                pdf_metadata={
                    "author": meta.get("author", ""),
                    "creator": meta.get("creator", ""),
                    "creationDate": meta.get("creationDate", ""),
                },
            )
        finally:
            doc.close()

    @classmethod
    def extract_markdown_bytes(
        cls,
        md_bytes: bytes,
        filename: str = "document.md",
        override_title: Optional[str] = None,
    ) -> ExtractedDocument:
        """
        Extract text from Markdown/plain text bytes.
        Supports explicit page breaks (<!-- page -->, ---page---) or auto-segments
        into logical pages by top-level section headings (## ) to preserve page numbers.
        """
        if not md_bytes:
            raise DocumentExtractionError(f"Provided markdown file '{filename}' is empty (0 bytes).")

        file_hash = cls.compute_sha256(md_bytes)
        text = md_bytes.decode("utf-8", errors="replace").strip()

        if not text:
            raise DocumentExtractionError(f"Markdown file '{filename}' contains no readable text.")

        # 1. Detect title from first top-level `# Heading` if present
        title = override_title
        lines = text.splitlines()
        first_h1 = None
        for line in lines:
            line_str = line.strip()
            if line_str.startswith("# "):
                first_h1 = line_str[2:].strip()
                break

        if not title:
            if first_h1:
                title = first_h1
            else:
                base_name = filename.rsplit(".", 1)[0]
                title = base_name.replace("_", " ").replace("-", " ").title()

        # Strip large base64 embedded image strings to keep index clean
        text = re.sub(r"data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=\s]+", "[Embedded Image]", text)

        # 2. Page division
        page_pattern = r"(?i)(?:<!--\s*page\s*-->|---page---|\\newpage)"
        raw_pages = re.split(page_pattern, text)

        if len(raw_pages) > 1:
            page_blocks = [p.strip() for p in raw_pages if p.strip()]
        elif re.search(r"(?m)^##\s+Page\s+\d+", text):
            # Explicit '## Page X' headers (e.g. ## Page 1 — Introduction)
            page_blocks = [s.strip() for s in re.split(r"(?m)(?=^##\s+Page\s+\d+)", text) if s.strip()]
        elif re.search(r"(?m)^\*\*\d+\\?[\.\)]\s+", text):
            # Bold numbered sections (e.g. **1. Purpose and scope** or **1\. Purpose and scope**)
            page_blocks = [s.strip() for s in re.split(r"(?m)(?=^\*\*\d+\\?[\.\)]\s+)", text) if s.strip()]
        else:
            # Segment on major section headers (## Heading)
            section_pattern = r"(?m)(?=^##\s+)"
            sections = [s.strip() for s in re.split(section_pattern, text) if s.strip()]
            if len(sections) > 1:
                first_lines = [line.strip() for line in sections[0].splitlines() if line.strip()]
                if len(first_lines) <= 2 and all(l.startswith("#") for l in first_lines):
                    sections[1] = f"{sections[0]}\n\n{sections[1]}"
                    page_blocks = sections[1:]
                else:
                    page_blocks = sections
            else:
                page_blocks = sections

        if not page_blocks:
            page_blocks = [text]

        extracted_pages: List[ExtractedPage] = []
        for idx, block in enumerate(page_blocks, start=1):
            clean_page = cls._clean_text(block)
            # Try to extract explicit page number from "## Page (\d+)" if present
            explicit_page_match = re.search(r"(?i)^##\s+Page\s+(\d+)", clean_page)
            page_num = int(explicit_page_match.group(1)) if explicit_page_match else idx

            extracted_pages.append(
                ExtractedPage(
                    page_number=page_num,
                    text=clean_page,
                    char_count=len(clean_page),
                )
            )

        return ExtractedDocument(
            filename=filename,
            title=title,
            total_pages=len(extracted_pages),
            file_hash=file_hash,
            pages=extracted_pages,
            pdf_metadata={"format": "markdown", "sections_count": len(extracted_pages)},
        )

    @classmethod
    def extract_from_bytes(
        cls,
        pdf_bytes: bytes,
        filename: str = "document.pdf",
        override_title: Optional[str] = None,
    ) -> ExtractedDocument:
        """Backwards compatibility helper."""
        ext = os.path.splitext(filename)[1].lower()
        if ext in [".md", ".markdown", ".txt"]:
            return cls.extract_markdown_bytes(pdf_bytes, filename=filename, override_title=override_title)
        return cls.extract_pdf_bytes(pdf_bytes, filename=filename, override_title=override_title)

    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean raw extracted text without stripping structural breaks."""
        if not text:
            return ""
        text = text.replace("\x00", "").replace("\u200b", "")
        lines = [line.strip() for line in text.splitlines()]
        cleaned_lines = []
        consecutive_blank = 0
        for line in lines:
            if not line:
                consecutive_blank += 1
                if consecutive_blank <= 1:
                    cleaned_lines.append("")
            else:
                consecutive_blank = 0
                cleaned_lines.append(line)
        return "\n".join(cleaned_lines).strip()


# Backward-compatible alias
PDFExtractor = DocumentExtractor
