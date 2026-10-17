# Student Policies — RAG Project
## Documentation
## Page 1 — Introduction to Student Policies
1. 1 Introduction

Student policies are a set of rules, regulations, guidelines, and procedures established by an
educational institution to maintain discipline, ensure academic quality, and provide a fair learning
environment. These policies explain the rights, responsibilities, expectations, and obligations of
students during their academic journey.

Educational institutions manage several activities, including admissions, attendance,
examinations, fee payments, scholarships, student conduct, leave applications, academic
integrity, and grievance redressal. When these policies are distributed across multiple PDF
documents, notices, websites, and handbooks, students may find it difficult to identify the correct
information.

A Student Policies Information System provides a centralised way to organise and access
institutional rules. By integrating Retrieval-Augmented Generation (RAG), the system can
retrieve relevant policy information and generate answers to students' questions using approved
documents.

1. 2 Importance of Student Policies

Student policies are important because they:

- Establish clear academic and behavioural expectations.
- Promote fairness and consistency in administrative decisions.
- Help students understand institutional procedures.
- Reduce confusion regarding deadlines and eligibility requirements.
- Provide structured procedures for complaints and appeals.
- Encourage responsible behaviour and academic integrity.

1. 3 Role of RAG

RAG combines information retrieval with a language model. Instead of depending entirely on
information learned during training, the system searches approved policy documents and uses
relevant passages to answer a question.

For example, when a student asks, “What is the procedure for applying for leave?”, the system
retrieves the relevant leave policy and generates an answer based on its contents.

Note: The actual rules must come from the institution's approved policies. This document
explains a general-purpose system and does not establish official rules for any specific college.

## Page 2 — Objectives and Scope of the Student Policies
System
2. 1 Objectives

The main objective is to develop an intelligent information assistant that helps students
understand institutional policies quickly and accurately.

The system aims to:

1. Provide policy-related information through natural-language questions.
2. Retrieve relevant passages from approved documents.
3. Generate understandable answers with source references.
4. Reduce repetitive enquiries to administrative staff.
5. Improve accessibility of policy information.
6. Avoid unsupported answers when policy evidence is unavailable.
7. Support policy updates without retraining the entire language model.

2. 2 Scope of the System

The system can cover the following policy categories:

- Admission and enrolment policies.
- Attendance and punctuality policies.
- Leave and absence policies.
- Examination and assessment policies.
- Academic integrity and plagiarism.
- Fee payment and refund policies.
- Scholarship and financial-aid policies.
- Student code of conduct.
- Privacy and student-record policies.
- Grievance and complaint procedures.
- Campus safety and digital-resource usage.
- Accessibility and student-support services.

2. 3 Intended Users

The primary users are students seeking policy information. Other potential users include faculty
members, academic coordinators, administrative staff, and student-support teams, subject to
appropriate access permissions.

2. 4 Limitations of Scope

The system should explain policies rather than make unauthorised decisions. It should not
independently approve leave, determine disciplinary guilt, guarantee scholarships, change
attendance records, or make final admission decisions.

## Page 3 — Understanding Student Policies
3. 1 Definition

A student policy is an approved document that defines requirements, expectations,
responsibilities, and procedures related to student activities within an educational institution.

A well-structured policy normally includes:

- Policy title and identification number.
- Purpose and scope.
- Definitions of important terms.
- Student and staff responsibilities.
- Procedures and eligibility criteria.
- Required forms and supporting documents.
- Deadlines and exceptions, where applicable.
- Responsible departments.
- Approval, effective date, and review information.

3. 2 Policy vs Procedure vs Guideline

A policy defines the institution's governing requirements. A procedure describes the steps used
to follow those requirements. A guideline provides recommendations or practical guidance.

For example, an examination policy may establish rules for re-evaluation, while the associated
procedure explains where to submit the application and how it is processed.

3. 3 Policy Management

Policies should be reviewed and updated whenever institutional requirements change. Old
versions must be marked as superseded so students do not receive outdated information.

3. 4 Application in RAG

Each policy document should be stored with metadata such as title, version, approval status,
effective date, department, and source location. This allows the retrieval system to find relevant
content and identify which version applies.

## Page 4 — Attendance and Punctuality Policy
4. 1 Introduction

