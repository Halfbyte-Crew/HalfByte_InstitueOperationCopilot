"""
Seed Trainer Dashboard operational data:
- Ensures Prof. Anita Desai (trainer@edupilot.io) exists and has assigned batches.
- Seeds today's and upcoming class schedules with rooms/links.
- Seeds student enrollments, attendance history, and sample academic observations.
- Seeds diverse student account states (active, pending_activation, not_created).
Idempotent script — safe to run multiple times.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import hashlib
import os
import sys
import uuid
import zoneinfo

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, or_
from app.core.config import settings
from app.core.security import get_password_hash
from app.database.session import AsyncSessionLocal
from app.models.institute import (
    AcademicObservation,
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    BatchEnrollment,
    BatchStatus,
    ClassSchedule,
    ClassScheduleStatus,
    Course,
    EnrollmentStatus,
    Student,
    StudentAccount,
    StudentStatus,
    Trainer,
)


def get_today() -> date:
    try:
        tz = zoneinfo.ZoneInfo(getattr(settings, "INSTITUTE_TIMEZONE", "Asia/Kolkata"))
        return datetime.now(tz).date()
    except Exception:
        return date.today()


async def seed():
    today = get_today()
    print(f"Starting Trainer Data Seed for today: {today}...")

    async with AsyncSessionLocal() as session:
        # 1. Ensure Trainer Prof. Anita Desai exists
        stmt = select(Trainer).where(
            or_(
                Trainer.email == "trainer@edupilot.io",
                Trainer.name == "Prof. Anita Desai",
            )
        )
        trainer = (await session.execute(stmt)).scalar_one_or_none()
        if not trainer:
            trainer = Trainer(
                name="Prof. Anita Desai",
                email="trainer@edupilot.io",
                phone="+91 98765 43220",
                specialization="Full-Stack Systems & Distributed Architectures",
                bio="Distinguished Senior Faculty leading modern Web Architectures and Applied AI engineering cohorts.",
            )
            session.add(trainer)
            await session.flush()
            print(f"Created Trainer: {trainer.name} ({trainer.email})")
        else:
            print(f"Found Trainer: {trainer.name} ({trainer.email})")

        # 2. Ensure Courses exist
        courses = (await session.execute(select(Course))).scalars().all()
        course_map = {c.code: c for c in courses}

        fsw_course = course_map.get("FSW-101")
        dsai_course = course_map.get("DSAI-201")

        if not fsw_course:
            fsw_course = Course(
                code="FSW-101",
                title="Full-Stack Web Development",
                duration_weeks=16,
                base_fee=120000.00,
                description="Comprehensive React, Python, and cloud engineering.",
            )
            session.add(fsw_course)
            await session.flush()

        if not dsai_course:
            dsai_course = Course(
                code="DSAI-201",
                title="Data Science & Applied AI",
                duration_weeks=20,
                base_fee=150000.00,
                description="Practical machine learning, neural networks, and LLM systems.",
            )
            session.add(dsai_course)
            await session.flush()

        # 3. Ensure Batches assigned to this trainer
        batch_fsw = (
            await session.execute(select(Batch).where(Batch.code == "FSW-2026-A"))
        ).scalar_one_or_none()

        if not batch_fsw:
            batch_fsw = Batch(
                code="FSW-2026-A",
                course_id=fsw_course.id,
                trainer_id=trainer.id,
                start_date=today - timedelta(days=30),
                end_date=today + timedelta(days=90),
                capacity=35,
                status=BatchStatus.ACTIVE,
            )
            session.add(batch_fsw)
            await session.flush()
        else:
            # Reassign to trainer if unassigned
            batch_fsw.trainer_id = trainer.id
            await session.flush()

        batch_ai = (
            await session.execute(select(Batch).where(Batch.code == "AI-2026-T1"))
        ).scalar_one_or_none()

        if not batch_ai:
            batch_ai = Batch(
                code="AI-2026-T1",
                course_id=dsai_course.id,
                trainer_id=trainer.id,
                start_date=today - timedelta(days=15),
                end_date=today + timedelta(days=105),
                capacity=30,
                status=BatchStatus.ACTIVE,
            )
            session.add(batch_ai)
            await session.flush()

        # 4. Ensure Students enrolled in these batches
        student_data = [
            ("Aarav Sharma", "aarav.s@example.com", "+91 98111 22331", batch_fsw),
            ("Diya Patel", "diya.p@example.com", "+91 98111 22332", batch_fsw),
            ("Rohan Gupta", "rohan.g@example.com", "+91 98111 22333", batch_fsw),
            ("Ananya Verma", "ananya.v@example.com", "+91 98111 22334", batch_fsw),
            ("Kabir Singh", "kabir.s@example.com", "+91 98111 22335", batch_ai),
            ("Meera Nair", "meera.n@example.com", "+91 98111 22336", batch_ai),
            ("Siddharth Rao", "siddharth.r@example.com", "+91 98111 22337", batch_ai),
        ]

        enrolled_students = []
        for name, email, phone, target_batch in student_data:
            stu = (
                await session.execute(select(Student).where(Student.email == email))
            ).scalar_one_or_none()

            if not stu:
                stu = Student(
                    name=name,
                    email=email,
                    phone=phone,
                    status=StudentStatus.ACTIVE,
                )
                session.add(stu)
                await session.flush()

            # Ensure enrollment
            enr = (
                await session.execute(
                    select(BatchEnrollment).where(
                        BatchEnrollment.student_id == stu.id,
                        BatchEnrollment.batch_id == target_batch.id,
                    )
                )
            ).scalar_one_or_none()

            if not enr:
                enr = BatchEnrollment(
                    student_id=stu.id,
                    batch_id=target_batch.id,
                    enrolled_on=target_batch.start_date or (today - timedelta(days=20)),
                    status=EnrollmentStatus.IN_PROGRESS,
                )
                session.add(enr)
                await session.flush()

            enrolled_students.append((stu, target_batch))

        # 5. Seed Class Schedules (Today, Upcoming, and Past)
        schedules_to_seed = [
            # Today's classes
            {
                "batch_id": batch_fsw.id,
                "trainer_id": trainer.id,
                "title": "Module 4: Advanced REST API Design & Asynchronous Processing",
                "scheduled_date": today,
                "start_time": "10:00",
                "end_time": "12:00",
                "classroom": "Lab B-204",
                "meeting_link": None,
                "status": ClassScheduleStatus.SCHEDULED,
            },
            {
                "batch_id": batch_ai.id,
                "trainer_id": trainer.id,
                "title": "Applied NLP: Transformer Attention Mechanisms & Tokenization",
                "scheduled_date": today,
                "start_time": "14:30",
                "end_time": "16:30",
                "classroom": "Seminar Hall 1",
                "meeting_link": "https://meet.google.com/edp-nlp-live",
                "status": ClassScheduleStatus.SCHEDULED,
            },
            # Upcoming classes
            {
                "batch_id": batch_fsw.id,
                "trainer_id": trainer.id,
                "title": "Module 5: State Management & Optimistic Updates in React",
                "scheduled_date": today + timedelta(days=2),
                "start_time": "10:00",
                "end_time": "12:00",
                "classroom": "Lab B-204",
                "meeting_link": None,
                "status": ClassScheduleStatus.SCHEDULED,
            },
            {
                "batch_id": batch_ai.id,
                "trainer_id": trainer.id,
                "title": "Vector Databases & Dense Retrieval Pipelines with pgvector",
                "scheduled_date": today + timedelta(days=3),
                "start_time": "14:30",
                "end_time": "16:30",
                "classroom": "Virtual Lab",
                "meeting_link": "https://meet.google.com/edp-rag-live",
                "status": ClassScheduleStatus.SCHEDULED,
            },
            {
                "batch_id": batch_fsw.id,
                "trainer_id": trainer.id,
                "title": "Module 6: CI/CD Pipeline Automation & Production Dockerization",
                "scheduled_date": today + timedelta(days=5),
                "start_time": "11:00",
                "end_time": "13:00",
                "classroom": "Lab B-204",
                "meeting_link": None,
                "status": ClassScheduleStatus.SCHEDULED,
            },
            # Past session
            {
                "batch_id": batch_fsw.id,
                "trainer_id": trainer.id,
                "title": "Module 3: Database Schema Migrations & SQLAlchemy ORM",
                "scheduled_date": today - timedelta(days=3),
                "start_time": "10:00",
                "end_time": "12:00",
                "classroom": "Lab B-204",
                "meeting_link": None,
                "status": ClassScheduleStatus.COMPLETED,
            },
        ]

        for s in schedules_to_seed:
            existing_s = (
                await session.execute(
                    select(ClassSchedule).where(
                        ClassSchedule.batch_id == s["batch_id"],
                        ClassSchedule.scheduled_date == s["scheduled_date"],
                        ClassSchedule.start_time == s["start_time"],
                    )
                )
            ).scalar_one_or_none()

            if not existing_s:
                session.add(ClassSchedule(**s))

        # 6. Seed Attendance History for Past Session
        past_date = today - timedelta(days=3)
        for stu, bat in enrolled_students:
            if bat.id == batch_fsw.id:
                existing_att = (
                    await session.execute(
                        select(AttendanceRecord).where(
                            AttendanceRecord.student_id == stu.id,
                            AttendanceRecord.batch_id == bat.id,
                            AttendanceRecord.session_date == past_date,
                        )
                    )
                ).scalar_one_or_none()

                if not existing_att:
                    # Give Aarav and Diya Present, Rohan Late, Ananya Absent
                    if "Aarav" in stu.name or "Diya" in stu.name:
                        att_status = AttendanceStatus.PRESENT
                        remarks = "Active participation in coding sprint."
                    elif "Rohan" in stu.name:
                        att_status = AttendanceStatus.LATE
                        remarks = "Joined 15 minutes late due to transit."
                    else:
                        att_status = AttendanceStatus.ABSENT
                        remarks = "Medical absence reported."

                    att_rec = AttendanceRecord(
                        student_id=stu.id,
                        batch_id=bat.id,
                        session_date=past_date,
                        status=att_status,
                        remarks=remarks,
                    )
                    session.add(att_rec)

        # 7. Seed Student Accounts with varied states
        # Aarav -> Active (has password)
        aarav_stu = next((s for s, b in enrolled_students if "Aarav" in s.name), None)
        if aarav_stu:
            aarav_acc = (
                await session.execute(
                    select(StudentAccount).where(StudentAccount.student_id == aarav_stu.id)
                )
            ).scalar_one_or_none()
            if not aarav_acc:
                session.add(
                    StudentAccount(
                        student_id=aarav_stu.id,
                        email=aarav_stu.email,
                        password_hash=get_password_hash("Student@123"),
                        is_active=True,
                        account_status="active",
                        activated_at=datetime.now(timezone.utc) - timedelta(days=10),
                        created_by_trainer_email=trainer.email,
                    )
                )

        # Diya -> Pending Activation
        diya_stu = next((s for s, b in enrolled_students if "Diya" in s.name), None)
        if diya_stu:
            diya_acc = (
                await session.execute(
                    select(StudentAccount).where(StudentAccount.student_id == diya_stu.id)
                )
            ).scalar_one_or_none()
            if not diya_acc:
                session.add(
                    StudentAccount(
                        student_id=diya_stu.id,
                        email=diya_stu.email,
                        is_active=False,
                        account_status="pending_activation",
                        activation_token_hash=hashlib.sha256("diya-sample-token-123".encode()).hexdigest(),
                        activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=2),
                        created_by_trainer_email=trainer.email,
                    )
                )

        # 8. Seed an Academic Observation
        if aarav_stu:
            obs = (
                await session.execute(
                    select(AcademicObservation).where(
                        AcademicObservation.student_id == aarav_stu.id,
                        AcademicObservation.batch_id == batch_fsw.id,
                    )
                )
            ).scalar_one_or_none()
            if not obs:
                session.add(
                    AcademicObservation(
                        student_id=aarav_stu.id,
                        batch_id=batch_fsw.id,
                        trainer_email=trainer.email,
                        trainer_name=trainer.name,
                        observation_type="Commendation",
                        note="Exhibited outstanding architectural comprehension during the state management review.",
                    )
                )

        await session.commit()
        print("Trainer data successfully seeded!")


if __name__ == "__main__":
    asyncio.run(seed())
