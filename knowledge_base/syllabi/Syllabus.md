# EduPilot Knowledge Base — Academic
## Syllabus
Document type: RAG-ready knowledge base · 29-page structure · Version 1.0


## Page 1 — Introduction to Academic Syllabus
### 1.1 Definition

An academic syllabus is an official document describing the content, learning objectives,
learning outcomes, teaching structure, and assessment requirements of a subject or course. It
helps students and faculty understand the topics to be covered and the knowledge and skills
expected by the end of the course.

### 1.2 Purpose

An academic syllabus helps to:

-    Define the prescribed topics and subtopics.
-    Organize content into units or modules.
-    Communicate course objectives and learning outcomes.
-    Identify practical and laboratory requirements.
-    Describe credits and teaching hours.
-    Explain the assessment structure.
-    Recommend textbooks and reference materials.
-    Support consistent teaching and learning.

### 1.3 Scope

A syllabus may cover the subject title, course code, semester, prerequisites, unit-wise content,
practical exercises, learning outcomes, assessment methods, textbooks, and references.

### 1.4 Role in EduPilot

EduPilot should use the syllabus knowledge base to answer questions such as:

-  What topics are included in a subject?
-  Which unit contains a particular topic?


-    How many practical experiments are prescribed?
-    What are the course outcomes?
-    Which textbooks are recommended?
-    Which syllabus version applies to a particular academic year?

### 1.5 Accuracy requirement

The assistant must distinguish official syllabus information from general educational
explanations. It must not invent course details when the source document is unavailable.


## Page 2 — Structure of a Syllabus Document
### 2.1 Standard sections

A syllabus document may contain:

   1. Institution and programme information.
   2. Academic year and semester.
   3. Course title and code.
   4. Credits and teaching hours.
   5. Prerequisites.
   6. Course objectives.
   7. Course outcomes.
   8. Unit-wise topics.
   9. Practical and laboratory work.
   10.Assessment pattern.
   11.Textbooks and references.
   12.Additional academic instructions.

### 2.2 Document identification

The institution, programme, subject code, and academic year help identify the correct syllabus.
Subject titles alone may not be sufficient because similar names can occur across programmes.

### 2.3 Document status

Each document should be labelled as approved, draft, revised, superseded, or pending
verification, according to available evidence.

### 2.4 Completeness

A syllabus may be incomplete if pages, tables, appendices, or practical sections are missing.
The knowledge base should record such limitations.


### 2.5 RAG application

Every indexed section should retain its document identity and location so that answers can be
traced back to the source.


## Page 3 — Programme Structure and Curriculum
Framework
### 3.1 Programme structure

A programme structure describes how courses are distributed across semesters or academic
years. It defines compulsory subjects, electives, practical components, projects, internships, and
other programme requirements.

### 3.2 Course categories

Common categories include:

-    Core courses: Essential subjects within the programme.
-    Elective courses: Subjects selected from an approved list.
-    Foundation courses: Subjects that develop prerequisite knowledge.
-    Practical courses: Laboratory and hands-on activities.
-    Project courses: Work that applies knowledge to a defined problem.
-    Internship courses: Structured workplace or professional learning, where applicable.
-    Skill-development courses: Courses intended to develop specified technical or
        professional skills.

The institution's curriculum determines the actual categories and requirements.

### 3.3 Semester mapping

Each course should be associated with its programme stage, semester, and applicable
curriculum version.

### 3.4 Curriculum dependencies

Some courses depend on earlier courses or must be taken alongside another course. Such
relationships should be stored as explicit prerequisite or co-requisite metadata.

### 3.5 EduPilot requirement


When a student asks for a semester-wise syllabus, the system must retrieve the programme
structure for the correct branch and academic year instead of combining subjects from unrelated
programmes.


## Page 4 — Subject Identification and Course Codes
### 4.1 Course identification

A course code is an identifier assigned to a subject. It helps distinguish courses with similar or
identical names.

### 4.2 Common subject fields

A subject record may include:

-    Course code.
-    Course title.
-    Programme or department.
-    Semester.
-    Academic year.
-    Course category.
-    Credits.
-    Teaching hours.
-    Prerequisites.
-    Syllabus version.

### 4.3 Course-code interpretation