An attendance policy describes how student participation in lectures, practical sessions,
laboratories, tutorials, and other required academic activities is recorded and monitored.

4. 2 Key Components

An attendance policy may define:

- The official attendance-recording method.
- The attendance requirement applicable to a course or programme.
- Procedures for correcting inaccurate attendance records.
- Reporting requirements for absences.
- Treatment of authorised leave.
- Exceptions and accommodation procedures.
- The office responsible for attendance disputes.

4. 3 Attendance Record Correction

If a student believes that an attendance record is incorrect, the institution may require the
student to contact the relevant faculty member or academic office. The official policy should
specify any required evidence, form, and deadline.

4. 4 Example Student Question

Question: “My attendance is marked absent even though I attended the lecture. What should I
do?”

A RAG-based assistant should retrieve the relevant attendance policy and explain the approved
correction procedure.

4. 5 RAG Implementation Considerations

Attendance rules can differ by programme, semester, and academic year. The system should
retrieve the applicable version and must not invent attendance percentages or promise that a
correction will be approved.

## Page 5 — Leave and Absence Policy

5. 1 Introduction

A leave policy explains how students notify the institution about absences and request
permission for leave where required.

5. 2 Types of Leave

Depending on institutional rules, categories may include:

- Planned personal leave.
- Medical absence.
- Emergency leave.
- Participation in authorised academic activities.
- Extended leave.
- Leave affecting examinations or practical assessments.

These categories are examples; each institution must define its own classifications.

5. 3 Application Procedure

A leave procedure may involve identifying the relevant leave category, completing an approved
form, attaching required supporting evidence, submitting the application to the designated
authority, and receiving a decision.

5. 4 Responsibilities of Students

Students should follow the published procedure, provide accurate information, observe
applicable deadlines, and confirm whether the request has been approved.

5. 5 Role of the RAG Assistant

The assistant can identify the correct form, explain the steps, and retrieve applicable conditions.
It should distinguish between submitting a request and receiving approval.

If the policy does not specify a deadline or exception, the system should state that the
information is not available in the retrieved source instead of inventing a rule.

## Page 6 — Admission and Enrolment Policy
6. 1 Introduction

Admission and enrolment policies define how applicants enter an educational institution and
how admitted students complete the formal registration process.

6. 2 Common Policy Areas

These may include:

- Eligibility requirements.
- Application procedures.
- Required certificates and documents.
- Application deadlines.
- Verification of submitted information.
- Fee payment and enrolment confirmation.
- Transfer and deferment procedures.
- Withdrawal and re-admission.
- Correction of application details.

6. 3 Document Verification

Institutions may require academic records, identity documents, photographs, certificates, or
other specified information. The exact list must be obtained from the official admission policy.

6. 4 Enrolment Confirmation

Submitting an application does not necessarily mean that admission or enrolment has been
approved. The institution's formal confirmation process determines the student's status.

6. 5 RAG Integration

The assistant should retrieve information according to the relevant programme, admission cycle,
campus, and academic year.

For questions involving an individual's admission status, the system must use authorised
records and appropriate authentication. Public policy documents alone cannot confirm a
particular student's application status.

## Page 7 — Examination and Assessment Policy
7. 1 Introduction

An examination and assessment policy defines the rules governing examinations, tests,
assignments, practical work, projects, and other methods used to evaluate student
performance.

7. 2 Important Components

The policy may explain:

- Examination registration.
- Examination schedules and identification requirements.
- Permitted and prohibited materials.

- Assignment submission rules.
- Late submission and extension procedures.
- Missed examinations.
- Marking and grading procedures.
- Result publication.
- Rechecking and re-evaluation.
- Appeals and correction of errors.

7. 3 Rechecking and Re-evaluation

Institutions may distinguish between checking calculation or clerical errors, re-evaluating
academic work, and appealing an academic decision. Students should be directed to the
specific procedure applicable to their request.

7. 4 RAG Application

A student might ask, “How can I apply for re-evaluation?”

The assistant should retrieve the relevant examination policy, identify the required procedure,
and provide the documented deadline and official application route.

7. 5 Accuracy Requirement

The assistant must not invent examination dates, passing marks, fees, or attempt limits. These
details must be retrieved from current, approved sources.

## Page 8 — Academic Integrity and Plagiarism Policy
8. 1 Introduction

