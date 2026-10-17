# EduPilot Knowledge Base: Academic Regulations
Document type: RAG-ready institutional policy reference · Version 1.0 · 30-page structure

## Page 1 — Introduction to Academic Regulations
### 1.1 Definition

Academic regulations are formally established rules that govern teaching, learning, assessment,
academic progression, and the completion of educational programmes at colleges and
universities. They define the responsibilities of students, faculty members, departments,
examination offices, and academic administrators.

Academic regulations provide a common framework for making academic decisions. They help
ensure that students enrolled in the same programme are evaluated using consistent,
transparent, and approved criteria.

### 1.2 Objectives

The principal objectives of academic regulations are to:

- Establish consistent academic standards across programmes and semesters.
- Explain admission, registration, attendance, and examination requirements.
- Define the procedures for assessment, grading, and result publication.
- Establish rules for promotion, course repetition, and degree completion.
- Protect students' rights through documented procedures.
- Define how academic disputes, appeals, and exceptions are handled.
- Help academic offices make decisions using approved policies rather than informal
        assumptions.

### 1.3 Scope

Academic regulations may cover admission eligibility, course registration, credit requirements,
attendance, internal assessment, semester-end examinations, grading, backlogs, revaluation,
academic misconduct, progression, graduation, and appeals.

### 1.4 Intended users

The knowledge base is designed for students, faculty members, academic coordinators,
department administrators, examination departments, and AI assistants answering
academic-policy questions.

### 1.5 Policy status

Every rule in a production system should be identified as one of the following:

- Official rule: Extracted from an approved institutional document.
- Configurable policy: A field that the institution must populate.
- Illustrative example: Used only to explain a procedure.
- Unverified information: Requires confirmation from an authorized office.

This classification prevents a RAG assistant from presenting a general example as an official
college requirement.

## Page 2 — Governance and Authority of Academic
### 2.1 Academic governance

Academic regulations are usually approved, interpreted, or administered through designated
institutional authorities. Depending on the institution and its legal framework, these may include
an academic council, board of studies, examination board, department head, registrar, principal,
dean, or another authorized body.

The exact names and powers of these authorities must be taken from institutional documents.

### 2.2 Responsibilities

Institutional governing authority

- Approves regulations within its authority.
- Establishes academic standards.
- Authorizes amendments and effective dates.

Academic administration

- Communicates approved regulations.
- Coordinates implementation across departments.
- Maintains the official policy repository.

Department

- Implements applicable programme requirements.
- Communicates subject-level requirements.
- Refers exceptions to the authorized authority.

Examination office

- Administers examinations and results.
- Publishes official notices.
- Processes requests according to approved procedures.

Student

- Reviews applicable requirements.
- Completes required registration and assessments.
- Observes deadlines and academic conduct rules.
- Uses official channels to report errors or appeal decisions.

### 2.3 Conflicts between documents

If two documents appear to conflict, the system should not automatically select whichever text
was retrieved first. It should examine:

   1. Whether both documents apply to the same programme.
   2. Their approval status.
   3. Their effective dates.
   4. Whether one document explicitly amends or supersedes the other.
   5. Whether the conflict requires an authorized interpretation.

### 2.4 Escalation

If authority or applicability cannot be established, the assistant should explain the conflict and
refer the student to the designated academic office.

Example: A department notice states one registration deadline, while a later university circular
gives another. The system should check whether the later circular officially supersedes the
earlier notice before advising the student.

## Page 3 — Academic Calendar and Semester Structure
### 3.1 Academic calendar

An academic calendar is the institution's schedule of important academic events. It may include:

- Commencement of classes.
- Registration periods.

- Add/drop deadlines.
- Internal assessment dates.
- Practical examination periods.
- Semester-end examinations.
- Holidays and institutional closures.
- Result publication dates.
- Supplementary examination periods.
- Semester breaks and commencement of the next term.

### 3.2 Semester structure

A semester-based programme divides the academic year into defined teaching and assessment
periods. The number of semesters, their duration, credit structure, and assessment schedules
depend on the applicable programme regulations.

### 3.3 Calendar amendments

An institution may revise dates because of administrative, operational, or other authorized
reasons. The knowledge base must retain the original notice and any revised notice, clearly
identifying which schedule is currently applicable.

### 3.4 Deadline interpretation

A date mentioned in a document must be interpreted in its stated context. For example, a date
may represent the last day for submission, the first day of an examination period, or the date of
result publication. These meanings must not be confused.

### 3.5 Student queries

When asked, “When does my examination start?”, the assistant should identify the student's
programme, semester, examination type, and applicable academic calendar before answering.

If the calendar is missing or outdated, the assistant must state that it cannot verify the current
schedule.

## Page 4 — Admission and Academic Eligibility
### 4.1 Admission requirements

Admission regulations determine whether an applicant is eligible to enter a programme.
Requirements may vary according to the qualification level, programme, admission category,
applicable legislation, and institution.