Course codes may encode department, subject category, programme level, or semester. The
meaning of each segment must be taken from the institution's documentation.

### 4.4 Duplicate subject names

Two programmes may use the same subject title but prescribe different topics or assessment
patterns. The course code and programme metadata should therefore be used during retrieval.

### 4.5 Example

A database subject in an Information Technology programme may not have the same course
code, credit value, or unit structure as a similarly named subject in another programme.

This example illustrates why subject titles alone are insufficient for accurate retrieval.

### 4.6 Missing identifiers


If a student provides only an ambiguous subject name, EduPilot should ask for the programme,
semester, or subject code when necessary.


## Page 5 — Credits, Teaching Hours, and Workload
### 5.1 Credit allocation

Credits represent the academic value assigned to a course under an institution's credit system.
The method for assigning credits depends on the approved curriculum.

### 5.2 Teaching components

A course may contain lecture, tutorial, practical, laboratory, project, or independent-learning
components.

### 5.3 Contact hours

Contact hours refer to scheduled learning activities involving faculty or another designated
teaching arrangement. The syllabus may specify hours per week or total hours.

### 5.4 Workload interpretation

Credits, contact hours, and total student workload are related but not necessarily
interchangeable. The institution's rules determine how each is calculated.

### 5.5 Data validation

EduPilot should not derive official credits from a subject title or assume a universal conversion
between practical hours and credits.

### 5.6 Example record

An illustrative subject record could contain:

-    Course title: Database Management Systems.
-    Course code: Institution-defined.
-    Credits: To be verified.
-    Lecture hours: To be verified.
-    Practical hours: To be verified.
-    Total workload: As defined by the applicable curriculum.

### 5.7 Student query


If asked, “How many credits does this subject carry?”, the assistant should retrieve the official
subject record and cite the relevant syllabus section.


## Page 6 — Course Objectives and Learning Outcomes
### 6.1 Course objectives

Course objectives describe what a subject intends to teach. They generally explain the broad
knowledge or abilities that the course aims to develop.

### 6.2 Course outcomes

Course outcomes describe what students should be able to demonstrate after completing the
course.

For example, a programming course might aim for students to design algorithms, write
programs, test solutions, and debug errors. This is an illustrative example, not an official
outcome for any specific course.

### 6.3 Programme outcomes

Programme outcomes describe broader capabilities expected from graduates of an entire
programme.

### 6.4 Outcome mapping

Some institutions map course outcomes to programme outcomes or other approved educational
frameworks.

### 6.5 Outcome assessment

Assessment activities may be associated with particular outcomes to help determine whether
students have achieved the intended learning goals.

### 6.6 RAG implementation

Store objectives, outcomes, and unit topics as separate fields. If a student asks, “What skills will
I gain from this subject?”, EduPilot should retrieve the relevant outcomes instead of returning
only chapter titles.


## Page 7 — Unit-Wise Topics and Subtopics
### 7.1 Unit organization


A subject is often divided into units, modules, or chapters. Each unit groups related concepts
into a manageable learning section.

### 7.2 Unit-level fields

A unit record may contain:

-    Unit number.
-    Unit title.
-    Topic list.
-    Subtopic list.
-    Teaching hours, if specified.
-    Related learning outcomes.
-    Recommended resources.
-    Associated practical activities.

### 7.3 Topic hierarchy

The relationship between a unit and its subtopics must be preserved during PDF extraction.
Otherwise, the system may retrieve a topic without knowing which unit or subject it belongs to.

### 7.4 Exact topic matching

If a student asks whether a particular algorithm is included, EduPilot should look for the explicit
topic and relevant broader headings.

A concept that is merely related to the syllabus must not automatically be presented as an
explicitly prescribed topic.

### 7.5 Incomplete content

If the source contains unreadable text or missing pages, the assistant should explain the
limitation instead of claiming that the returned list is complete.

### 7.6 Retrieval example

Question: “Which unit includes hashing?”

Expected behaviour: Retrieve the applicable subject's unit list, identify any explicit mention of
hashing, and provide the source location.


## Page 8 — Practical Syllabus and Laboratory Experiments
### 8.1 Purpose


A practical syllabus specifies hands-on activities that allow students to apply theoretical
concepts and demonstrate technical skills.