Academic integrity refers to honesty, fairness, responsibility, and ethical conduct in learning,
assessment, research, and academic communication.

8. 2 Common Academic Misconduct Categories

Institutional policies may address:

- Plagiarism.
- Unauthorised collaboration.
- Cheating during examinations.
- Fabrication or falsification of data.
- Impersonation.
- Improper citation.
- Unauthorised assistance.
- Misuse of artificial intelligence tools.

8. 3 Prevention

Students can promote academic integrity by understanding assignment instructions, citing
sources correctly, following collaboration rules, maintaining accurate research records, and
checking the permitted use of external tools.

8. 4 Investigation Procedures

A policy may describe how concerns are reported, reviewed, documented, communicated, and
appealed. The system should accurately explain these procedures without independently
deciding whether misconduct occurred.

8. 5 Use of AI Tools

AI rules may differ across courses and assessments. The assistant should retrieve the relevant
institutional or course-specific guidance rather than assuming that every use of AI is allowed or
prohibited.

## Page 9 — Student Code of Conduct and Discipline
9. 1 Introduction

A student code of conduct describes the expected behaviour of students in classrooms,
laboratories, libraries, hostels, campus spaces, online learning environments, and
institution-related activities.

9. 2 Expected Behaviour

Depending on the institution's approved code, expectations may include:

- Respectful communication.
- Compliance with safety instructions.
- Respect for other students and staff.
- Responsible use of institutional property.
- Compliance with academic rules.
- Appropriate digital communication.
- Avoidance of harassment, bullying, and discrimination.

9. 3 Disciplinary Procedures

The policy should explain reporting channels, investigation procedures, the roles of responsible
authorities, opportunities to respond, possible outcomes, and appeal arrangements.

9. 4 Confidentiality

Disciplinary information may be confidential. The assistant should not disclose private records or
identify another student's disciplinary history.

9. 5 Role of the Assistant

The assistant can explain rules and direct students to official reporting channels. It must not act
as a disciplinary authority or make final decisions about alleged misconduct.

## Page 10 — Fee Payment and Refund Policy
10. 1 Introduction

Fee policies describe financial obligations associated with admission, tuition, registration,
examinations, facilities, and other institution-approved services.

10. 2 Common Components

A fee policy may include:

- Fee categories and payment schedules.
- Instalment options.
- Accepted payment methods.
- Payment confirmation.
- Late payment rules.
- Refund eligibility.
- Refund calculation and exclusions.
- Duplicate-payment correction.
- Financial holds and dispute resolution.

10. 3 Refund Procedure

A refund procedure may require an application, supporting documents, verification, and review
by the finance department. The actual amount and eligibility depend on the approved policy and
applicable circumstances.

10. 4 Example Question

Question: “I paid the same fee twice. How can I report it?”

The assistant should retrieve the official payment-dispute procedure and provide the authorised
finance contact or portal.

10. 5 RAG Safety

The system must not invent fee amounts, guarantee a refund, request payment passwords, or
claim that a payment was received without authorised transaction information.

## Page 11 — Scholarship and Financial Aid Policy
11. 1 Introduction

Scholarship and financial-aid policies describe financial support available to eligible students.
Support may come from the institution, government schemes, charitable organisations, or
external sponsors.

11. 2 Common Components

- Eligibility requirements.
- Application periods.
- Required supporting documents.
- Academic or other selection criteria.
- Renewal requirements.
- Verification and approval procedures.
- Disbursement arrangements.
- Appeals or query channels.

11. 3 Eligibility and Approval

Eligibility to apply does not necessarily guarantee selection. Students may need to meet several
criteria and complete verification.

11. 4 Example Question

Question: “What documents are required for a scholarship application?”

The assistant should retrieve the relevant scheme's approved document list and identify the
applicable academic year.

11. 5 RAG Considerations

Scholarship policies frequently change. The system should distinguish institutional scholarships
from external schemes and avoid presenting outdated eligibility requirements as current.

## Page 12 — Student Privacy and Data Protection Policy
12. 1 Introduction

A privacy policy explains how an institution collects, uses, stores, protects, and shares student
information.

12. 2 Types of Student Information

Records may include:

