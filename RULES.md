# Business and Copilot Rules

1. Trainer role cannot access fee/EMI/payment details.
2. Copilot must execute only safe read-only queries for informational requests.
3. Every AI answer must include the executed query text.
4. Any write action or outbound communication requires human approval.
5. Every approval/rejection/execution event must be audit logged.
6. Timetable generation must satisfy trainer availability, room capacity, batch timings, and online seat limits.
7. Re-plans must explain why each schedule change occurred.