### 8.2 Practical record structure

Each experiment may include:

-    Experiment number.
-    Title.
-    Aim.
-    Learning objective.
-    Required tools or software.
-    Procedure or implementation requirements.
-    Expected output.
-    Submission requirements.
-    Assessment criteria.

The exact fields depend on the official laboratory manual.

### 8.3 Experiment ordering

The original numbering and sequence should be preserved. Reordering experiments may make
it difficult for students to match the AI response with their manual.

### 8.4 Practical completion

The institution may define requirements for laboratory attendance, completed records,
verification, demonstrations, and practical examinations.

### 8.5 Missing experiments

If the source PDF omits a page or contains a broken table, EduPilot should not assume that the
extracted list contains every experiment.

### 8.6 Student query

Question: “Give me all practicals for this semester.”

Expected behaviour: Identify the correct laboratory subject, retrieve the complete prescribed list,
preserve numbering, and cite the laboratory manual or syllabus pages.


## Page 9 — Theory and Practical Assessment Structure
### 9.1 Assessment overview


A syllabus may specify how student performance is evaluated. Assessment components can
include written examinations, assignments, practical work, projects, presentations, and other
approved activities.

### 9.2 Marks and weightings

The syllabus or assessment scheme may assign marks or weightings to individual components.
These values must be extracted from the correct official document.

### 9.3 Internal assessment

Internal assessment may involve tests, assignments, quizzes, laboratory performance, or other
specified activities.

### 9.4 External assessment

External assessment may include semester-end examinations or other assessments
administered under the institution's examination system.

### 9.5 Practical evaluation

Practical assessment may evaluate implementation, accuracy, process, documentation,
demonstration, or oral explanation according to the approved rubric.

### 9.6 Assessment document conflicts

If the syllabus and a later examination circular provide different details, the system must check
the authority, effective date, and scope of each document.

### 9.7 RAG rule

Never invent maximum marks, passing marks, weightings, or assessment deadlines when the
official source does not specify them.


## Page 10 — Textbooks and Reference Materials
### 10.1 Prescribed textbooks

A prescribed textbook is an officially recommended or required learning resource for a course,
depending on the institution's terminology.

### 10.2 Reference books


Reference books provide additional explanations, examples, alternative approaches, or
advanced material.

### 10.3 Bibliographic fields

Where available, preserve:

-    Author or editor.
-    Book title.
-    Edition.
-    Publisher.
-    Publication year.
-    ISBN.
-    Resource category.
-    Related subject.

### 10.4 Digital resources

An institution may recommend online documentation, approved educational platforms, articles,
or other digital resources.

### 10.5 Official versus supplementary content

A book may cover more topics than the syllabus prescribes. Its contents must not automatically
be treated as the official examination scope.

### 10.6 EduPilot response

When asked for a recommended book, the assistant should identify whether the resource is
prescribed, recommended, or supplementary. It should not invent missing author or edition
details.


## Page 11 — Elective Subjects and Specializations
### 11.1 Definition

An elective is a course that a student may select from an approved set of subjects, subject to
the applicable curriculum rules.

### 11.2 Elective categories

Electives may focus on technical specialization, interdisciplinary learning, professional skills, or
other approved learning objectives.


### 11.3 Selection conditions

Selection may depend on prerequisites, availability, deadlines, timetable compatibility, academic
approval, and credit restrictions.

### 11.4 Course availability

A subject appearing in the curriculum does not necessarily mean that it is offered in every
semester. Actual offerings should be checked against the current official notice or department
information.

### 11.5 Specialization mapping

The knowledge base should identify which electives are associated with each programme,
semester, or specialization.

### 11.6 Example

A student asks whether an artificial intelligence elective is available in a particular semester.
EduPilot should retrieve the approved elective list and verify the applicable semester and
availability before answering.

### 11.7 Edge case

If an elective is listed in the syllabus but not offered that year, the system should distinguish the
approved curriculum from the current course offering.


## Page 12 — Prerequisites and Co-Requisites
### 12.1 Prerequisites

A prerequisite is a course, qualification, or condition that must be completed before enrolling in
another course.

### 12.2 Co-requisites

A co-requisite is a course or requirement that must be completed alongside another course,
according to the applicable rules.

### 12.3 Purpose