- Contact and identification details.
- Attendance and academic results.
- Admission and enrolment information.
- Financial records.
- Accommodation or support records.
- Complaints and administrative correspondence.

12. 3 Data Protection Principles

A student-policy system should apply data minimisation, purpose limitation, appropriate access
controls, secure storage, and documented retention procedures.

12. 4 Privacy in a RAG System

Public policy documents should be searchable without unnecessarily collecting student
identifiers. Personal records should be retrieved only through authorised access mechanisms.

12. 5 Logging and Monitoring

System logs should avoid storing unnecessary sensitive information. Access to logs must be
controlled, and retention should follow approved institutional requirements.

12. 6 Legal Compliance

The applicable privacy requirements depend on the institution's context and relevant law. The
project team should obtain appropriate institutional review before processing real student
records.

## Page 13 — Accessibility, Inclusion, and Student Support
Policy
13. 1 Introduction

Accessibility and inclusion policies aim to provide students with fair access to educational
activities, resources, facilities, and support services.

13. 2 Potential Policy Areas

These may include:

- Disability accommodations.
- Accessible learning resources.
- Language support.

- Counselling and wellbeing services.
- Anti-discrimination procedures.
- Support during personal hardship.
- Access to student-support departments.

13. 3 Accessibility of the RAG Interface

The system should use readable typography, understandable language, appropriate contrast,
keyboard navigation, and compatibility with assistive technologies.

13. 4 Inclusive Communication

Answers should be respectful, avoid assumptions, and explain technical terms clearly.

13. 5 Support Referrals

The assistant can explain how to request support and identify the appropriate office. It should
not diagnose medical conditions or make unauthorised eligibility decisions.

When a user needs urgent help, the system should prioritise the relevant human-support or
emergency channel.

## Page 14 — Student Grievance and Complaint Policy
14. 1 Introduction

A grievance policy provides a formal method for students to report concerns about academic
decisions, administrative services, facilities, staff conduct, discrimination, or other institutional
matters.

14. 2 Common Components

- Types of complaints covered.
- Submission channels.
- Required information.
- Applicable deadlines.
- Review and investigation process.
- Communication of outcomes.
- Confidentiality requirements.
- Appeal or review options.

14. 3 Complaint Submission

A student may be required to submit a form through an official portal or contact a designated
department. The procedure should specify what information is necessary.

14. 4 Fair Handling

Complaints should be handled according to approved institutional procedures. Students should
be given the opportunities and protections provided by the relevant policy.

14. 5 RAG Application

The assistant should retrieve the appropriate grievance procedure and identify the official
reporting channel.

It should not guarantee an outcome, disclose private complaint details, discourage legitimate
reporting, or substitute its own judgement for the authorised review process.

## Page 15 — Campus Safety, Facilities, and Digital Usage
Policies
15. 1 Introduction

Campus policies establish expectations for the safe use of facilities, equipment, technology, and
shared institutional resources.

15. 2 Safety and Facilities

Policies may address:

- Laboratory safety.
- Emergency reporting.
- Fire and evacuation procedures.
- Equipment borrowing.
- Visitor access.
- Facility booking.
- Lost property.
- Reporting damaged infrastructure.

15. 3 Digital Usage

Technology policies may define acceptable use of institutional email, Wi-Fi, learning platforms,
software, shared computers, and digital learning resources.

15. 4 Cybersecurity Expectations

Students may be required to protect credentials, avoid unauthorised access, respect other
users' privacy, and report suspicious activity.

15. 5 RAG Integration

The assistant can retrieve approved instructions and identify the appropriate support team. It
should not expose access codes, confidential security procedures, or private incident reports.

Emergency instructions should be current, clearly presented, and prioritised when a student
describes immediate danger.

## Page 16 — Introduction to Retrieval-Augmented
Generation (RAG)
16. 1 Definition

Retrieval-Augmented Generation is an AI architecture that combines an information-retrieval
system with a generative language model.

The retrieval component searches a collection of documents for information relevant to a user's
question. The generation component uses the retrieved information as context to construct an
answer.

16. 2 Why RAG Is Useful

A general language model may not know the latest rules of a particular institution. RAG allows
the application to retrieve information from its own approved policy library.

16. 3 Main Components