Typical eligibility fields include:

- Required previous educational qualification.
- Minimum qualifying marks, where applicable.
- Required entrance examination or merit criteria.
- Subject-specific prerequisites.
- Document verification requirements.
- Application and admission deadlines.
- Reservation or category-related provisions, where applicable.
- Additional requirements for international or transfer applicants.

### 4.2 Verification process

A typical admission workflow consists of application submission, document verification, eligibility
assessment, merit or selection processing, admission approval, fee payment, and confirmation
of enrolment.

Each stage must follow the officially approved procedure.

### 4.3 Incomplete applications

An application may be held for clarification if mandatory documents are missing, inconsistent, or
illegible. Whether an applicant can correct the application depends on the relevant rules and
deadlines.

### 4.4 Admission cancellation

Cancellation, withdrawal, and fee refunds must be handled according to the applicable
admission and refund policy. The AI assistant must not promise a refund without checking
eligibility and deadlines.

RAG example

Question: “Can I get admission if one document is missing?”

Expected answer: “This depends on the admission rules and the document involved. Please
consult the official admission checklist or contact the admissions office to confirm whether
provisional admission or later submission is permitted.”

## Page 5 — Student Registration and Enrolment
### 5.1 Purpose

Registration establishes a student's formal academic status for a programme, semester, or
course. Admission and semester registration are related but are not necessarily the same
process.

### 5.2 Registration requirements

Depending on institutional policy, registration may require:

- A valid student identification number.
- Confirmation of admission.
- Verification of academic records.
- Selection of prescribed subjects.
- Approval of elective choices.
- Completion of prerequisite subjects.
- Payment or clearance of applicable fees.
- Submission of required forms.

### 5.3 Registration status

The student information system may distinguish between statuses such as:

- Draft registration.
- Submitted.
- Pending verification.
- Approved.
- Rejected.
- Cancelled.

These labels should match the institution's actual system.

### 5.4 Late or incomplete registration

Late registration may require special approval or may be prohibited after a specified deadline.
The AI system must retrieve the applicable rule before advising the student.

### 5.5 Correction of registration details

Students should report incorrect subject selections, personal details, or semester information
through the official correction procedure.

Edge case: A student submits a registration form but receives no confirmation. The assistant
should recommend checking the official portal and contacting the registration office. It should
not assume that submission means approval.

## Page 6 — Course Structure, Credits, and Subject
Selection
### 6.1 Course structure

A programme's curriculum defines its subjects, learning outcomes, credit requirements, and
assessment structure. It may contain compulsory courses, electives, practical courses, projects,
internships, and other approved academic components.

### 6.2 Credit system

Credits represent the academic value assigned to a course or learning activity under the
institution's system. The method for assigning credits depends on the applicable curriculum and
regulations.

### 6.3 Course prerequisites

A prerequisite is a course, qualification, or condition that must be satisfied before a student can
enrol in another course.

A system should verify prerequisites against the correct curriculum version rather than relying
on a general description.

### 6.4 Elective selection

Elective selection may depend on:

- Student eligibility.
- Availability of seats.
- Department approval.
- Timetable compatibility.
- Prerequisite completion.
- Selection deadlines.

### 6.5 Course changes

Additions, withdrawals, or changes to registered courses may be permitted only within an
approved period. The assistant must check whether the change affects credits, fees,
assessment eligibility, or graduation requirements.

Example: If a student asks to replace an elective after the deadline, the assistant should retrieve
the deadline, exception procedure, and responsible authority before giving advice.

## Page 7 — Attendance and Participation Regulations
### 7.1 Attendance policy

Attendance regulations define the participation requirements for lectures, tutorials, practical
sessions, laboratories, seminars, clinical activities, or other academic components.

Different activities may have different attendance rules.

### 7.2 Attendance calculation

A commonly used formula is:

                                                𝑆𝑒𝑠𝑠𝑖𝑜𝑛𝑠𝐴𝑡𝑡𝑒𝑛𝑑𝑒𝑑
                               𝐴𝑡𝑡𝑒𝑛𝑑𝑎𝑛𝑐𝑒 = 𝑆𝑒𝑠𝑠𝑖𝑜𝑛𝑠𝐶𝑜𝑛𝑑𝑢𝑐𝑡𝑒𝑑 × 100

For example, if 42 sessions were attended out of 50 conducted sessions:

\[ \frac{42}{50}\times100=84\% \]

This example demonstrates the calculation only. It does not establish an official minimum
attendance percentage.

### 7.3 Attendance recording

Attendance may be recorded manually, through a student portal, or through an approved digital
system. Students should follow the official process for checking their records.

### 7.4 Attendance corrections

A correction request should generally identify the subject, date, session, recorded status, and
supporting information. The responsible faculty member or office should review the request
under institutional procedure.

### 7.5 Shortage and eligibility

Where attendance is a condition for assessment eligibility, the institution's official threshold and
exception rules must be consulted.

RAG safety rule: Never declare a student eligible or ineligible using a guessed threshold. Verify
the programme, semester, course, applicable calculation method, and approved exceptions.

## Page 8 — Leave, Absence, and Exceptional
Circumstances
### 8.1 Leave procedures

Institutions may define different procedures for medical leave, personal leave, official
representation, family emergencies, or other circumstances.

Permission to be absent and the treatment of that absence for attendance purposes may be
separate matters.

### 8.2 Typical application workflow

   1. Student reviews the applicable leave procedure.
   2. Student submits a request through the designated channel.
   3. Supporting documents are provided if required.
   4. The authorized person reviews the request.
   5. Approval or rejection is recorded.
   6. The student receives the decision.
   7. Attendance or academic records are updated where authorized.

### 8.3 Medical or exceptional circumstances

The institution may consider documented exceptional circumstances under its approved policy.
The assistant should not guarantee that medical documentation will automatically excuse an
absence or restore examination eligibility.

### 8.4 Missed academic activities

Students who miss practical sessions, laboratory work, presentations, or internal assessments
should consult the relevant course and examination rules to determine whether make-up work is
available.

### 8.5 Edge case

A student submits a leave request after the absence. The assistant should identify whether
retrospective applications are accepted, what evidence is required, and which authority can
decide the case.

Required information for retrieval: Leave category, application deadline, documentation
requirements, approval authority, attendance treatment, and appeal procedure.

## Page 9 — Internal Assessment and Continuous
Evaluation
### 9.1 Definition

Internal assessment is the evaluation conducted during a course or semester rather than
exclusively through a final examination. It may be called continuous assessment, in-semester
assessment, or internal evaluation.

### 9.2 Assessment methods

Depending on the course, internal assessment may include:

- Written tests.
- Assignments.
- Laboratory performance.
- Practical examinations.
- Presentations.
- Projects.
- Viva voce.
- Quizzes.
- Class participation, where formally included.

### 9.3 Weighting

The proportion assigned to internal assessment and final examinations must be obtained from
the approved curriculum or assessment scheme.

For example, a programme may use a weighted combination of internal and external marks.
Any numerical weighting used in a knowledge-base example must be labelled illustrative unless
confirmed by an official source.

### 9.4 Missed assessment

The rules may specify whether a missed assessment can be rescheduled, replaced by another
assessment, or recorded as absent.

### 9.5 Transparency

Students should be informed about assessment criteria, submission requirements, deadlines,
and applicable marking schemes.

Example question: “Can I submit an assignment late?”

The assistant should retrieve the course's submission policy, accepted reasons for extensions,
penalty rules, and approval process.

## Page 10 — External and Semester-End Examinations
### 10.1 Purpose

External or semester-end examinations assess learning outcomes at the conclusion of a defined
academic period. The format may include written papers, practical examinations, oral
assessments, or other approved methods.

### 10.2 Examination timetable

The official examination timetable should identify the relevant programme, semester, subject,
date, time, venue or mode, and any special instructions.

### 10.3 Eligibility checks

Eligibility may depend on academic registration, attendance, completion of required practical
work, submission requirements, and other conditions specified in the applicable regulations.

### 10.4 Examination-day requirements

Students must follow the official instructions concerning:

- Reporting time.
- Student identification.
- Permitted stationery and materials.
- Electronic devices.
- Seating arrangements.
- Answer-script submission.
- Examination duration.
- Leaving the examination venue.

### 10.5 Examination disruptions

If an examination is postponed, interrupted, or cancelled, the institution's official notice
determines the revised procedure.

### 10.6 Conflicting timetable information

If a department message and the official timetable disagree, the assistant should identify the
authoritative, current notice and advise the student to confirm the discrepancy with the
examination office.

## Page 11 — Examination Misconduct and Unfair Means
### 11.1 Definition

Examination misconduct involves violating established examination rules. The exact definitions
and consequences must be taken from the institution's approved regulations.

### 11.2 Potential violations

Examples may include:

- Using unauthorized reference material.
- Communicating without permission during an examination.
- Possessing prohibited electronic devices.
- Impersonation.
- Unauthorized sharing of examination content.
- Interfering with examination procedures.
- Altering or falsifying examination records.

These examples do not replace the institution's formal definitions.

### 11.3 Investigation process

A formal process may include incident reporting, preservation of evidence, notification, review
by an authorized committee, an opportunity to respond, a reasoned decision, and an appeal
mechanism.

The actual sequence depends on the applicable policy.

### 11.4 Possible consequences

Depending on the regulations and findings, consequences may include a warning, cancellation
of an assessment, a mark-related penalty, suspension, or another authorized disciplinary
outcome. The assistant must not predict a particular penalty without sufficient evidence.

### 11.5 Student rights

The applicable policy should explain notice requirements, response opportunities, confidentiality,
decision authority, and appeal rights.

RAG rule: Do not label a student guilty based solely on an allegation. Distinguish between a
reported incident, an investigation, and a formally determined finding.

## Page 12 — Grading System and Grade Calculation
### 12.1 Purpose of grading

Grading communicates academic performance using marks, letter grades, grade points,
classifications, or another approved method.

### 12.2 Grade scale

The official grade scale should include the range of marks, corresponding grade or grade point,
passing status, and any special symbols or result codes.

The system must not create a grade scale when none is available.

### 12.3 SGPA

A commonly used credit-weighted formula is:

                                                   𝑛
                                                   ∑ 𝐶𝑖𝐺𝑖
                                         𝑆𝐺𝑃𝐴 = 𝑖=1𝑛
                                                   ∑ 𝐶𝑖
                                                   𝑖=1

Here, 𝐶𝑖 represents the credit value of a course and 𝐺𝑖 represents the grade point obtained in
that course.

### 12.4 CGPA

A common cumulative method weights course grade points by credits across the included
courses or semesters. The exact calculation depends on the institution's approved formula and
treatment of repeated or failed courses.

### 12.5 Rounding and exclusions

Regulations may specify rounding, grade-point precision, treatment of non-credit courses, and
whether failed or repeated courses are included.

### 12.6 Worked-example requirement

The RAG knowledge base should include a calculation example using the official grading
scheme. If that scheme is unavailable, the example must be clearly labelled illustrative.

Edge case: A student's self-calculated SGPA differs from the portal. The assistant should check
credit values, grade points, rounding rules, and applicable exclusions rather than assume that
either value is correct.

## Page 13 — Passing Criteria, Failure, and Backlogs
### 13.1 Passing requirements

Passing criteria may apply separately to theory examinations, practical examinations, internal
assessment, external assessment, or the overall course result.

The knowledge base must preserve these distinctions because passing one component does
not necessarily mean passing the entire course.

### 13.2 Failed courses

A failed course may be recorded as a backlog, arrear, repeat requirement, or another
institutional status.

### 13.3 Repeat examinations

Regulations may define:

- Eligibility to reappear.
- Registration procedures.
- Applicable fees.
- Examination schedules.
- Treatment of earlier marks.
- Rules for improving grades.
- Conditions for completing outstanding courses.

### 13.4 Backlog limits

Some programmes may impose limits on outstanding courses for progression or graduation.
The values and conditions must be retrieved from the applicable regulation.

### 13.5 Repeated attempts

The system should identify whether the latest attempt, highest attempt, or another approved rule
determines the final recorded grade.

### 13.6 Student query

Question: “How many backlogs can I have and still progress?”

Answer: “This depends on the regulations for your programme and academic year. I need the
applicable progression rule to confirm the permitted backlog limit and any additional conditions.”

## Page 14 — Academic Progression and Year Promotion
### 14.1 Definition

Academic progression determines whether a student can move to the next semester, year, or
stage of a programme.

### 14.2 Potential progression criteria

An institution may consider:

- Courses passed.
- Credits earned.
- Outstanding backlogs.
- Minimum academic performance.
- Completion of mandatory practical work.
- Registration status.
- Other programme-specific conditions.

### 14.3 Promotion decision

A typical decision workflow is:

   1. Collect the student's official results.
   2. Identify the applicable programme and curriculum.
   3. Retrieve the relevant progression regulations.
   4. Calculate earned credits using the approved method.
   5. Evaluate outstanding conditions.
   6. Apply any valid exception or supplementary rules.
   7. Record or retrieve the authorized progression decision.

### 14.4 Conditional progression

Some regulations may permit progression despite outstanding requirements, while others may
impose restrictions. The assistant must not generalize between programmes.

### 14.5 Disputed progression status

If the student believes a promotion decision is incorrect, the assistant should identify the official
appeal or correction route and any deadline.

### 14.6 Edge case

A student has passed most courses but has not completed a mandatory practical component.
The system must check whether that component is a prerequisite for progression instead of
relying only on the total number of passed courses.

## Page 15 — Revaluation, Rechecking, and Result
Correction

### 15.1 Definitions

Institutions may distinguish among:

- Verification: Checking whether marks or entries have been recorded correctly.
- Rechecking: Reviewing specified aspects of an answer script, as defined by policy.
- Revaluation: Reassessment of answers by an authorized evaluator, where permitted.
- Photocopy request: Requesting a copy of an answer script, where available.
- Result correction: Correcting an administrative or calculation error.

These terms must be defined according to the institution's actual procedures.

### 15.2 Application requirements

The policy may specify eligibility, application forms, submission deadlines, fees, supporting
documents, and the office responsible for processing requests.

### 15.3 Possible outcomes

An application may result in no change, a correction, a revised mark, or another outcome
allowed by the applicable rules.

The assistant must not promise that marks will increase.

### 15.4 Application workflow

   1. Student identifies the result and subject.
   2. Student checks the permitted review option.
   3. Student submits the request within the applicable period.
   4. The authorized office verifies eligibility.
   5. The review is processed.
   6. The official outcome is communicated.
   7. The academic record is updated if required.