These requirements help ensure that students have the background knowledge needed to study
more advanced material.


### 12.4 Official verification

Prerequisites should be retrieved from the relevant syllabus or course catalogue. They should
not be inferred solely from the subject's difficulty or title.

### 12.5 Equivalent courses

A student who has completed a similar course elsewhere may need formal approval before it is
accepted as an equivalent prerequisite.

### 12.6 Missing information

If no prerequisite is mentioned in the available document, EduPilot should say that the
document does not specify one. It should not assume that no prerequisite exists in other
institutional rules.

### 12.7 Retrieval metadata

Store prerequisite relationships explicitly so that course-selection questions can be answered
without scanning unrelated syllabus sections.


## Page 13 — Curriculum Revisions and Version
Comparison
### 13.1 Reasons for revision

A curriculum may be revised to update technical content, learning outcomes, assessment
methods, references, or programme requirements.

### 13.2 Approval and publication

A revision may require review and approval by the institution's authorized academic body before
publication.

### 13.3 Effective date

Every available version should be linked to its effective academic year or date, wherever stated.

### 13.4 Transition arrangements

The institution may define whether existing students continue under the previous curriculum or
move to the revised version.


### 13.5 Version comparison

EduPilot may compare approved versions to identify:

-    Added or removed topics.
-    Changed unit headings.
-    Modified credits.
-    Updated practical experiments.
-    Revised learning outcomes.
-    Updated textbooks.
-    Changes to assessment structures.

### 13.6 Historical syllabus requests

Historical versions may be needed by students completing older curricula. Such documents
should remain searchable but clearly labelled as historical.

### 13.7 Critical rule

The newest uploaded file must not automatically be treated as the governing syllabus. Approval
status and applicability must first be established.


## Page 14 — Academic Calendar and Syllabus Coverage
### 14.1 Relationship between syllabus and calendar

The syllabus defines intended course content. The academic calendar defines important dates
and academic periods. A teaching plan connects syllabus topics to scheduled sessions.

### 14.2 Teaching plan

A teaching plan may assign topics to weeks or classes and reserve time for practicals, revision,
and assessments.

### 14.3 Coverage tracking

Departments may record topics as planned, in progress, completed, or pending. These statuses
should come from actual teaching records.

### 14.4 Schedule changes

Class cancellations, holidays, or timetable changes may require revisions to the teaching plan.

### 14.5 Student questions


Question: “Has Unit 4 been completed?”

The assistant needs an updated teaching log or faculty record. The syllabus alone cannot
establish actual classroom progress.

### 14.6 Source separation

EduPilot should distinguish between:

-    Approved syllabus.
-    Academic calendar.
-    Teaching plan.
-    Classroom-completion records.
-    Examination timetable.

This separation prevents the system from confusing prescribed topics with topics already taught
or scheduled for examination.


## Page 15 — Topic Search and Syllabus Interpretation
### 15.1 Purpose

Syllabus interpretation determines how a student's question maps to the actual course
document.

### 15.2 Topic matching

Queries may refer to a unit title, a specific subtopic, a practical experiment, or a concept
described using different wording.

### 15.3 Synonyms

Semantic search can match related terminology, but semantic similarity alone does not prove
that a concept is explicitly included in the syllabus.

### 15.4 Broad headings

A broad unit heading may include several concepts. The assistant should explain the distinction
between a general heading and an explicitly listed subtopic.

### 15.5 Example questions

-  “Is sorting included in my syllabus?”
-  “Which unit contains hashing?”


-  “Where is inheritance mentioned?”
-  “Which practical covers binary search?”

### 15.6 Ambiguous wording

If a syllabus uses an unclear abbreviation or incomplete phrase, preserve the source wording
and request clarification when necessary.

### 15.7 Response format

A useful answer should provide the topic, relevant unit, subject identity, and source reference. If
the topic is not found, the assistant should state the limits of the search rather than claim that it
is definitely excluded from every applicable document.


## Page 16 — PDF Collection and Text Extraction
### 16.1 Document collection

The syllabus knowledge base may contain approved syllabus PDFs, curriculum handbooks,
laboratory manuals, subject catalogues, assessment schemes, and official revision notices.

### 16.2 Digital PDFs

