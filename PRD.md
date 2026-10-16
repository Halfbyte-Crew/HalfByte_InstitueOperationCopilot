# Product Requirements Document (PRD)

## Product Name
Institute Operations Copilot

## Problem
Institute operations are fragmented across spreadsheets, chats, and memory, causing delayed insights, scheduling conflicts, payment follow-up gaps, and role-based data leakage risks.

## Goals
- Centralize operations for students, batches, courses, trainers, attendance, fees/EMIs, and recordings.
- Provide an AI operations copilot for natural-language, verifiable operational queries.
- Ensure safe workflows for high-impact actions via human approval and complete audit logs.
- Enforce strict role-based data visibility.
- Generate and re-plan clash-free weekly timetables with explanations.

## Primary Users
- Owners
- Counselors
- Trainers
- Accounts staff

## Core Features
1. Entity management: students, courses, batches, trainers, fees/EMIs, attendance, recordings.
2. Role-based access control with least privilege.
3. Copilot query interface with:
   - Plain-language input
   - Read-only query translation
   - Query preview for verification
4. Action guardrails:
   - Preview for write operations and outbound messages
   - Human approval required
   - Immutable action logs
5. Timetable optimization and rapid re-planning with explanations.

## Optional Features
- UPI/bank payment reconciliation against instalments
- Completion certificate generation
- Dropout risk flags with reason codes (attendance, assignments, payments)

## Success Metrics
- Reduced missed EMI follow-up and absentee intervention latency.
- Zero unauthorized fee-data exposure for trainer role.
- Timetable re-plan turnaround in seconds.
- High operator trust via transparent query/action previews.
