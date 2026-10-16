# Security Requirements

## Access Control
- Enforce RBAC for owner, counselor, trainer, accounts.
- Deny fee/EMI data for trainer role at backend, not UI-only.

## Copilot Safety
- Allow read-only query execution for informational prompts.
- Use query allowlists/validators to block unsafe operations.
- Show executed query for transparency and operator verification.

## Action Safety
- Require human approval before any state-changing operation or message send.
- Log requester, approver, payload preview, final outcome.

## Data Protection
- Encrypt data in transit and at rest.
- Minimize sensitive data in logs.
- Maintain tamper-evident audit records.
