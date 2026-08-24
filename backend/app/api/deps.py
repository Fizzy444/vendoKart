from typing import Callable, List
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import decode_token
from app.models.user import UserRole, UserStatus
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

security_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
) -> UserResponse:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity could not be validated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await AuthService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    if current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user


def require_role(allowed_roles: List[UserRole]) -> Callable:
    async def role_checker(
        current_user: UserResponse = Depends(get_current_active_user),
    ) -> UserResponse:
        user_role_values = [
            r.value if hasattr(r, "value") else str(r) for r in current_user.roles
        ]
        allowed_role_values = [
            r.value if hasattr(r, "value") else str(r) for r in allowed_roles
        ]
        
        # Check if there is any intersection or if user is admin
        if UserRole.ADMIN.value in user_role_values:
            return current_user

        if not any(role in user_role_values for role in allowed_role_values):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker
