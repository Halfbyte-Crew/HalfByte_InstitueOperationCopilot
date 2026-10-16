# Software Requirements Specification (SRS)

## Functional Requirements
- FR1: Manage master data for students, trainers, courses, batches, rooms, schedules.
- FR2: Record fee plans, instalments/EMIs, due dates, and payment statuses.
- FR3: Capture hybrid attendance from classroom check-ins and online join logs.
- FR4: Store and retrieve class recordings.
- FR5: Provide natural-language query interface for staff.
- FR6: Translate user questions into safe read-only queries and show executed query.
- FR7: Restrict responses by role (owner/counselor/trainer/accounts).
- FR8: For data mutations or messaging, show action preview and require human approval.
- FR9: Log every approved/rejected action with actor, timestamp, payload, and outcome.
- FR10: Generate conflict-free weekly timetable using constraints.
- FR11: Re-plan timetable quickly on trainer unavailability/new batch addition with rationale.
- FR12 (Optional): Reconcile UPI/bank payments with instalments.
- FR13 (Optional): Generate completion certificates.
- FR14 (Optional): Flag at-risk students with explainable factors.

## Non-Functional Requirements
- NFR1: Security-first RBAC and data minimization.
- NFR2: Explainability for AI answers and schedule changes.
- NFR3: Availability suitable for daily institute operations.
- NFR4: Auditability of all actions.
- NFR5: Performance for near-real-time timetable re-planning.

## Constraints
- All AI data-changing actions must remain human-in-the-loop.
- Trainers must never access fee details, regardless of prompt phrasing.