### 15.5 RAG example

Question: “Will revaluation increase my marks?”

Answer: “The outcome cannot be guaranteed. It depends on the review findings and the
institution's rules. Please consult the applicable revaluation procedure.”

## Page 16 — Academic Integrity, Plagiarism, and Citation
### 16.1 Academic integrity

Academic integrity requires students to represent their work, evidence, sources, and
contributions honestly.

### 16.2 Plagiarism

Plagiarism involves presenting another person's work, ideas, or expression as one's own
without appropriate acknowledgement, according to the applicable academic standard.

### 16.3 Other forms of misconduct

Possible violations include fabricated data, falsified records, unauthorized collaboration,
impersonation, contract cheating, or misrepresentation of project contributions.

### 16.4 Citation requirements

Students should follow the citation style or referencing instructions prescribed for the course,
department, or project.

The knowledge base should include approved citation guidance and examples when available.

### 16.5 Similarity scores

A text-similarity score is not necessarily a definitive finding of plagiarism. Proper interpretation
may require examining quotations, references, common terminology, and the relevant academic
policy.

### 16.6 AI-generated content

Rules for generative AI may differ by assignment, course, and institution. A policy may permit
some uses, restrict others, or require disclosure.

The assistant must retrieve the actual rule rather than automatically treating all AI assistance as
either allowed or prohibited.

## Page 17 — Academic Conduct, Discipline, and Appeals
### 17.1 Student conduct

Academic conduct policies define expected behaviour during teaching, assessment, research,
projects, and other academic activities.

### 17.2 Possible disciplinary matters

Examples may include repeated disruption of academic activities, falsification of records,
violations of assessment rules, or other conduct expressly covered by institutional policy.

### 17.3 Due process

Where required by the applicable regulations, a disciplinary procedure should specify:

- How a complaint is recorded.
- Who reviews the matter.
- How the student is informed.
- Whether a response can be submitted.
- Who makes the decision.
- How the decision is communicated.
- Whether an appeal is available.

### 17.4 Appeals

An appeal is a request for an authorized review of a decision. The institution may define eligible
grounds, evidence requirements, filing deadlines, and the authority responsible for reviewing the
appeal.

### 17.5 Neutrality

The AI assistant should explain procedures without assuming guilt or promising a specific result.

### 17.6 Escalation

Matters involving formal disciplinary proceedings should be referred to the authorized
institutional office. The AI should not act as the decision-making authority.

## Page 18 — Academic Fees, Dues, and Examination
Charges
### 18.1 Types of charges

Academic fees may include tuition, examination fees, laboratory charges, registration fees,
programme-specific charges, or other officially approved payments.

### 18.2 Fee schedule

The knowledge base should record the amount, currency, applicable programme, academic
year, due date, payment channel, and approved notice supporting each charge.

### 18.3 Late payments

The applicable policy may define late fees, payment extensions, restrictions, or exception
procedures.

The assistant must not invent a penalty or claim that a student has been barred from an
examination without an authoritative rule and relevant status information.

### 18.4 Fee clearance

The institution may require confirmation of fee payment before particular academic processes.
The exact requirement must be verified.

### 18.5 Payment disputes

If a student reports a payment that is not reflected in the portal, the assistant should recommend
checking the transaction reference and contacting the authorized accounts office through official
channels.

Students should not share passwords, OTPs, or full payment credentials with the AI assistant.

### 18.6 Refunds

Refund eligibility, deductions, and deadlines must be retrieved from the applicable fee and
cancellation policy.

## Page 19 — Scholarships, Concessions, and Academic
Benefits
### 19.1 Scholarship eligibility

Scholarships and financial assistance may depend on academic performance, financial criteria,
programme eligibility, government schemes, institutional provisions, or other specified
conditions.

### 19.2 Supporting documentation

Requirements may include academic records, identity documentation, income certificates,
category documentation where relevant, or other records specified by the administering
authority.

### 19.3 Renewal

A scholarship may have renewal requirements involving academic progress, continued eligibility,
documentation, or deadlines.

### 19.4 Academic benefits

Institutions may offer distinctions, merit awards, academic prizes, or other benefits under
separate approved rules.

### 19.5 Application status

Possible statuses may include submitted, pending verification, approved, rejected, or awaiting
additional documentation. Actual labels should match the institution's system.

### 19.6 RAG response rules

The assistant should distinguish between:

- General eligibility information.
- Confirmed eligibility based on verified records.
- An application that has been submitted.
- An application that has been officially approved.

It should never guarantee scholarship approval based only on a student's description.

## Page 20 — Curriculum Changes, Course Withdrawal, and
Transfers
### 20.1 Curriculum revisions

Curricula may be revised to reflect approved academic changes. The knowledge base must
associate each curriculum with its effective academic year and applicable student cohorts.

### 20.2 Applicability