1. Policy documents.
2. Document-processing pipeline.
3. Text chunking.
4. Embedding model.
5. Vector database or search index.
6. Retriever.
7. Language model.
8. Citation and response-generation layer.

16. 4 Example

A student asks, “How do I appeal an examination result?”

The retriever searches the policy library, selects relevant examination and appeal sections, and
passes those sections to the language model. The model generates a response grounded in the
retrieved text.

16. 5 Important Limitation

RAG reduces reliance on unsupported model memory but does not eliminate errors. Document
quality, retrieval accuracy, version control, and answer validation remain essential.

## Page 17 — RAG Architecture for the Student Policies
Project
17. 1 System Architecture

The proposed system contains two main workflows.

Document ingestion workflow:

1. Collect approved policy PDFs and other authorised documents.
2. Extract text and preserve headings, sections, and page numbers.
3. Clean extraction errors.
4. Divide documents into coherent chunks.
5. Generate embeddings for each chunk.
6. Store vectors, text, and metadata in a search index.

Question-answering workflow:

1. Receive a student question.
2. Identify the relevant policy category.
3. Convert the question into a search representation.
4. Retrieve relevant policy passages.
5. Filter or rerank the retrieved passages.
6. Generate an answer using the retrieved evidence.
7. Attach source citations.
8. Return the answer or escalate when evidence is insufficient.

17. 2 Metadata

Each chunk should retain information such as policy title, document version, effective date,
section heading, page number, approval status, and applicable programme.

17. 3 Human Oversight

Questions involving conflicting rules, personal records, exceptions, or high-impact decisions
should be routed to authorised staff.

17. 4 Architecture Principle

The language model should explain retrieved policy content, not invent institutional rules.

## Page 18 — Document Collection and Knowledge-Base
Preparation
18. 1 Source Collection

The first stage is to collect the documents that will form the knowledge base. These may include
student handbooks, attendance policies, examination regulations, scholarship guidelines,
approved notices, and official forms.

18. 2 Source Validation

Before indexing a document, verify:

- Its source and ownership.
- Whether it has been approved.
- Its effective date and version.
- Its applicable programme or student category.
- Whether it replaces an older document.
- Whether it may legally and institutionally be used by the application.

18. 3 Metadata Structure

An example metadata record might contain:

- document_id
- title
- policy_type
- version
- effective_date
- approval_status
- section
- page_number
- source_uri

18. 4 Document Precedence

If two documents conflict, the institution must define which approved source takes precedence.
The system should not independently invent a hierarchy.

18. 5 Updating the Knowledge Base

When an approved policy changes, the document should be reprocessed and re-indexed.
Superseded versions should not appear in ordinary current-policy answers unless historical
information is specifically requested.

## Page 19 — Text Extraction, Cleaning, and Chunking
19. 1 Text Extraction

Text extraction converts PDF, DOCX, and other supported documents into machine-readable
content.

PDFs with selectable text can often be parsed directly. Scanned PDFs may require Optical
Character Recognition (OCR).

19. 2 Text Cleaning

Cleaning may involve removing irrelevant repeated headers, repairing broken lines, preserving
section numbers, and correcting extraction errors.

Important conditions, exceptions, and table values must not be removed.

19. 3 Chunking

Chunking divides a document into smaller passages so that relevant sections can be retrieved
independently.

For example, a long examination policy may be divided into sections covering registration,
examination conduct, re-evaluation, and appeals.

19. 4 Chunking Strategies

- Fixed-size chunking.
- Overlapping chunking.
- Heading-based chunking.
- Semantic chunking.
- Parent-child chunking, where smaller passages retain links to larger sections.

19. 5 Metadata Preservation

Each chunk should retain the original title, section, page, version, and source location.

19. 6 Quality Control

Test chunking with realistic questions to ensure that a rule is not separated from its exception or
important definition.

## Page 20 — Embeddings and Vector Database
20. 1 What Are Embeddings?

Embeddings represent text as numerical vectors. An embedding model converts a question or
document passage into a vector that captures aspects of its semantic meaning.

20. 2 Why Embeddings Matter

A student might ask, “How can I challenge my marks?” while the official document uses the term
“re-evaluation procedure.”

Semantic retrieval can help identify related passages even when the exact wording differs.

20. 3 Vector Database

A vector database stores document embeddings and associated metadata. When a question is
received, the system searches for vectors that are similar to the query vector.

