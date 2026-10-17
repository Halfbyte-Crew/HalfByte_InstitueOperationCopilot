from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.students.router import router as students_router
from app.modules.courses.router import router as courses_router
from app.modules.batches.router import router as batches_router
from app.modules.trainers.router import router as trainers_router
from app.modules.attendance.router import router as attendance_router
from app.modules.fees.router import router as fees_router
from app.modules.copilot.router import router as copilot_router
from app.modules.approvals.router import router as approvals_router
from app.modules.audit.router import router as audit_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.rag.router import router as rag_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(students_router)
api_router.include_router(courses_router)
api_router.include_router(batches_router)
api_router.include_router(trainers_router)
api_router.include_router(attendance_router)
api_router.include_router(fees_router)
api_router.include_router(copilot_router)
api_router.include_router(rag_router)
api_router.include_router(approvals_router)
api_router.include_router(audit_router)
