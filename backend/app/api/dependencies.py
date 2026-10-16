from typing import List, Optional
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.core.exceptions import InvalidCredentialsException, PermissionDeniedException

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise InvalidCredentialsException("Authentication credentials are required.")

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise InvalidCredentialsException("Invalid token payload.")
        return {"id": user_id, "role": role}
    except JWTError:
        raise InvalidCredentialsException("Could not validate credentials.")


def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles and user_role != "super_admin":
            raise PermissionDeniedException(
                detail=f"Role '{user_role}' is not authorized to access this resource."
            )
        return current_user
    return role_checker