20. 4 Similarity Search

Common approaches use cosine similarity, dot product, or a distance metric supported by the
selected index and embedding model.

20. 5 Metadata Filtering

Search results can be restricted to current, approved documents for the relevant campus,
programme, or academic year.

20. 6 Technology Choices

Potential technologies include FAISS for vector similarity search and vector databases such as
Chroma or other compatible systems.

The appropriate choice depends on data size, hosting, filtering requirements, privacy, cost, and
operational needs.

## Page 21 — Retrieval, Prompt Engineering, and Answer
Generation
21. 1 Retrieval

The retriever searches the indexed policy chunks and selects passages relevant to the student's
question.

The number of passages retrieved should be tested rather than chosen arbitrarily.

21. 2 Hybrid Search

Hybrid search combines semantic vector retrieval with keyword search. It can be useful when
students mention exact policy numbers, form names, or section references.

21. 3 Reranking

A reranker evaluates candidate passages and reorders them according to their relevance to the
query.

21. 4 Prompt Engineering

The prompt should instruct the language model to answer from the supplied approved evidence,
preserve exceptions, cite sources, and abstain when information is missing.

21. 5 Example Prompt

“You are a Student Policies Assistant. Answer institution-specific questions using only the
approved policy passages provided. Do not invent deadlines, fees, eligibility criteria, or rules.
Cite the supporting document and section. If the evidence is insufficient or contradictory, explain
the limitation and direct the user to the appropriate official office.”

21. 6 Grounded Generation

The final answer should communicate the rule clearly while retaining its conditions and source
reference.

## Page 22 — Python Implementation Plan
22. 1 Technology Stack

A Python-based prototype may use:

- Python for application logic.
- A PDF or document-text extraction library.
- An embedding model.
- A vector index or database.
- A compatible language-model API or local model.
- FastAPI or Flask for the backend.
- A web interface for student interaction.

22. 2 Basic Text Loading

from pathlib import PathPOLICY_DIR = Path("policies")def load_policy_files(): documents = []
for file_path in POLICY_DIR.glob("*.txt"):        text = file_path.read_text(encoding="utf-8")
documents.append({           "title": file_path.stem,          "text": text,    "source":
str(file_path)     }) return documents

22. 3 Basic Chunking

def split_text(text, chunk_size=900, overlap=150): chunks = [] start = 0 while start <
len(text):      end = min(start + chunk_size, len(text))     chunks.append(text[start:end])    if
end == len(text):         break      start = max(end - overlap, start + 1) return chunks

22. 4 Next Implementation Steps

After loading and chunking the approved documents, the system must generate embeddings,
build a searchable index, retrieve relevant passages, and send the evidence to the language
model.

22. 5 Important Note

This code demonstrates document loading and chunking only. A working RAG system
additionally requires retrieval, generation, citation handling, error handling, and testing.

## Page 23 — Grounded Responses and Source Citations
23. 1 Purpose of Citations

Citations help students verify that an answer reflects an actual policy document. They also help
administrators investigate incorrect answers.

23. 2 Citation Information

Where available, a citation should include:

- Policy title.
- Version or academic year.
- Section heading or clause number.
- PDF page number.
- Link to the official source.

23. 3 Example

Suppose a fictional policy states:

“A request for an assignment extension must be submitted to the course coordinator before the
published deadline. Approval is not automatic.”

A student asks, “Can I submit my assignment late if I ask for an extension?”

A suitable answer is:

“You may request an extension by submitting the approved form to your course coordinator
before the published deadline. Approval is not automatic. Please check the course's official
deadline and wait for confirmation.”

The application should attach the actual source citation from its indexed metadata.

23. 4 Handling Missing Evidence

If no relevant policy section is found, the assistant should say that it could not verify the answer
from the available documents.

23. 5 Handling Conflicts

If two approved sources appear inconsistent, the assistant should explain the conflict and direct
the question to the responsible policy owner unless an approved precedence rule resolves it.

## Page 24 — Backend API and Front-End Integration
24. 1 Backend Responsibilities

The backend receives questions, validates inputs, retrieves policy information, generates
answers, and returns results to the interface.

24. 2 Example API Design

An endpoint might be:

POST /api/policy-questions

Example request:

