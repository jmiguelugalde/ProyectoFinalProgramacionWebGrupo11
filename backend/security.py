from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.auth_utils import decode_access_token
from pydantic import BaseModel
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenData(username=payload.get("sub"), role=payload.get("role"))

def admin_required(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")

def contador_required(current_user: TokenData = Depends(get_current_user)):
    if current_user.role not in ["admin", "contador"]:
        raise HTTPException(status_code=403, detail="Acceso restringido a contadores o administradores")

def cliente_required(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "cliente":
        raise HTTPException(status_code=403, detail="Solo clientes pueden acceder a esta función")
