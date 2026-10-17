# EduPilot Institutional Knowledge Base

Place official PDF documents into their respective domain directories. The RAG ingestion pipeline will process these documents, extract text preserving page numbers, generate embeddings with `qwen3-embedding:4b`, and index them into the vector store.

## Directory Structure & Default Role Access

| Directory | Description | Default Authorized Roles |
|---|---|---|
| `student_policies/` | Student Code of Conduct, attendance rules, grievance redressal | `student`, `trainer`, `counselor`, `owner` |
| `academic_regulations/` | Degree requirements, credits, grading systems | `student`, `trainer`, `counselor`, `owner` |
| `syllabi/` | Course curriculum, prerequisites, lecture schedules | `student`, `trainer`, `owner` |
| `academic_calendar/` | Term dates, holidays, semester milestones | `student`, `trainer`, `counselor`, `accounts`, `owner` |
| `examinations/` | Exam eligibility, invigilation guidelines, re-evaluation policies | `student`, `trainer`, `owner` |
| `admissions_and_fees/` | Tuition fee structures, refund policies, installment plans | `student`, `accounts`, `counselor`, `owner` |
| `faculty_guidelines/` | Faculty workload, leaves, appraisal, and payroll info (restricted) | `trainer`, `owner` |
| `administrative_procedures/`| Certificate requests, ID card issuance, transfer procedures | `counselor`, `accounts`, `owner`, `student` |
| `campus_safety/` | Laboratory safety protocols, fire safety, emergency contacts | `student`, `trainer`, `counselor`, `accounts`, `owner` |
| `notices/` | Circulars, temporary advisories, event schedules | `student`, `trainer`, `counselor`, `accounts`, `owner` |

> [!NOTE]
> All PDF documents ingested from these directories will preserve their physical page numbers for factual citations.
