import io
import pytest
import pymupdf

from app.modules.rag.extractor import PDFExtractor, PDFExtractionError
from app.modules.rag.chunker import DocumentChunker
from app.modules.rag.schemas import ExtractedDocument, ExtractedPage


def create_sample_institute_pdf() -> bytes:
    """Helper to create an in-memory 3-page institutional PDF using PyMuPDF."""
    doc = pymupdf.open()

    # Page 1: Attendance Policy
    page1 = doc.new_page()
    page1.insert_text(
        pymupdf.Point(50, 72),
        "INSTITUTE ACADEMIC POLICY 2026\n\n"
        "Section 1: Student Attendance Policy\n"
        "All registered students must maintain a minimum of 75% attendance in each course "
        "to be eligible for end-semester examinations. Students with attendance between 65% and 75% "
        "due to verified medical grounds may apply for condonation.",
        fontsize=11,
    )

    # Page 2: Grading Regulations
    page2 = doc.new_page()
    page2.insert_text(
        pymupdf.Point(50, 72),
        "Section 2: Examination & Grading Criteria\n"
        "Letter grades range from A (90-100%) to F (below 50%). Continuous assessment "
        "accounts for 40% of the overall course grade, while the final exam contributes 60%. "
        "A passing grade requires at least 50% in both components.",
        fontsize=11,
    )

    # Page 3: Fee Payment & Refund
    page3 = doc.new_page()
    page3.insert_text(
        pymupdf.Point(50, 72),
        "Section 3: Tuition Fees and Refund Schedule\n"
        "Tuition fees are structured in three equal installments per academic term. "
        "Late fee penalties of $50 per week apply after the due date. "
        "Refund requests submitted within 14 calendar days of batch start receive an 85% refund.",
        fontsize=11,
    )

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_pdf_extractor_success():
    """Verify PyMuPDF extracts accurate pages, titles, and hashes."""
    pdf_bytes = create_sample_institute_pdf()
    extracted = PDFExtractor.extract_from_bytes(
        pdf_bytes=pdf_bytes,
        filename="student_handbook_2026.pdf",
    )

    assert isinstance(extracted, ExtractedDocument)
    assert extracted.total_pages == 3
    assert len(extracted.pages) == 3
    assert len(extracted.file_hash) == 64  # SHA-256 hex string

    # Verify 1-indexed page numbering
    assert extracted.pages[0].page_number == 1
    assert "Attendance Policy" in extracted.pages[0].text
    assert "75% attendance" in extracted.pages[0].text

    assert extracted.pages[1].page_number == 2
    assert "Grading Criteria" in extracted.pages[1].text

    assert extracted.pages[2].page_number == 3
    assert "Tuition Fees" in extracted.pages[2].text

    # Default friendly title derived from filename
    assert extracted.title == "Student Handbook 2026"


def test_pdf_extractor_title_override():
    """Verify explicit title override is respected."""
    pdf_bytes = create_sample_institute_pdf()
    extracted = PDFExtractor.extract_from_bytes(
        pdf_bytes=pdf_bytes,
        filename="doc.pdf",
        override_title="Official College Guidelines",
    )
    assert extracted.title == "Official College Guidelines"


def test_pdf_extractor_error_handling():
    """Verify corrupt or empty PDF bytes raise PDFExtractionError."""
    # Empty bytes
    with pytest.raises(PDFExtractionError, match="empty"):
        PDFExtractor.extract_from_bytes(b"", filename="empty.pdf")

    # Corrupt data
    with pytest.raises(PDFExtractionError, match="Invalid or corrupt"):
        PDFExtractor.extract_from_bytes(b"not a valid pdf content", filename="corrupt.pdf")


def test_document_chunker_page_preservation():
    """Verify DocumentChunker preserves exact page numbers and generates sequential indices."""
    pdf_bytes = create_sample_institute_pdf()
    extracted = PDFExtractor.extract_from_bytes(pdf_bytes, "policy.pdf")

    # Use smaller chunk size to force multiple chunks
    chunker = DocumentChunker(chunk_size=150, chunk_overlap=30, min_chunk_length=20)
    chunks = chunker.chunk_document(extracted)

    assert len(chunks) > 3  # Multiple chunks across the 3 pages

    # Verify every chunk has a valid source page number between 1 and 3
    for idx, chunk in enumerate(chunks):
        assert chunk.chunk_index == idx  # Continuous zero-based index
        assert chunk.page_number in [1, 2, 3]
        assert len(chunk.content) >= 20
        assert chunk.token_count > 0
        assert chunk.chunk_metadata["source_page"] == chunk.page_number

    # Verify chunks belonging to page 1 contain page 1 keywords
    p1_chunks = [c for c in chunks if c.page_number == 1]
    assert len(p1_chunks) >= 1
    assert any("attendance" in c.content.lower() for c in p1_chunks)

    # Verify chunks belonging to page 3 contain fee keywords
    p3_chunks = [c for c in chunks if c.page_number == 3]
    assert len(p3_chunks) >= 1
    assert any("refund" in c.content.lower() or "fees" in c.content.lower() for c in p3_chunks)


def test_document_chunker_validation():
    """Verify chunker raises error when overlap is greater than or equal to chunk size."""
    with pytest.raises(ValueError, match="strictly less"):
        DocumentChunker(chunk_size=200, chunk_overlap=200)


def test_markdown_extractor_explicit_pages():
    """Verify MarkdownExtractor parses explicit page markers and extracts title."""
    from app.modules.rag.extractor import DocumentExtractor

    md_content = b"""# College Examination & Grading Policy 2026

## Section 1: Eligibility
All students must achieve a minimum attendance of 75% to sit for end-of-term examinations.

<!-- page -->

## Section 2: Grading Scale
Grading follows a 10-point scale. A passing score requires at least 50% composite marks.

<!-- page -->

## Section 3: Re-evaluation
Requests for paper re-evaluation must be submitted within 7 business days of result declaration.
"""
    doc = DocumentExtractor.extract_markdown_bytes(md_content, filename="exam_policy.md")
    assert doc.title == "College Examination & Grading Policy 2026"
    assert doc.total_pages == 3
    assert doc.pages[0].page_number == 1
    assert "Section 1: Eligibility" in doc.pages[0].text
    assert doc.pages[1].page_number == 2
    assert "Section 2: Grading Scale" in doc.pages[1].text
    assert doc.pages[2].page_number == 3
    assert "Section 3: Re-evaluation" in doc.pages[2].text


def test_markdown_extractor_section_auto_segmentation():
    """Verify Markdown without explicit markers segments on major section headers."""
    from app.modules.rag.extractor import DocumentExtractor

    md_content = b"""# Campus Laboratory Safety Rules

## Lab Access & Hours
The computer laboratories are open from 8:00 AM to 8:00 PM on weekdays.

## Equipment Usage
Students must sign the logbook before accessing specialized deep learning workstations.
"""
    doc = DocumentExtractor.extract_markdown_bytes(md_content, filename="lab_safety.md")
    assert doc.title == "Campus Laboratory Safety Rules"
    assert doc.total_pages == 2
    assert doc.pages[0].page_number == 1
    assert "Lab Access & Hours" in doc.pages[0].text
    assert doc.pages[1].page_number == 2
    assert "Equipment Usage" in doc.pages[1].text
