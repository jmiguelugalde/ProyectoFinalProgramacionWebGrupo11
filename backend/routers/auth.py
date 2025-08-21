from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from backend.schemas import UserCreate
from backend.auth_utils import hash_password, verify_password, create_access_token
import mysql.connector
import os
from dotenv import load_dotenv
from typing import TypedDict, cast

load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])


# -----------------------------
# Conexión a la base de datos
# -----------------------------
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


# -----------------------------
# Tipado de usuario en DB
# -----------------------------
class DBUser(TypedDict):
    id: int
    username: str
    email: str
    role: str   
    password: str


# -----------------------------
# Registro de usuario
# -----------------------------
@router.post("/register")
def register(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verificar si ya existe usuario o correo
    cursor.execute(
        "SELECT id FROM users WHERE username = %s OR email = %s",
        (user.username, user.email),
    )
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Usuario o correo ya existe")

    # Hashear contraseña antes de guardar
    hashed = hash_password(user.password)
    cursor.execute(
        """
        INSERT INTO users (username, email, password, role)
        VALUES (%s, %s, %s, %s)
        """,
        (user.username, user.email, hashed, user.role),
    )
    conn.commit()
    conn.close()

    return {"message": "Usuario registrado exitosamente"}


# -----------------------------
# Login de usuario
# -----------------------------
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    result = cursor.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    db_user = cast(DBUser, result)

    # Verificar contraseña con bcrypt
    if not verify_password(form_data.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # Generar token JWT con role correcto
    token = create_access_token({"sub": db_user["username"], "role": db_user["role"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user["username"],
        "role": db_user["role"]
    }
