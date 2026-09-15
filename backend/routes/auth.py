import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models.user import User
from schemas.auth import RegisterRequest, LoginRequest, UserResponse, AuthResponse, PreferencesUpdate
from utils.auth_helpers import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_auth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Registers a new user and returns a signed authentication session."""
    normalized_email = payload.email.lower().strip()

    # Check for existing user
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Hash password & create user
    hashed_pwd = hash_password(payload.password)
    new_user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hashed_pwd,
        experience_level=payload.experience_level,
        care_preference=payload.care_preference
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue access token
    access_token = create_access_token(data={"sub": str(new_user.id)})

    _set_auth_cookie(response, access_token)

    user_resp = UserResponse.model_validate(new_user)
    return AuthResponse(user=user_resp)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticates user credentials and returns a signed session token."""
    normalized_email = payload.email.lower().strip()
    
    user = db.query(User).filter(User.email == normalized_email).first()
    
    # Generic error message to prevent email enumeration attacks
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    _set_auth_cookie(response, access_token)

    user_resp = UserResponse.model_validate(user)
    return AuthResponse(user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_preferences(
    payload: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the caller's personalization preferences (validated values only)."""
    user = db.query(User).filter(User.id == current_user.id).one()
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/logout")
def logout(response: Response):
    """Clears authentication session cookies."""
    settings = get_settings()
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
    )
    return {"message": "Successfully logged out"}
