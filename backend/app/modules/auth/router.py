from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from app.core.security import create_access_token
from app.core.exceptions import InvalidCredentialsException
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    # Phase 1 scaffolding / initial mock credentials
    if credentials.password != "admin123":
        raise InvalidCredentialsException("Invalid username or password.")
    
    token = create_access_token(
        subject=credentials.email,
        role="super_admin"
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": credentials.email,
            "role": "super_admin",
            "name": "Institute Administrator"
        }
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user.get("id"),
        "role": current_user.get("role"),
        "name": "Institute Administrator"
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Session terminated successfully."}
