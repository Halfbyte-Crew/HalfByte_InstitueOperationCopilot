# Development Plan

## Suggested Modules
- auth-rbac
- student-batch-management
- fee-emi-management
- attendance-recordings
- copilot-query-engine
- action-approval-audit
- timetable-solver
- optional-risk-and-reconciliation

## Engineering Guidelines
- Build API-first with strong input validation.
- Enforce role checks at service and query layers.
- Use migrations for schema evolution.
- Keep copilot query templates/schema mapping versioned.
- Add tests for authorization, query safety, and scheduling constraints.
