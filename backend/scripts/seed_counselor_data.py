"""Seed comprehensive counselor records for Priya Sharma and Ravi Nair."""
import asyncio
import os
import sys
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.institute import (
    Admission,
    Course,
    Batch,
    CounselorTask,
    Enquiry,
    InteractionLog,
    Student,
    StudentStatus,
)


async def seed():
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        existing_enquiries = (await session.execute(select(Enquiry))).scalars().first()
        if existing_enquiries:
            print("Counselor data already seeded. Skipping.")
            return

        # Fetch courses and batches
        courses = (await session.execute(select(Course))).scalars().all()
        batches = (await session.execute(select(Batch))).scalars().all()

        c1 = courses[0] if courses else None
        c2 = courses[1] if len(courses) > 1 else c1
        c3 = courses[2] if len(courses) > 2 else c1
        b1 = batches[0] if batches else None
        b2 = batches[1] if len(batches) > 1 else b1

        today = date.today()
        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # 1. Enquiries for Priya Sharma (counselor@edupilot.io)
        # -------------------------------------------------------------
        e1 = Enquiry(
            name="Aarav Mehta",
            email="aarav.mehta@example.com",
            phone="+91 98111 22334",
            course_id=c1.id if c1 else None,
            course_name=c1.title if c1 else "Full Stack Web Development",
            source="Website",
            status="New",
            assigned_counselor_email="counselor@edupilot.io",
            notes="Interested in evening batch. Requested syllabus details and placement statistics.",
            last_contact_date=None,
            next_follow_up_date=today,
        )
        e2 = Enquiry(
            name="Diya Kapoor",
            email="diya.k@example.com",
            phone="+91 98222 33445",
            course_id=c2.id if c2 else None,
            course_name=c2.title if c2 else "Data Science & Machine Learning",
            source="Social Media",
            status="Contacted",
            assigned_counselor_email="counselor@edupilot.io",
            notes="Completed introductory phone screening. Very keen on scholarship opportunities.",
            last_contact_date=today - timedelta(days=1),
            next_follow_up_date=today,
        )
        e3 = Enquiry(
            name="Rohan Verma",
            email="rohan.v@example.com",
            phone="+91 98333 44556",
            course_id=c1.id if c1 else None,
            course_name=c1.title if c1 else "Full Stack Web Development",
            source="Referral",
            status="Counseling Scheduled",
            assigned_counselor_email="counselor@edupilot.io",
            notes="1-on-1 counseling session booked for tomorrow 11:00 AM.",
            last_contact_date=today - timedelta(days=2),
            next_follow_up_date=today + timedelta(days=1),
        )
        e4 = Enquiry(
            name="Sneha Patil",
            email="sneha.patil@example.com",
            phone="+91 98444 55667",
            course_id=c3.id if c3 else None,
            course_name=c3.title if c3 else "Cloud & DevOps Engineering",
            source="Campus Walk-in",
            status="Contacted",
            assigned_counselor_email="counselor@edupilot.io",
            notes="Walked in with parents. Needs clarification on prerequisite mathematics background.",
            last_contact_date=today - timedelta(days=4),
            next_follow_up_date=today - timedelta(days=1),  # Overdue follow-up!
        )
        e5 = Enquiry(
            name="Ishaan Gupta",
            email="ishaan.g@example.com",
            phone="+91 98555 66778",
            course_id=c2.id if c2 else None,
            course_name=c2.title if c2 else "Data Science & Machine Learning",
            source="Education Fair",
            status="Converted",
            assigned_counselor_email="counselor@edupilot.io",
            notes="Application completed and converted to active admission pipeline.",
            last_contact_date=today - timedelta(days=3),
            next_follow_up_date=today + timedelta(days=5),
        )

        # -------------------------------------------------------------
        # 2. Enquiries for Ravi Nair (coordinator@edupilot.io) - Isolation test
        # -------------------------------------------------------------
        e_ravi1 = Enquiry(
            name="Vikram Rao",
            email="vikram.rao@example.com",
            phone="+91 98666 77889",
            course_id=c1.id if c1 else None,
            course_name=c1.title if c1 else "Full Stack Web Development",
            source="Website",
            status="New",
            assigned_counselor_email="coordinator@edupilot.io",
            notes="Ravi's assigned prospect.",
            last_contact_date=None,
            next_follow_up_date=today,
        )

        session.add_all([e1, e2, e3, e4, e5, e_ravi1])
        await session.flush()

        # -------------------------------------------------------------
        # 3. Admissions for Priya Sharma
        # -------------------------------------------------------------
        adm1 = Admission(
            enquiry_id=e5.id,
            student_name="Ishaan Gupta",
            student_email="ishaan.g@example.com",
            student_phone="+91 98555 66778",
            course_id=c2.id if c2 else None,
            course_title=c2.title if c2 else "Data Science & Machine Learning",
            batch_id=b1.id if b1 else None,
            assigned_counselor_email="counselor@edupilot.io",
            stage="Application Started",
            application_date=today - timedelta(days=3),
            documents_required=[
                {"name": "Class 10th Certificate", "status": "Verified"},
                {"name": "Class 12th / Degree Marksheet", "status": "Pending"},
                {"name": "Government ID Proof", "status": "Verified"},
            ],
            pending_requirements="Class 12th / Degree Marksheet pending submission.",
            last_activity="Submitted registration form and partial identity documents.",
            next_action="Request degree marksheets from candidate",
            follow_up_due_date=today,
        )
        adm2 = Admission(
            student_name="Ananya Iyer",
            student_email="ananya.iyer@example.com",
            student_phone="+91 98777 88990",
            course_id=c1.id if c1 else None,
            course_title=c1.title if c1 else "Full Stack Web Development",
            batch_id=b1.id if b1 else None,
            assigned_counselor_email="counselor@edupilot.io",
            stage="Documents Under Review",
            application_date=today - timedelta(days=5),
            documents_required=[
                {"name": "Class 10th Certificate", "status": "Verified"},
                {"name": "Degree Marksheet", "status": "Verified"},
                {"name": "Government ID Proof", "status": "Verified"},
            ],
            pending_requirements="All documents submitted. Awaiting administrative approval.",
            last_activity="All credentials validated by counselor.",
            next_action="Submit for Administrator Approval",
            follow_up_due_date=today + timedelta(days=2),
        )
        adm3 = Admission(
            student_name="Aditya Sen",
            student_email="aditya.sen@example.com",
            student_phone="+91 98888 99001",
            course_id=c3.id if c3 else None,
            course_title=c3.title if c3 else "Cloud & DevOps Engineering",
            batch_id=b2.id if b2 else None,
            assigned_counselor_email="counselor@edupilot.io",
            stage="Documents Pending",
            application_date=today - timedelta(days=7),
            documents_required=[
                {"name": "Government ID Proof", "status": "Pending"},
                {"name": "Transfer Certificate", "status": "Pending"},
            ],
            pending_requirements="Identity proof and college transfer certificate outstanding.",
            last_activity="Sent document checklist reminder via email.",
            next_action="Call student regarding pending transfer certificate",
            follow_up_due_date=today - timedelta(days=1),  # Overdue action!
        )
        # Admission for Ravi (isolation)
        adm_ravi = Admission(
            student_name="Kiran Bhat",
            student_email="kiran.bhat@example.com",
            student_phone="+91 98999 00112",
            course_id=c1.id if c1 else None,
            course_title=c1.title if c1 else "Full Stack Web Development",
            batch_id=b1.id if b1 else None,
            assigned_counselor_email="coordinator@edupilot.io",
            stage="Application Started",
            application_date=today - timedelta(days=2),
            documents_required=[{"name": "ID Proof", "status": "Pending"}],
            pending_requirements="ID Proof pending.",
            last_activity="Application initiated by Ravi.",
            next_action="Collect ID proof",
            follow_up_due_date=today + timedelta(days=1),
        )

        session.add_all([adm1, adm2, adm3, adm_ravi])
        await session.flush()

        e5.converted_to_admission_id = adm1.id
        e5.converted_at = now - timedelta(days=3)

        # -------------------------------------------------------------
        # 4. Counselor Tasks & Follow-ups for Priya Sharma
        # -------------------------------------------------------------
        t1 = CounselorTask(
            enquiry_id=e1.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Initial Outreach Call - Aarav Mehta",
            description="Call Aarav to understand course requirements and explain batch timings.",
            due_datetime=now.replace(hour=10, minute=30, second=0, microsecond=0),  # Due Today!
            priority="High",
            status="Pending",
        )
        t2 = CounselorTask(
            enquiry_id=e2.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Follow-up on Scholarship Criteria - Diya Kapoor",
            description="Provide fee breakdown and early-bird scholarship guidelines.",
            due_datetime=now.replace(hour=14, minute=0, second=0, microsecond=0),  # Due Today!
            priority="Medium",
            status="Pending",
        )
        t3 = CounselorTask(
            enquiry_id=e4.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Urgent Call - Sneha Patil Math Syllabus Query",
            description="Clarify prerequisites with faculty and respond back to candidate's parents.",
            due_datetime=now - timedelta(days=1, hours=2),  # Overdue!
            priority="Urgent",
            status="Pending",
        )
        t4 = CounselorTask(
            admission_id=adm3.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Collect Pending Transfer Certificate - Aditya Sen",
            description="Student promised to submit college TC by yesterday. Follow up via WhatsApp/call.",
            due_datetime=now - timedelta(days=1, hours=5),  # Overdue!
            priority="High",
            status="Pending",
        )
        t5 = CounselorTask(
            enquiry_id=e3.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Conduct 1-on-1 Counseling Session - Rohan Verma",
            description="Campus in-person counseling session scheduled in Room 204.",
            due_datetime=now + timedelta(days=1, hours=3),  # Upcoming!
            priority="High",
            status="Pending",
        )
        t6 = CounselorTask(
            admission_id=adm2.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Submit Admission Approval Request - Ananya Iyer",
            description="All documents verified. Prepare and submit formal approval request to Admin.",
            due_datetime=now + timedelta(days=2),  # Upcoming!
            priority="Medium",
            status="Pending",
        )
        t7 = CounselorTask(
            enquiry_id=e5.id,
            assigned_counselor_email="counselor@edupilot.io",
            title="Complete Registration Onboarding - Ishaan Gupta",
            description="Assisted candidate in filling registration form and generated admission record.",
            due_datetime=now - timedelta(days=3),
            priority="Medium",
            status="Completed",
            completed_at=now - timedelta(days=3),
        )

        # Task for Ravi (isolation)
        t_ravi = CounselorTask(
            enquiry_id=e_ravi1.id,
            assigned_counselor_email="coordinator@edupilot.io",
            title="Ravi's Task - Vikram Rao Call",
            description="Ravi's follow-up item.",
            due_datetime=now.replace(hour=11, minute=0, second=0, microsecond=0),
            priority="Medium",
            status="Pending",
        )

        session.add_all([t1, t2, t3, t4, t5, t6, t7, t_ravi])

        # -------------------------------------------------------------
        # 5. Interaction Logs for Priya
        # -------------------------------------------------------------
        i1 = InteractionLog(
            enquiry_id=e2.id,
            counselor_email="counselor@edupilot.io",
            interaction_type="Call",
            summary="Initial telephone discussion",
            details="Candidate holds B.Sc. in Statistics and wants career switch to Machine Learning. Discussed Python prerequisites.",
        )
        i2 = InteractionLog(
            enquiry_id=e4.id,
            counselor_email="counselor@edupilot.io",
            interaction_type="In-Person Meeting",
            summary="Walk-in campus tour and counselling",
            details="Visited campus with mother. Explored lab facilities and inquired about weekend batch availability.",
        )
        i3 = InteractionLog(
            admission_id=adm1.id,
            counselor_email="counselor@edupilot.io",
            interaction_type="Email",
            summary="Sent document checklist",
            details="Sent formal email with checklist of remaining verification documents.",
        )

        session.add_all([i1, i2, i3])

        # -------------------------------------------------------------
        # 6. Assign some existing Students to Priya Sharma
        # -------------------------------------------------------------
        existing_students = (await session.execute(select(Student).limit(4))).scalars().all()
        for idx, st in enumerate(existing_students):
            st.assigned_counselor_email = "counselor@edupilot.io"
            if idx == 0:
                adm1.student_id = st.id
                e5.converted_to_student_id = st.id

        await session.commit()
        print("Successfully seeded counselor enquiries, admissions, tasks, and interaction logs!")


if __name__ == "__main__":
    asyncio.run(seed())
