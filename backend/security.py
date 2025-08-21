# C:\Data\ProyectoPuntoDeVenta\backend\security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")  # ⚠️ Cambia por una clave segura en .env
ALGORITHM = "HS256"

# OAuth2 esquema para login con token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Modelo de usuario extraído del token
class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# Dependencia para obtener usuario desde el token
def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")

        if not username or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return TokenData(username=username, role=role)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependencia específica: solo usuarios con rol contador
def contador_required(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "contador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de contador",
        )
    return current_user


# Dependencia específica: solo usuarios con rol admin
def admin_required(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador",
        )
    return current_user


# Dependencia específica: solo usuarios con rol contador
def contador(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "contador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de contador",
        )
    return current_user


# Dependencia específica: solo usuarios con rol cliente
def cliente_required(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de cliente",
        )
    return current_user
