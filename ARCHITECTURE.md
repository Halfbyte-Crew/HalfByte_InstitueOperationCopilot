# Architecture Overview

## High-Level Components
1. **Web App / Admin Portal**
   - Role-based UI for operations and approvals.
2. **API Layer**
   - Business logic, validation, authorization.
3. **Operational Database**
   - Students, batches, courses, trainers, fees, attendance, recordings, schedules.
4. **Copilot Orchestrator**
   - Intent parsing, policy checks, query generation, response formatting.
5. **Query Safety Layer**
   - Read-only SQL guardrails, schema allowlist, query preview.
6. **Action Approval Engine**
   - Previews write operations/messages, routes approvals, executes only after approval.
7. **Scheduler Engine**
   - Constraint solver for weekly timetable generation and re-planning.
8. **Audit Log Service**
   - Immutable logs for prompts, queries, approvals, and actions.

## Data & Control Flow
- User question -> Copilot -> policy check -> read-only query generation -> query execution -> answer + query shown.
- Action request -> preview -> human approve/reject -> execute/cancel -> audit log.
- Schedule event (new batch/unavailable trainer) -> solver -> revised plan + explanation -> publish after approval rule.