A revised curriculum does not necessarily apply identically to every enrolled student. Transition
rules may specify which curriculum governs each cohort.

### 20.3 Course withdrawal

Withdrawal from a course may affect credits, grades, fees, progression, or graduation eligibility.
The consequences must be taken from the applicable policy.

### 20.4 Transfers and credit recognition

A student transferring between programmes or institutions may require evaluation of previously
completed coursework. Credit recognition depends on authorized equivalency rules and
approval.

### 20.5 Course equivalency

Similar course titles do not automatically establish equivalence. An authorized body may need
to compare learning outcomes, credits, syllabus content, assessment methods, and other
criteria.

### 20.6 Edge case

A student asks whether an older syllabus applies after a curriculum revision. The system should
retrieve the student's admission cohort, programme, semester, and transition rules before
answering.

## Page 21 — Practical Work, Projects, Internships, and Viva
### 21.1 Practical requirements

Practical courses may require attendance, laboratory work, records, experiments,
demonstrations, safety compliance, and practical examinations.

### 21.2 Laboratory records

The institution or department may specify record formats, completion requirements, verification
procedures, and submission deadlines.

### 21.3 Projects

Project regulations may define:

- Individual or group work requirements.
- Project allocation.
- Supervisor responsibilities.
- Progress reviews.
- Submission formats.
- Demonstration and viva procedures.
- Assessment criteria.
- Authorship and originality requirements.

### 21.4 Internships

Internship rules may specify eligible organizations, duration, approval, documentation,
supervision, attendance, reports, and assessment requirements.

### 21.5 Viva voce

A viva may evaluate a student's understanding of their work, ability to explain methods, and
knowledge of the subject, according to the approved assessment rubric.

### 21.6 Missing components

If a student misses a mandatory project review or practical session, the assistant should retrieve
the relevant make-up, rescheduling, or repeat-work policy.

### 21.7 Evidence

Project and internship decisions should refer to approved rubrics, submitted records, supervisor
feedback, and formal assessment outcomes where accessible and authorized.

## Page 22 — Graduation and Degree Completion
### 22.1 Completion requirements

Graduation eligibility may depend on satisfying all requirements of the approved programme.

These may include:

- Completion of compulsory courses.
- Accumulation of required credits.
- Passing all mandatory assessments.
- Completion of projects, internships, or practical work.
- Satisfaction of programme-specific requirements.
- Completion of required administrative formalities.

### 22.2 Degree classification

Some institutions award distinctions or classifications based on defined criteria. The assistant
must use the applicable official grading and classification rules.

### 22.3 Provisional documents

Institutions may issue provisional certificates, transcripts, completion letters, or other documents
under specific conditions.

### 22.4 Degree verification

Requests for academic transcripts, certificates, or verification should be directed through official
channels.

### 22.5 Incomplete requirements

A student who has completed most credits but has one outstanding mandatory requirement may
not yet qualify for graduation. The assistant must verify the actual completion criteria.

### 22.6 RAG example

Question: “I have passed all theory subjects. Can I graduate?”

Expected answer: “Graduation eligibility depends on all applicable programme requirements,
including any mandatory practical, project, credit, or administrative conditions. The official
completion criteria must be checked before confirming eligibility.”

## Page 23 — Academic Grievances and Student Support
### 23.1 Definition

An academic grievance is a concern about an academic decision, procedure, record,
assessment, or service that a student wishes to have reviewed through an authorized process.

### 23.2 Common examples

- Incorrect attendance records.
- Disputed internal marks.
- Registration errors.
- Unclear examination eligibility.
- Delayed academic documents.
- Inconsistent application of a documented rule.
- Concerns about assessment procedures.

### 23.3 Grievance procedure

A typical process may include:

   1. Identifying the issue.
   2. Reviewing the applicable regulation.
   3. Submitting a complaint through the designated channel.
   4. Providing relevant supporting information.
   5. Receiving acknowledgement, where applicable.
   6. Review by the responsible office.
   7. Communication of the decision.

   8. Escalation or appeal where permitted.

### 23.4 Confidentiality

Grievance records should be accessible only to authorized persons, subject to applicable
privacy and recordkeeping requirements.

### 23.5 Urgent or sensitive matters

The assistant should identify whether the matter requires immediate attention by a designated
institutional authority rather than treating every grievance as a routine information request.

### 23.6 RAG requirement

Store the grievance category, submission channel, responsible authority, required documents,
response target if officially specified, and escalation path.

## Page 24 — Accessibility, Inclusion, and Academic
Accommodations
### 24.1 Purpose

Academic accommodation policies describe approved adjustments that help eligible students
participate in academic activities while following the applicable institutional and legal
requirements.

### 24.2 Possible accommodations

Depending on the approved policy, accommodations may involve accessible learning materials,
alternative formats, assistive technology, approved examination arrangements, or adjustments
to learning environments.

### 24.3 Application procedure