PDFs containing selectable text can generally be processed through text extraction tools.
Headings, tables, and reading order must still be checked.

### 16.3 Scanned PDFs

Scanned documents may require Optical Character Recognition (OCR) to convert page images
into searchable text.

### 16.4 Structure preservation

The extraction process should preserve:

-    Document titles.
-    Section and unit headings.
-    Course codes.
-    Credits and teaching hours.
-    Topic lists.
-    Practical numbers.
-    Assessment tables.
-    Textbook references.
-    Page numbers.


### 16.5 Quality validation

OCR can misread letters, digits, mathematical symbols, abbreviations, and table values.
Extracted content should be compared with the original document, particularly where a small
error could change an academic requirement.

### 16.6 Incomplete files

If pages are missing or unreadable, record the limitation in the document metadata. The system
must not describe an incomplete extraction as a complete syllabus.

### 16.7 Recommended processing record

For each file, store the source filename, extraction date, processing status, OCR status, page
count, validation status, and any known limitations.


## Page 17 — Chunking Strategy for Syllabus Documents
### 17.1 Definition

Chunking divides a large document into smaller text passages so that the retrieval system can
find the relevant information for a question.

### 17.2 Structure-aware chunking

For syllabus documents, chunks should follow meaningful boundaries such as course
descriptions, unit headings, learning outcomes, practical lists, assessment tables, and reference
sections.

### 17.3 Context preservation

A chunk containing a topic list should retain the subject title and unit heading wherever possible.
Without that context, the retriever may return correct text associated with the wrong subject.

### 17.4 Metadata

Each chunk should carry relevant fields, such as:

-    Document ID.
-    Institution.
-    Programme or branch.
-    Semester.
-    Subject code.
-    Subject title.


-    Unit number.
-    Academic year.
-    Curriculum version.
-    PDF page number.

### 17.5 Chunk size and overlap

Chunk size depends on document structure and the embedding model. Smaller chunks may
improve precise retrieval, while larger chunks may preserve more context. Limited overlap can
help when a section spans multiple chunks.

### 17.6 Common chunking errors

Avoid chunks containing only an isolated heading, a table value without its column labels, or a
list of topics without its subject identity.

### 17.7 Validation

Test whether each unit, experiment list, course outcome, and assessment section can be
retrieved independently and with the correct metadata.


## Page 18 — Embeddings and Vector Database
### 18.1 Embeddings

An embedding represents text as a numerical vector. Embeddings allow the retrieval system to
compare passages based on semantic similarity.

### 18.2 Index creation

After extracting and chunking a syllabus, the system generates embeddings for the chunks and
stores them alongside their text and metadata.

### 18.3 Vector database

A vector database supports storing and retrieving these embedded passages. The project may
use a dedicated vector database or another search system that supports the required retrieval
features.

### 18.4 Semantic retrieval

Semantic retrieval can match questions that use wording different from the syllabus.


For example, a student might ask for “hands-on experiments,” while the document labels the
section “Laboratory Practicals.”

### 18.5 Metadata filtering

Metadata filters restrict searches to the correct institution, programme, semester, subject, or
curriculum version.

### 18.6 Hybrid retrieval

Combining semantic search with keyword search may improve retrieval for exact subject codes,
technical terms, abbreviations, and unit numbers.

### 18.7 Limitations

A high similarity score does not establish that a document is approved, current, or applicable.
Those properties must be verified separately.


## Page 19 — Retrieval-Augmented Generation for Syllabus
Queries
### 19.1 Query analysis

The system should identify the subject, programme, semester, academic year, and requested
information where these details are relevant.

### 19.2 Retrieval

The retrieval layer searches the indexed syllabus chunks and returns passages relevant to the
question.

### 19.3 Applicability validation

Retrieved passages should be checked for subject identity, curriculum version, effective date,
and source status.

### 19.4 Grounded answer generation

The language model generates an answer using the retrieved evidence. It should not introduce
unsupported unit topics, credits, marks, or deadlines.

### 19.5 Citation handling


Where possible, responses should identify the document title, subject code, unit or section, and
PDF page number.

### 19.6 Abstention

If no reliable passage supports an answer, the assistant should explain that the information
cannot be verified from the available syllabus.

### 19.7 Example

Student question: “Give me all topics from Unit 3.”

