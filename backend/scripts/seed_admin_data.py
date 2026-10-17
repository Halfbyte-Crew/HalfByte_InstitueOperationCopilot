"""
Seed admin dashboard operational data: class schedules, staff members, and approval requests.
Idempotent script — avoids duplicate records if already present.
"""
import asyncio
from datetime import date, datetime, timezone
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.institute import (
    ApprovalRequest,
    Batch,
    ClassSchedule,
    ClassScheduleStatus,
    StaffMember,
    Trainer,
)


async def seed():
    async with AsyncSessionLocal() as session:
        # 1. Seed Staff Members
        staff_data = [
            {
                "name": "Institute Administrator",
                "email": "admin@edupilot.io",
                "role": "admin",
                "department": "Executive Administration",
                "phone": "+91 98765 43210",
                "is_active": True,
            },
            {
                "name": "Institute Director",
                "email": "owner@edupilot.io",
                "role": "admin",
                "department": "Office of the Director",
                "phone": "+91 98765 43211",
                "is_active": True,
            },
            {
                "name": "Priya Sharma",
                "email": "counselor@edupilot.io",
                "role": "counselor",
                "department": "Admissions & Counseling",
                "phone": "+91 98765 43212",
                "is_active": True,
            },
            {
                "name": "Ravi Nair",
                "email": "coordinator@edupilot.io",
                "role": "coordinator",
                "department": "Academic Operations",
                "phone": "+91 98765 43213",
                "is_active": True,
            },
            {
                "name": "Dr. Sarah Jenkins",
                "email": "sarah.j@edupilot.io",
                "role": "trainer",
                "department": "Computer Science Faculty",
                "phone": "+91 98765 43214",
                "is_active": True,
            },
            {
                "name": "Prof. David Miller",
                "email": "david.m@edupilot.io",
                "role": "trainer",
                "department": "AI & Data Science Faculty",
                "phone": "+91 98765 43215",
                "is_active": True,
            },
            {
                "name": "Elena Rostova",
                "email": "elena.r@edupilot.io",
                "role": "trainer",
                "department": "Cloud & Systems Faculty",
                "phone": "+91 98765 43216",
                "is_active": True,
            },
            {
                "name": "Finance Manager",
                "email": "finance@edupilot.io",
                "role": "finance",
                "department": "Finance & Accounts",
                "phone": "+91 98765 43217",
                "is_active": True,
            },
            {
                "name": "Kavita Rao",
                "email": "kavita.r@edupilot.io",
                "role": "coordinator",
                "department": "Student Affairs",
                "phone": "+91 98765 43218",
                "is_active": True,
            },
        ]

        from app.core.security import get_password_hash
        default_pwd_hash = get_password_hash("admin123")

        for s in staff_data:
            existing = (
                await session.execute(select(StaffMember).where(StaffMember.email == s["email"]))
            ).scalar_one_or_none()
            if not existing:
                s_copy = dict(s)
                s_copy["password_hash"] = default_pwd_hash
                session.add(StaffMember(**s_copy))
            elif not existing.password_hash:
                existing.password_hash = default_pwd_hash

        await session.commit()
        print("Staff members seeded.")

        # 2. Seed Class Schedules
        batches = (await session.execute(select(Batch))).scalars().all()
        batch_map = {b.code: b for b in batches}
        trainers = (await session.execute(select(Trainer))).scalars().all()
        trainer_map = {t.email: t for t in trainers}

        fsw = batch_map.get("FSW-2026-A")
        dsai = batch_map.get("DSAI-2026-B")
        cdo = batch_map.get("CDO-2026-C")
        sarah = trainer_map.get("sarah.j@edupilot.io")
        david = trainer_map.get("david.m@edupilot.io")
        elena = trainer_map.get("elena.r@edupilot.io")

        if fsw and dsai and cdo:
            schedules_data = [
                {
                    "batch_id": fsw.id,
                    "trainer_id": sarah.id if sarah else None,
                    "title": "Advanced React: State Machines & Hooks",
                    "scheduled_date": date(2026, 10, 19),
                    "start_time": "09:00",
                    "end_time": "10:30",
                    "classroom": "Lab 101",
                    "meeting_link": "https://meet.edupilot.io/fsw-2026-a",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                {
                    "batch_id": dsai.id,
                    "trainer_id": david.id if david else None,
                    "title": "PyTorch Deep Learning Fundamentals",
                    "scheduled_date": date(2026, 10, 19),
                    "start_time": "11:00",
                    "end_time": "12:30",
                    "classroom": "Lab 204",
                    "meeting_link": "https://meet.edupilot.io/dsai-2026-b",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                {
                    "batch_id": cdo.id,
                    "trainer_id": elena.id if elena else None,
                    "title": "Kubernetes Cluster Ingress & Service Meshes",
                    "scheduled_date": date(2026, 10, 19),
                    "start_time": "14:00",
                    "end_time": "15:30",
                    "classroom": "Seminar Hall B",
                    "meeting_link": "https://meet.edupilot.io/cdo-2026-c",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                # Conflict 1: Trainer Overlap on 2026-10-20 (Dr. Sarah Jenkins double-booked 10:00-10:30 overlap)
                {
                    "batch_id": fsw.id,
                    "trainer_id": sarah.id if sarah else None,
                    "title": "FastAPI Async Architecture",
                    "scheduled_date": date(2026, 10, 20),
                    "start_time": "09:00",
                    "end_time": "10:30",
                    "classroom": "Lab 101",
                    "meeting_link": "https://meet.edupilot.io/fsw-fastapi",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                {
                    "batch_id": dsai.id,
                    "trainer_id": sarah.id if sarah else None,  # Sarah double booked!
                    "title": "Guest Masterclass: API Integration with ML Models",
                    "scheduled_date": date(2026, 10, 20),
                    "start_time": "10:00",  # Overlaps with 09:00-10:30
                    "end_time": "11:30",
                    "classroom": "Room 302",
                    "meeting_link": "https://meet.edupilot.io/dsai-guest",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                # Conflict 2: Classroom Double Booking on 2026-10-21 ("Lab 101" booked simultaneously)
                {
                    "batch_id": cdo.id,
                    "trainer_id": elena.id if elena else None,
                    "title": "Terraform Infrastructure as Code Lab",
                    "scheduled_date": date(2026, 10, 21),
                    "start_time": "11:00",
                    "end_time": "12:30",
                    "classroom": "Lab 101",  # Same classroom!
                    "meeting_link": "https://meet.edupilot.io/cdo-terraform",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                {
                    "batch_id": fsw.id,
                    "trainer_id": david.id if david else None,
                    "title": "Database Optimization & Indexing Workshop",
                    "scheduled_date": date(2026, 10, 21),
                    "start_time": "11:30",  # Overlaps with 11:00-12:30 in Lab 101!
                    "end_time": "13:00",
                    "classroom": "Lab 101",  # Same classroom!
                    "meeting_link": "https://meet.edupilot.io/fsw-db-lab",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
                # Alert: Missing Trainer Assignment
                {
                    "batch_id": cdo.id,
                    "trainer_id": None,  # No trainer assigned!
                    "title": "AWS IAM Security Policies Hands-On",
                    "scheduled_date": date(2026, 10, 22),
                    "start_time": "10:00",
                    "end_time": "11:30",
                    "classroom": "Cloud Lab 3",
                    "meeting_link": "https://meet.edupilot.io/cdo-aws-iam",
                    "status": ClassScheduleStatus.SCHEDULED,
                },
            ]

            # Clear previous schedules if any to keep clean state
            existing_schedules = (await session.execute(select(ClassSchedule))).scalars().all()
            if not existing_schedules:
                for sc in schedules_data:
                    session.add(ClassSchedule(**sc))
                await session.commit()
                print("Class schedules seeded.")
            else:
                print(f"Existing {len(existing_schedules)} schedules found.")

        # 3. Seed Approval Requests
        existing_approvals = (await session.execute(select(ApprovalRequest))).scalars().all()
        if not existing_approvals:
            approvals_data = [
                {
                    "request_type": "BATCH_TRANSFER",
                    "title": "Batch Transfer Request: Rohan Verma",
                    "description": "Student requests transfer from FSW-2026-A to DSAI-2026-B due to conflicting internship schedule.",
                    "requester_name": "Priya Sharma",
                    "requester_email": "counselor@edupilot.io",
                    "requester_role": "counselor",
                    "status": "Pending",
                    "payload": {
                        "student_name": "Rohan Verma",
                        "current_batch": "FSW-2026-A",
                        "target_batch": "DSAI-2026-B",
                        "reason": "Work internship conflict",
                    },
                },
                {
                    "request_type": "FEE_CONCESSION",
                    "title": "Merit Fee Concession (25%): Ananya Patel",
                    "description": "Requesting approved merit-based scholarship reduction of ₹12,500 on second installment based on entrance test rank #3.",
                    "requester_name": "Finance Manager",
                    "requester_email": "finance@edupilot.io",
                    "requester_role": "finance",
                    "status": "Pending",
                    "payload": {
                        "student_name": "Ananya Patel",
                        "concession_amount": 12500,
                        "original_amount": 50000,
                        "waiver_percent": 25,
                    },
                },
                {
                    "request_type": "LEAVE_REQUEST",
                    "title": "Faculty Medical Leave: Dr. Sarah Jenkins",
                    "description": "Requesting 2-day leave on 2026-10-24 and 2026-10-25. Guest trainer substitution proposed for scheduled cohorts.",
                    "requester_name": "Dr. Sarah Jenkins",
                    "requester_email": "sarah.j@edupilot.io",
                    "requester_role": "trainer",
                    "status": "Pending",
                    "payload": {
                        "days": 2,
                        "dates": ["2026-10-24", "2026-10-25"],
                        "substitute_trainer": "Prof. David Miller",
                    },
                },
                {
                    "request_type": "SCHEDULE_CHANGE",
                    "title": "Reschedule DSAI-2026-B Session #14",
                    "description": "Move session from Saturday 2026-10-18 to Monday 2026-10-20 to accommodate campus symposium.",
                    "requester_name": "Ravi Nair",
                    "requester_email": "coordinator@edupilot.io",
                    "requester_role": "coordinator",
                    "status": "Approved",
                    "reviewed_by": "admin@edupilot.io",
                    "reviewed_at": datetime(2026, 10, 16, 14, 30, tzinfo=timezone.utc),
                    "payload": {
                        "batch_code": "DSAI-2026-B",
                        "original_date": "2026-10-18",
                        "new_date": "2026-10-20",
                    },
                },
            ]

            for a in approvals_data:
                session.add(ApprovalRequest(**a))
            await session.commit()
            print("Approval requests seeded.")
        else:
            print(f"Existing {len(existing_approvals)} approvals found.")


if __name__ == "__main__":
    asyncio.run(seed())