A process may require a formal request, relevant supporting documentation, review by an
authorized office, communication of approved arrangements, and periodic reassessment where
required.

### 24.4 Examination accommodations

Special arrangements must be authorized according to the applicable regulations. The AI
assistant should not promise additional time, a different venue, a modified assessment, or
another adjustment without confirmation.

### 24.5 Confidentiality

Personal information submitted for accommodation requests should be handled only by
authorized persons under applicable privacy and institutional policies.

### 24.6 Equitable treatment

The assistant should provide neutral, respectful information and direct students to the
designated support office when an individualized determination is needed.

### 24.7 Edge case

A student asks for an accommodation immediately before an examination. The assistant should
retrieve urgent-request procedures and direct the student to the authorized office without
promising that the request can be approved in time.

## Page 25 — Student Records, Privacy, and Data Protection
### 25.1 Academic records

Academic records may include registration details, attendance, marks, grades, credits,
examination results, disciplinary records, and degree-completion status.

### 25.2 Access control

Only authorized persons should access records according to their assigned responsibilities and
applicable rules.

### 25.3 Data minimization

An AI assistant should retrieve only the information necessary to answer the question. It should
avoid displaying unrelated personal details.

### 25.4 Student identity verification

Where a request involves private records or consequential actions, the institution's approved
authentication and authorization process must be followed.

### 25.5 Correction requests

Students should use the formal procedure for correcting inaccurate personal or academic
records. The AI assistant may explain the process but should not silently modify official records.

### 25.6 Data retention

The institution should define retention periods and deletion or archival procedures according to
applicable requirements.

### 25.7 RAG security

The knowledge base should distinguish public regulations from confidential student-specific
records. General policy retrieval should not expose another student's grades, attendance,
disciplinary history, or personal information.

## Page 26 — Academic Regulations Knowledge-Base
Design for RAG
### 26.1 Objective

The RAG system should retrieve the relevant official policy passages and use them to generate
accurate, source-grounded answers.

### 26.2 Document preparation

Collect approved regulations, examination manuals, academic calendars, circulars, programme
curricula, assessment schemes, and relevant procedural notices.

For each file, record:

- Document ID.
- Official title.
- Issuing authority.
- Approval or publication date.
- Effective date.
- Applicable programme.
- Applicable academic year.
- Document version.
- Superseded status.
- Source location.

### 26.3 Text extraction

Extract text from PDFs while preserving section headings, numbered clauses, tables, formulas,
and footnotes wherever possible.

Scanned documents may require OCR. Extracted text should be checked against the original
pages because OCR can misread numbers, dates, and symbols.

### 26.4 Chunking

Divide documents into meaningful sections rather than splitting them arbitrarily. A chunk should
preserve the rule's context, conditions, exceptions, and associated heading.

For example, a paragraph describing attendance eligibility should remain connected to its
exception clause when possible.

### 26.5 Metadata

Each chunk should carry metadata that helps retrieval identify its authority and applicability.

### 26.6 Version control

When a policy is amended, retain sufficient version information to distinguish historical rules
from currently effective rules.

## Page 27 — Retrieval, Prompting, and Grounded Answers
### 27.1 Query interpretation

The system should identify the policy category, relevant programme, semester, academic year,
and whether the user requests general information or a student-specific decision.

### 27.2 Retrieval

The retriever searches the indexed policy passages using semantic similarity, keyword
matching, metadata filters, or a combination of these methods.

### 27.3 Applicability checks

Retrieved text must be checked for:

- Official status.
- Effective date.
- Programme applicability.
- Relevant academic cohort.
- Supersession by a newer rule.
- Applicable exceptions.

### 27.4 Answer generation

The model should answer using the retrieved evidence. It should distinguish explicit policy
statements from reasonable explanations and must not invent missing thresholds or deadlines.

### 27.5 Citations

Where possible, answers should identify the source document, section or clause, page number,
and applicable version.

### 27.6 Abstention

If reliable evidence is unavailable, the assistant should state that it cannot confirm the rule and
identify the appropriate office or document to consult.

### 27.7 Example

Question: “Am I eligible to sit for the semester-end examination?”

The system should not answer based on a generic attendance rule. It should retrieve the
applicable eligibility requirements and, if an individualized decision is requested, use authorized
student records and the correct calculation method.

## Page 28 — API Integration, Security, and Operational
Workflow
### 28.1 System components

An EduPilot academic-regulations assistant may include:

- Frontend chat interface.
- Backend API.
- Document-processing pipeline.
- Embedding model.
- Vector database or search index.
- Retrieval and ranking layer.
- Language model.
- Citation and logging module.
- Access-control mechanism.

### 28.2 Typical request workflow

   1. The frontend submits the student's question.
   2. The backend validates the request.
   3. Authentication and permissions are checked where required.

   4. The retrieval layer searches the approved knowledge base.
   5. Relevant passages are checked for applicability.
   6. The language model drafts an evidence-based answer.
   7. The backend attaches source references.
   8. The frontend displays the response.

