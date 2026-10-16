"""Repeatable database seeding script for synthetic institute data."""
import asyncio
from datetime import date, timedelta
from decimal import Decimal
import logging
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.institute import (
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    BatchEnrollment,
    BatchStatus,
    Course,
    EnrollmentStatus,
    FeeInstallment,
    FeeStatus,
    Student,
    StudentStatus,
    Trainer,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


async def seed():
    logger.info("Starting repeatable synthetic data seeding...")

    async with AsyncSessionLocal() as session:
        # -----------------------------------------------------
        # 1. Seed Courses
        # -----------------------------------------------------
        courses_data = [
            {
                "code": "FSW-101",
                "title": "Full-Stack Web Development",
                "duration_weeks": 16,
                "base_fee": Decimal("120000.00"),
                "description": "End-to-end full stack development using modern React, Python, and cloud infrastructure.",
            },
            {
                "code": "DSAI-201",
                "title": "Data Science & Applied AI",
                "duration_weeks": 20,
                "base_fee": Decimal("150000.00"),
                "description": "Comprehensive practical machine learning, deep learning, and AI applications.",
            },
            {
                "code": "CDO-301",
                "title": "Cloud Architecture & DevOps",
                "duration_weeks": 12,
                "base_fee": Decimal("95000.00"),
                "description": "Hands-on CI/CD, Kubernetes orchestration, Docker, and AWS/Azure architectures.",
            },
        ]

        course_map = {}
        for c in courses_data:
            existing = await session.execute(select(Course).where(Course.code == c["code"]))
            course_obj = existing.scalar_one_or_none()
            if not course_obj:
                course_obj = Course(**c)
                session.add(course_obj)
                await session.flush()
                logger.info(f"Seeded course: {c['code']}")
            course_map[c["code"]] = course_obj

        # -----------------------------------------------------
        # 2. Seed Trainers
        # -----------------------------------------------------
        trainers_data = [
            {
                "name": "Dr. Sarah Jenkins",
                "email": "sarah.j@edupilot.io",
                "phone": "+91-9876543210",
                "specialization": "Full-Stack Web Systems & Architecture",
                "bio": "12+ years experience in software engineering and education.",
            },
            {
                "name": "Prof. David Miller",
                "email": "david.m@edupilot.io",
                "phone": "+91-9876543211",
                "specialization": "Applied Machine Learning & NLP",
                "bio": "Former AI researcher and industry technical consultant.",
            },
            {
                "name": "Elena Rostova",
                "email": "elena.r@edupilot.io",
                "phone": "+91-9876543212",
                "specialization": "Cloud Platforms & Infrastructure Engineering",
                "bio": "DevOps practitioner with deep containerization expertise.",
            },
        ]

        trainer_map = {}
        for t in trainers_data:
            existing = await session.execute(select(Trainer).where(Trainer.email == t["email"]))
            trainer_obj = existing.scalar_one_or_none()
            if not trainer_obj:
                trainer_obj = Trainer(**t)
                session.add(trainer_obj)
                await session.flush()
                logger.info(f"Seeded trainer: {t['name']}")
            trainer_map[t["email"]] = trainer_obj

        # -----------------------------------------------------
        # 3. Seed Batches
        # -----------------------------------------------------
        batches_data = [
            {
                "code": "FSW-2026-A",
                "course_id": course_map["FSW-101"].id,
                "trainer_id": trainer_map["sarah.j@edupilot.io"].id,
                "start_date": date.today() - timedelta(days=30),
                "end_date": date.today() + timedelta(days=90),
                "capacity": 30,
                "status": BatchStatus.ACTIVE,
            },
            {
                "code": "DSAI-2026-B",
                "course_id": course_map["DSAI-201"].id,
                "trainer_id": trainer_map["david.m@edupilot.io"].id,
                "start_date": date.today() - timedelta(days=15),
                "end_date": date.today() + timedelta(days=125),
                "capacity": 25,
                "status": BatchStatus.ACTIVE,
            },
            {
                "code": "CDO-2026-C",
                "course_id": course_map["CDO-301"].id,
                "trainer_id": trainer_map["elena.r@edupilot.io"].id,
                "start_date": date.today() + timedelta(days=10),
                "end_date": date.today() + timedelta(days=95),
                "capacity": 20,
                "status": BatchStatus.UPCOMING,
            },
        ]

        batch_map = {}
        for b in batches_data:
            existing = await session.execute(select(Batch).where(Batch.code == b["code"]))
            batch_obj = existing.scalar_one_or_none()
            if not batch_obj:
                batch_obj = Batch(**b)
                session.add(batch_obj)
                await session.flush()
                logger.info(f"Seeded batch: {b['code']}")
            batch_map[b["code"]] = batch_obj

        # -----------------------------------------------------
        # 4. Seed Students
        # -----------------------------------------------------
        students_data = [
            {"name": "Aarav Patel", "email": "aarav.p@example.com", "phone": "+91-9811122233", "status": StudentStatus.ACTIVE},
            {"name": "Sophia Miller", "email": "sophia.m@example.com", "phone": "+91-9822233344", "status": StudentStatus.ACTIVE},
            {"name": "Rahul Sharma", "email": "rahul.s@example.com", "phone": "+91-9833344455", "status": StudentStatus.ACTIVE},
            {"name": "Priya Nair", "email": "priya.n@example.com", "phone": "+91-9844455566", "status": StudentStatus.ENROLLED},
            {"name": "Lucas Vance", "email": "lucas.v@example.com", "phone": "+91-9855566677", "status": StudentStatus.ACTIVE},
        ]

        student_map = {}
        for s in students_data:
            existing = await session.execute(select(Student).where(Student.email == s["email"]))
            stu_obj = existing.scalar_one_or_none()
            if not stu_obj:
                stu_obj = Student(**s)
                session.add(stu_obj)
                await session.flush()
                logger.info(f"Seeded student: {s['name']}")
            student_map[s["email"]] = stu_obj

        # -----------------------------------------------------
        # 5. Seed Batch Enrollments
        # -----------------------------------------------------
        enrollments = [
            (student_map["aarav.p@example.com"].id, batch_map["FSW-2026-A"].id),
            (student_map["sophia.m@example.com"].id, batch_map["FSW-2026-A"].id),
            (student_map["rahul.s@example.com"].id, batch_map["DSAI-2026-B"].id),
            (student_map["lucas.v@example.com"].id, batch_map["DSAI-2026-B"].id),
            (student_map["priya.n@example.com"].id, batch_map["CDO-2026-C"].id),
        ]

        for s_id, b_id in enrollments:
            existing = await session.execute(
                select(BatchEnrollment).where(
                    BatchEnrollment.student_id == s_id, BatchEnrollment.batch_id == b_id
                )
            )
            if not existing.scalar_one_or_none():
                enr = BatchEnrollment(student_id=s_id, batch_id=b_id, enrolled_on=date.today())
                session.add(enr)
                logger.info(f"Enrolled student {s_id} in batch {b_id}")

        # -----------------------------------------------------
        # 6. Seed Attendance Records
        # -----------------------------------------------------
        today = date.today()
        attendance_entries = [
            (student_map["aarav.p@example.com"].id, batch_map["FSW-2026-A"].id, today, AttendanceStatus.PRESENT),
            (student_map["sophia.m@example.com"].id, batch_map["FSW-2026-A"].id, today, AttendanceStatus.PRESENT),
            (student_map["rahul.s@example.com"].id, batch_map["DSAI-2026-B"].id, today, AttendanceStatus.ABSENT),
            (student_map["lucas.v@example.com"].id, batch_map["DSAI-2026-B"].id, today, AttendanceStatus.PRESENT),
        ]

        for s_id, b_id, s_date, a_stat in attendance_entries:
            existing = await session.execute(
                select(AttendanceRecord).where(
                    AttendanceRecord.student_id == s_id,
                    AttendanceRecord.batch_id == b_id,
                    AttendanceRecord.session_date == s_date,
                )
            )
            if not existing.scalar_one_or_none():
                att = AttendanceRecord(student_id=s_id, batch_id=b_id, session_date=s_date, status=a_stat)
                session.add(att)
                logger.info(f"Marked attendance for student {s_id}")

        # -----------------------------------------------------
        # 7. Seed Fee Installments
        # -----------------------------------------------------
        fee_entries = [
            {
                "student_id": student_map["aarav.p@example.com"].id,
                "batch_id": batch_map["FSW-2026-A"].id,
                "title": "Installment 1 - Admission",
                "amount_due": Decimal("60000.00"),
                "amount_paid": Decimal("60000.00"),
                "due_date": today - timedelta(days=20),
                "paid_date": today - timedelta(days=21),
                "status": FeeStatus.PAID,
                "receipt_number": "RCP-2026-001",
            },
            {
                "student_id": student_map["aarav.p@example.com"].id,
                "batch_id": batch_map["FSW-2026-A"].id,
                "title": "Installment 2 - Midterm",
                "amount_due": Decimal("60000.00"),
                "amount_paid": Decimal("0.00"),
                "due_date": today + timedelta(days=30),
                "status": FeeStatus.PENDING,
            },
            {
                "student_id": student_map["sophia.m@example.com"].id,
                "batch_id": batch_map["FSW-2026-A"].id,
                "title": "Installment 1 - Admission",
                "amount_due": Decimal("60000.00"),
                "amount_paid": Decimal("60000.00"),
                "due_date": today - timedelta(days=20),
                "paid_date": today - timedelta(days=19),
                "status": FeeStatus.PAID,
                "receipt_number": "RCP-2026-002",
            },
            {
                "student_id": student_map["rahul.s@example.com"].id,
                "batch_id": batch_map["DSAI-2026-B"].id,
                "title": "Full Course Payment",
                "amount_due": Decimal("150000.00"),
                "amount_paid": Decimal("75000.00"),
                "due_date": today - timedelta(days=5),
                "paid_date": today - timedelta(days=6),
                "status": FeeStatus.PARTIALLY_PAID,
                "receipt_number": "RCP-2026-003",
            },
        ]

        for f in fee_entries:
            existing = await session.execute(
                select(FeeInstallment).where(
                    FeeInstallment.student_id == f["student_id"],
                    FeeInstallment.title == f["title"],
                )
            )
            if not existing.scalar_one_or_none():
                inst = FeeInstallment(**f)
                session.add(inst)
                logger.info(f"Seeded fee installment '{f['title']}' for student {f['student_id']}")

        await session.commit()
        logger.info("Repeatable synthetic database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