{
    "question": "How do I request leave?"
}

The server can return a structured response containing the answer, citations, an
evidence-sufficiency indicator, and an official contact link where appropriate.

24. 3 Processing Steps

1. Validate the question.
2. Authenticate the user when required.
3. Apply access and policy-scope filters.
4. Retrieve relevant passages.
5. Generate the grounded answer.
6. Validate source references.

7. Return the answer or escalation information.

24. 4 Front-End Features

The user interface may include:

- A question input field.
- A response area.
- Source citations and document links.
- Suggested policy categories.
- A feedback option.
- An official contact or escalation link.

24. 5 Error Handling

The application should handle empty questions, unavailable documents, retrieval failures,
timeouts, and model errors without presenting fabricated answers.

## Page 25 — Security and Privacy in the RAG System
25. 1 Security Requirements

The system should protect policy documents, student information, application credentials, and
administrative functions.

25. 2 Access Control

Public policies can be made searchable to students, while private records and staff-only
documents require stricter permissions.

25. 3 API Security

Use input validation, authentication where required, rate limiting, secure configuration, and
appropriate error handling.

25. 4 Credential Management

API keys and database passwords should not be hard-coded in application source files or
uploaded to public repositories.

25. 5 Prompt Injection

Retrieved documents and user questions should be treated as untrusted content. A malicious
passage must not be allowed to override the application's security rules.

25. 6 Privacy-Safe Logging

Logs should contain only the information necessary for troubleshooting, security, and quality
evaluation. Unnecessary personal details should not be retained.

25. 7 Testing

Security tests should cover unauthorised data access, malicious document content, citation
manipulation, prompt-injection attempts, and access to restricted policies.

## Page 26 — Evaluation and Testing
26. 1 Purpose of Evaluation

Evaluation determines whether the RAG system retrieves the correct policy evidence and
produces answers that accurately represent it.

26. 2 Test Dataset

Create a set of realistic questions covering all policy categories. Include direct questions,
paraphrases, ambiguous questions, misspellings, questions with no answer in the knowledge
base, and cases involving conflicting sources.

26. 3 Evaluation Metrics

- Retrieval recall: Whether the required evidence appears among retrieved passages.
- Retrieval precision: How much retrieved material is relevant.
- Faithfulness: Whether the generated claims are supported by the evidence.
- Citation accuracy: Whether the cited passages support the answer.
- Completeness: Whether important conditions and exceptions are included.
- Abstention quality: Whether the system avoids unsupported answers.
- Latency: How long the system takes to respond.
- User satisfaction: Whether users find the answers understandable and useful.

26. 4 Human Review

Policy owners or trained reviewers should assess important answers and a sample of routine
responses.

26. 5 Regression Testing

Whenever a policy, embedding model, retrieval configuration, or prompt changes, repeat the
relevant tests to identify regressions.

## Page 27 — Limitations and Risk Management
27. 1 Incorrect Retrieval

The system may retrieve a passage that is related to the question but does not answer it.
Metadata filters, reranking, and evaluation can reduce this problem.

27. 2 Outdated Documents

Old policies may produce misleading answers. Version management and controlled re-indexing
are essential.

27. 3 Hallucination

A language model may generate unsupported information. Grounding instructions, source
citations, answer checks, and abstention help mitigate this risk.

27. 4 Conflicting Policies

The system should use institution-approved source-precedence rules or escalate unresolved
conflicts.

27. 5 Ambiguous Questions

A question may require the campus, programme, semester, or academic year. The assistant
should request clarification when that information materially affects the answer.

27. 6 Privacy Risks

Personal records must not be exposed through public retrieval or unprotected logs.

27. 7 Over-Reliance on AI

Students should understand that the assistant provides information and explanations, not
necessarily formal institutional decisions.

27. 8 Risk Management Principle

For consequential matters involving grades, admissions, fees, discipline, or student rights, the
system should provide source-grounded guidance and direct the student to an authorised
decision-maker when necessary.

## Page 28 — Deployment, Maintenance, and Future
Enhancements
28. 1 Deployment

A prototype can run locally using approved policy files and a local or hosted search index. A
production deployment requires secure hosting, access control, monitoring, backups, and an
approved maintenance process.

28. 2 Maintenance