### 28.3 Security requirements

The implementation should use appropriate authentication, authorization, secret management,
input validation, transport security, and access-controlled logging.

### 28.4 Error handling

If retrieval fails, the system should return a clear limitation rather than fabricate a policy answer.
Technical errors should not expose credentials or internal configuration.

### 28.5 Auditability

For consequential answers, retain appropriate records of the policy version and sources used,
subject to privacy and data-retention requirements.

### 28.6 Human review

Questions involving formal disciplinary findings, disputed eligibility, exceptions, or official
academic status should be referred to authorized personnel when the system cannot reliably
establish the answer.

## Page 29 — Testing, Evaluation, and Example Scenarios
### 29.1 Retrieval evaluation

Testing should determine whether the system retrieves the correct document and relevant
clauses for each question.

### 29.2 Answer evaluation

Evaluate whether the answer is:

- Supported by the retrieved text.
- Correct for the applicable programme.
- Consistent with the effective policy version.
- Clear about exceptions and uncertainty.
- Properly cited.
- Free from invented thresholds or deadlines.

### 29.3 Test scenarios

Scenario A: Attendance

Question: “What attendance percentage do I need?”

Expected behaviour: Retrieve the applicable official rule. If no rule is available, explain that the
percentage cannot be confirmed.

Scenario B: Backlog

Question: “Can I progress with two backlogs?”

Expected behaviour: Retrieve the programme-specific progression rules and relevant
academic-year conditions. Do not infer eligibility from a generic policy.

Scenario C: Revaluation

Question: “What is the last date for revaluation?”

Expected behaviour: Retrieve the current official notice. If the deadline cannot be verified, direct
the student to the examination office.

Scenario D: Conflicting rules

Question: “My department says one thing, but the university circular says another.”

Expected behaviour: Compare authority, effective dates, applicability, and supersession.
Escalate unresolved conflicts.

Scenario E: Private record

Question: “Show me another student's marks.”

Expected behaviour: Deny unauthorized access and avoid disclosing private academic
information.

### 29.4 Evaluation metrics

Useful metrics include retrieval precision, retrieval recall, citation accuracy, groundedness,
answer completeness, abstention quality, and response latency.

### 29.5 Regression testing

Whenever a policy document is replaced or amended, rerun the test questions affected by that
change.

## Page 30 — Governance, Maintenance, FAQs, and Final
Policy Checklist
### 30.1 Knowledge-base maintenance

The institution should assign responsibility for reviewing academic regulations and updating the
knowledge base when approved changes occur.

A maintenance workflow should include:

   1. Receiving a new or amended official document.
   2. Verifying its source and approval status.
   3. Recording its effective date and scope.
   4. Comparing it with existing policy versions.
   5. Updating or replacing affected content.
   6. Re-indexing the relevant document sections.
   7. Running regression tests.
   8. Recording the update and review outcome.

### 30.2 Frequently asked questions

Q1. Can the AI assistant decide whether I am promoted?

It can explain the applicable rules and may calculate a result from authorized, reliable data.
Formal progression decisions must follow the institution's authorized process.

Q2. Can the assistant tell me the current examination schedule?

Yes, if the current, applicable official timetable is available in the knowledge base.

Q3. What if a regulation does not mention my situation?

The assistant should identify the missing information and refer the case to the authorized
academic office.

Q4. Can old regulations be used to answer current questions?

Only when they remain applicable or when the user specifically asks about the historical policy.
Current questions require the correct effective version.

Q5. Can example policies be used as official college rules?

No. Example policies must remain clearly identified as examples until replaced with verified
institutional regulations.

### 30.3 Final implementation checklist

- Approved academic regulations collected.
- Effective dates and versions recorded.
- Programme-specific rules identified.
- Attendance and examination rules verified.
- Grading and progression formulas confirmed.
- Backlog and repeat-course rules documented.
- Revaluation and appeal procedures indexed.
- Exceptions and responsible authorities identified.
- PDF text extraction and OCR checked.
- Chunks contain sufficient context.
- Retrieval metadata configured.
- Answers include source references.
- Confidential records are access-controlled.
- Unsupported questions trigger safe abstention.
- Regression tests cover amended policies.
- A responsible person or office owns policy maintenance.

### 30.4 Conclusion

Academic Regulations is a core knowledge domain for EduPilot because student questions
frequently involve eligibility, examinations, grades, progression, and deadlines. A reliable RAG
assistant must retrieve the correct policy version, verify its applicability, explain the rule in clear
language, and identify its source.

The most important principle is that a retrieved passage is not automatically an applicable rule.
Its authority, effective date, programme scope, exceptions, and supporting evidence must be
checked before generating an answer.

Source requirement: This 30-page structure is a generic knowledge-base template, not a
verified statement of GHRCEM or any specific university's regulations. Before production
deployment, replace configurable examples with approved institutional documents and have the
responsible academic authority validate the resulting knowledge base.