Expected workflow: Identify the correct subject and curriculum version, retrieve the complete
Unit 3 section, verify that the list is complete, and return the topics with a source reference.


## Page 20 — Common Student Queries and Response
Workflows
### 20.1 Unit-wise topic lookup

The system identifies the course, retrieves the requested unit, and returns the listed topics in
their original order.

### 20.2 Practical list retrieval

The system retrieves the official practical section and preserves experiment numbering and
titles.

### 20.3 Course outcome lookup

The system retrieves the objectives or outcomes associated with the identified course.

### 20.4 Textbook lookup

The system returns the prescribed or recommended references and distinguishes them from
supplementary learning resources.

### 20.5 Curriculum comparison

The system retrieves two verified syllabus versions and compares their supported differences.

### 20.6 Course-code lookup


The system uses course-code metadata to identify the correct subject record.

### 20.7 Ambiguous questions

If multiple subjects match the question, ask for the subject code, programme, or semester rather
than selecting an arbitrary result.

### 20.8 Missing syllabus

If the applicable syllabus is unavailable, explain that limitation and request the official document
or direct the student to the department.


## Page 21 — Backend API and Frontend Integration
### 21.1 Backend responsibilities

The backend receives student questions, validates inputs, retrieves relevant syllabus content,
calls the language model, and returns a grounded answer with source information.

### 21.2 Example request fields

An API request may include:

-    Student question.
-    Programme identifier.
-    Semester.
-    Subject code.
-    Academic year.
-    Relevant conversation context.

Only necessary information should be collected.

### 21.3 Example response fields

A response may contain:

-    Answer text.
-    Source document.
-    Subject title and code.
-    Unit or section.
-    PDF page number.
-    Curriculum version.
-    Verification status.
-    Clarification request, where needed.


### 21.4 Frontend presentation

The user interface should display the answer clearly and make source references easy to
inspect. It should distinguish verified syllabus information from general explanations.

### 21.5 Error handling

The API should handle missing documents, empty retrieval results, invalid subject codes, model
failures, and malformed requests without exposing internal credentials.

### 21.6 Operational boundaries

Explaining a syllabus is different from modifying academic records. Any registration changes,
official course selections, or consequential academic actions require a separate authorized
workflow.


## Page 22 — Security, Privacy, and Document Permissions
### 22.1 Document access

The knowledge base may contain publicly available syllabi, internal documents, draft curricula,
or restricted academic materials. Access must follow the institution's permissions.

### 22.2 Public and confidential content

Publicly approved syllabus information may be made available according to its publication
terms. Draft or confidential documents should not automatically be exposed to every user.

### 22.3 Student records

Private student information should not be mixed into the general syllabus index unless a justified
and access-controlled design requires it.

### 22.4 Access control

If users have different permissions, the backend must enforce those permissions before
retrieving restricted documents.

### 22.5 Malicious document instructions

Uploaded documents may contain text that resembles instructions to the AI. Retrieved
document text must be treated as source material, not as instructions that override system rules
or security controls.


### 22.6 Logging

Logs should contain enough information for debugging and evaluation while avoiding
unnecessary collection of sensitive personal data.

### 22.7 Credential protection

API keys, database passwords, and other secrets must be stored securely and never exposed
in generated answers or indexed public documents.


## Page 23 — Testing and Quality Evaluation
### 23.1 Purpose

Testing verifies that EduPilot retrieves the correct syllabus information and answers questions
accurately.

### 23.2 Retrieval tests

Check whether the system retrieves the correct subject, unit, practical list, learning outcome, or
assessment section.

### 23.3 Groundedness tests

Confirm that the answer is supported by the retrieved passages and does not introduce
unsupported academic facts.

### 23.4 Citation tests

Verify that citations point to the correct document, section, and page.

### 23.5 Sample test cases

Test A — Unit lookup

Question: “List all topics in Unit 2.”

Expected result: Return the Unit 2 topics from the correct subject and curriculum version.

Test B — Practical lookup

Question: “Which experiments are prescribed?”

Expected result: Return the official practical list in its original order.


Test C — Textbook lookup

Question: “Which reference book is recommended?”

Expected result: Return the reference recorded in the syllabus, with bibliographic details where
available.

Test D — Version comparison