The institution should assign a responsible owner to each policy collection. Updated documents
must be validated, processed, indexed, and tested before they become the source for current
answers.

28. 3 Monitoring

Monitor retrieval failures, incorrect citations, unanswered questions, response times, user
feedback, and unexpected access patterns.

28. 4 Future Enhancements

Potential enhancements include:

- Multilingual questions and answers.
- Hybrid retrieval and reranking.
- A staff dashboard for policy management.
- Secure student-portal integration.
- Accessible voice interaction.
- Automated alerts when a policy is due for review.
- Aggregate analytics about common policy questions.

28. 5 Personalised Information

If the system later retrieves individual attendance, fee, or examination records, it will require
stronger authentication, authorisation, audit trails, and privacy review than a public policy-search
assistant.

28. 6 Deployment Principle

Reliability, security, maintainability, and source accuracy should take priority over adding
advanced features too early.

## Page 29 — Example Scenarios and Complete System
Workflow
29. 1 Scenario: Attendance Correction

A student asks how to correct an attendance record. The system identifies the attendance
category, retrieves the current policy, and provides the documented correction procedure with a
citation.

29. 2 Scenario: Scholarship Eligibility

A student asks whether they can apply for a scholarship. The system retrieves the relevant
eligibility criteria and explains them. If personal details are needed, it directs the student to the
authorised application process rather than promising approval.

29. 3 Scenario: Examination Re-evaluation

A student asks about re-evaluation. The assistant retrieves the relevant examination policy and
identifies the required form, application channel, and deadline only if those details are present in
the source.

29. 4 Scenario: Missing Policy Information

A student asks about a fee deadline that is not present in the indexed documents. The system
states that it cannot verify the deadline and provides the official finance contact if available.

29. 5 Complete Workflow

1. Student submits a question.
2. The backend validates the request.
3. The system determines the relevant policy scope.
4. The retriever searches approved documents.
5. Relevant passages are ranked and checked.
6. The language model generates a grounded answer.
7. The application validates citations and evidence sufficiency.
8. The student receives the answer or an appropriate escalation route.
9. Feedback is collected safely for future evaluation.

29. 6 Expected Outcome

The system provides faster access to policy information while preserving transparency, source
traceability, and institutional decision-making authority.

## Page 30 — Conclusion and References
30. 1 Conclusion

Student policies are essential for transparent and consistent educational administration. They
define academic requirements, attendance expectations, assessment procedures, financial
arrangements, student conduct, privacy practices, safety requirements, and available support
services.

A RAG-based Student Policies Information System can make these documents easier to search
and understand. By retrieving relevant policy passages and using them as context for a
language model, the system can answer natural-language questions and provide source
references.

However, successful implementation depends on much more than the language model. The
project must maintain approved and current documents, preserve metadata, retrieve the right
passages, generate grounded answers, protect student information, and recognise when human
assistance is required.

The system should be treated as a policy-navigation and explanation tool. Formal decisions
must remain with the institution's authorised personnel and procedures.

30. 2 Final Implementation Checklist

- Collect approved and current policy documents.
- Define policy categories, scope, and source precedence.
- Extract and validate document text.
- Create meaningful chunks with metadata.
- Generate embeddings and configure the search index.
- Implement retrieval and grounded answer generation.
- Include citations and abstention behaviour.
- Build the backend and student-facing interface.
- Apply access controls and privacy safeguards.
- Evaluate with realistic test questions.
- Obtain policy-owner approval.
- Monitor and maintain the system after deployment.

30. 3 References

1. Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP
       Tasks. https://arxiv.org/abs/2005.11401
2. Sentence Transformers documentation. https://www.sbert.net/
3. FAISS documentation. https://faiss.ai/
4. OWASP Top 10 for Large Language Model Applications.
       https://owasp.org/www-project-top-10-for-large-language-model-applications/
5. NIST AI Risk Management Framework.
       https://www.nist.gov/itl/ai-risk-management-framework
6. The institution's current student handbook, approved policy documents, official notices,
       forms, and applicable academic regulations.

Final note: The first five sections and the policy examples describe general student-policy
concepts. The RAG sections describe a proposed technical implementation. Before deploying
this project, replace generic examples with your institution's real approved policies and verify all
deadlines, amounts, eligibility requirements, and procedures.
