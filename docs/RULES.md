# Engineering & Architecture Rules - EduPilot

## 1. General Principles
1. **Single Source of Truth**: All domain entities and state mutations must flow through backend domain services and repositories.
2. **Feature Modularity**:
   - Organize frontend by feature domain (`features/{feature}/pages`, `features/{feature}/components`, `features/{feature}/{feature}Api.js`).
   - Organize backend by domain modules (`modules/{module}/`).
   - Shared components in `components/ui` and `components/common` must never import from `features/`.

## 2. Frontend Rules
1. **Routing & Guards**: Always protect administrative routes using `ProtectedLayout` and verify authorization.
2. **Centralized HTTP**: Use the centralized `apiClient.js` for all fetch requests. Handle tokens, header injection, and global error handling uniformly.
3. **Graceful States**: Every data-driven screen must handle four states explicitly:
   - `Loading` (skeleton / spinner)
   - `Success` (data render)
   - `Empty` (friendly empty state)
   - `Error` (actionable error message)
4. **Tailwind Consistency**: Avoid inline custom style tags or non-standard CSS properties. Use design system tokens.

## 3. Backend Rules
1. **Explicit Schema Validation**: Never accept or return raw SQLAlchemy model instances directly from endpoints; always parse through Pydantic schemas.
2. **Secure Defaults**: Endpoints default to requiring authentication unless explicitly decorated as public (e.g. login).
3. **Audit Everything**: Any state change (CREATE, UPDATE, DELETE) or approval execution must write an audit record.
4. **Human-in-the-Loop for Copilot**: Actions suggested by the AI Copilot that mutate system data must be framed as draft approval proposals and routed through the `approvals` module.