Question: “What changed in the revised syllabus?”

Expected result: Identify differences supported by both verified documents.

Test E — Missing information

Question: “How many credits does this subject have?”

Expected result: Retrieve the official value or state that it cannot be verified.

### 23.6 Evaluation metrics

Useful metrics include retrieval precision, retrieval recall, answer correctness, citation accuracy,
groundedness, response latency, and appropriate handling of uncertainty.

### 23.7 Regression testing

Whenever a syllabus is updated, rerun the affected tests to identify stale information or retrieval
failures.


## Page 24 — Handling Conflicts, Missing Data, and Edge
Cases
### 24.1 Multiple syllabus versions

The system may contain an older syllabus, a revised version, and a draft. These must be
distinguished using reliable metadata.

### 24.2 Programme mismatch

A topic found in one programme must not automatically be returned as prescribed content for
another programme.

### 24.3 Missing pages


If part of a PDF is missing, the assistant must disclose that it cannot verify the complete topic
list.

### 24.4 OCR errors

Unclear course codes, credits, experiment numbers, and assessment values should be flagged
for verification.

### 24.5 Conflicting sources

Compare approval status, issuing authority, effective date, applicability, and supersession rules.
If the conflict remains unresolved, refer it to the responsible academic office.

### 24.6 Topic inference

A related topic may be useful as additional educational context, but it must not be labelled an
officially prescribed topic unless the syllabus supports that claim.

### 24.7 Outdated document

If only an older syllabus is available, identify its academic year and clearly state that the
currently applicable version has not been verified.


## Page 25 — Syllabus Maintenance and Version Control
### 25.1 Ownership

The institution should designate a responsible department or authorized person to maintain and
validate syllabus documents.

### 25.2 Update workflow

   1. Receive the revised document.
   2. Verify its source and approval status.
   3. Record its effective date and applicable student cohorts.
   4. Compare it with the previous version.
   5. Extract and validate the content.
   6. Update metadata and search indexes.
   7. Run regression tests.
   8. Record the review and update history.

### 25.3 Version statuses


Possible statuses include current, superseded, draft, archived, and pending verification. Each
status must reflect the available document evidence.

### 25.4 Historical records

Older syllabi may remain necessary for students following earlier curricula. Historical documents
should remain searchable but must be clearly identified as historical.

### 25.5 Re-indexing

When content changes, affected chunks and embeddings may need to be regenerated so that
retrieval reflects the revised document.

### 25.6 Audit trail

Maintain the document version, update date, responsible reviewer, and validation outcome.

### 25.7 Critical principle

Uploading a new file does not automatically make it the governing syllabus. Approval status and
applicability must be verified.


## Page 26 — Frequently Asked Questions
Q1. What is an academic syllabus?

It is a document describing the prescribed content, objectives, outcomes, structure, and relevant
requirements of a subject or course.

Q2. What is the difference between a syllabus and a curriculum?

A curriculum generally describes the broader programme structure and academic requirements.
A syllabus usually describes the content and requirements of a particular subject or course.
Institutional terminology may vary.

Q3. Can EduPilot list all topics in a unit?

Yes, when the applicable syllabus is available, readable, and sufficiently complete.

Q4. Can the assistant provide every practical experiment?

It can retrieve the complete prescribed list when the official practical syllabus or laboratory
manual is available and readable.


Q5. Can it tell me whether the syllabus has changed?

It can compare verified versions and official revision notices.

Q6. Does the syllabus show what has already been taught?

Not necessarily. Actual teaching progress requires a teaching plan or classroom-completion
record.

Q7. Can EduPilot predict examination questions?

It can generate practice questions based on prescribed topics, but it cannot guarantee which
questions will appear in an examination.

Q8. What if the syllabus is unreadable?

The assistant should disclose the limitation and request a clearer official document or refer the
issue to the department.

Q9. Can an old syllabus answer a current question?

Only if that version remains applicable. Otherwise, it should be identified as historical.

Q10. What if a topic is not found?

The assistant should explain that it could not verify the topic in the available source and clarify
the scope of the search.


## Page 27 — Sample RAG Scenarios and Expected
Answers
Scenario 1 — Unit-wise syllabus

Question: “Give me all topics in Unit 4 of Data Structures.”

Workflow: Identify the subject code and curriculum version, retrieve Unit 4, verify completeness,
and return the listed topics with a source reference.

Scenario 2 — Practical experiments

Question: “How many experiments are in my laboratory syllabus?”


Workflow: Retrieve the full practical list and count its entries. If the document is incomplete,
disclose that the count may not represent the full syllabus.

Scenario 3 — Recommended textbook

Question: “Which textbook should I use?”

Workflow: Retrieve the official textbook and reference list. Distinguish prescribed resources from
supplementary suggestions.

Scenario 4 — Curriculum comparison

Question: “What is different in the old and new syllabus?”

Workflow: Retrieve both verified versions and compare unit topics, credits, practicals, learning
outcomes, and assessment structure.

Scenario 5 — Topic inclusion

Question: “Is inheritance included in my C++ syllabus?”

Workflow: Search the correct course and determine whether inheritance is explicitly mentioned,
included under a broader heading, or not verifiable.

Scenario 6 — Missing course credits

Question: “What are the exact credits for this subject?”

Workflow: Search the applicable syllabus or programme structure. If the value is missing or
unreadable, explain that it cannot be confirmed.

Scenario 7 — Ambiguous subject

Question: “Give me the syllabus for programming.”

Workflow: Ask which programming subject, programme, semester, or course code the student
means if multiple matches exist.

Scenario 8 — Outdated syllabus

Question: “Give me the latest syllabus.”

Workflow: Identify the most recent verified, approved, applicable version. If approval or currency
cannot be established, disclose the limitation.


## Page 28 — Implementation Checklist for EduPilot
### 28.1 Document preparation

-    Collect approved syllabus PDFs.
-    Identify the institution, programme, and semester.
-    Record subject codes and titles.
-    Record academic years and curriculum versions.
-    Extract unit headings and subtopics.
-    Capture course objectives and outcomes.
-    Validate credits and teaching hours.
-    Preserve practical numbering.
-    Capture assessment details.
-    Preserve textbooks and references.
-    Validate OCR and table extraction.

### 28.2 RAG preparation

-    Create meaningful syllabus chunks.
-    Attach programme and subject metadata.
-    Configure metadata filters.
-    Distinguish current and historical versions.
-    Test unit-wise retrieval.
-    Test practical-list retrieval.
-    Test course-outcome and textbook retrieval.
-    Validate citations and page references.
-    Configure uncertainty responses.
-    Enforce document access permissions.
-    Create regression tests for updates.

### 28.3 Deployment

Before deployment, validate a representative set of questions against the actual syllabus
documents. Review incorrect retrievals, unsupported answers, and citation failures before
making the system available to students.


## Page 29 — Governance, Final FAQs, and Conclusion
### 29.1 Governance

The institution should assign responsibility for syllabus approval, document maintenance,
version control, and validation. The RAG system should use only documents whose status and
applicability are sufficiently established for the intended purpose.


### 29.2 Final FAQs

Can EduPilot replace the official syllabus PDF?

No. It can make the syllabus easier to search and understand, but the approved document
remains the authoritative source.

Can the assistant add useful explanations?

Yes, but it should distinguish general educational explanations from topics explicitly prescribed
by the syllabus.

What should happen when no answer is available?

The assistant should state that it cannot verify the information and identify the relevant
document or academic office.

How should curriculum changes be handled?

Verify the revised document, update its metadata, re-index affected content, and rerun the
relevant tests.

### 29.3 Conclusion

An Academic Syllabus knowledge base enables EduPilot to answer student questions about
subjects, units, practicals, credits, learning outcomes, textbooks, electives, and curriculum
revisions.

Its reliability depends on accurate document extraction, meaningful chunking,
programme-specific metadata, correct version selection, grounded answer generation, and
source citations.

The system must distinguish prescribed curriculum content from general learning resources,
classroom progress, and examination notices.

Final principle: Never invent subject codes, topics, credits, marks, or curriculum applicability.
When official evidence is missing, communicate uncertainty and direct the user to an
authoritative source.

Next step: Tujhyakade actual college syllabus PDF asel tar upload kar. Tyatun apan exact
subject-wise syllabus knowledge base banavu, jyamule EduPilot generic information aivaji
official syllabus varun answers deu shakel.
