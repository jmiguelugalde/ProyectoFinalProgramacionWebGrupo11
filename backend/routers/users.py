# backend/routers/users.py
from fastapi import APIRouter, HTTPException
from backend.models.user import UserOut, UserCreate
from backend.auth_utils import hash_password
import mysql.connector
import os
from dotenv import load_dotenv
from typing import List

load_dotenv()

router = APIRouter(prefix="/users", tags=["users"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# Obtener todos los usuarios
@router.get("/", response_model=List[UserOut])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, username, email, role, active FROM users")
    rows = cursor.fetchall()
    conn.close()
    return rows

# Crear usuario
@router.post("/", response_model=UserOut)
def create_user(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verificar duplicados
    cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user.username, user.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Usuario o correo ya existe")

    hashed = hash_password(user.password)
    cursor.execute(
        "INSERT INTO users (username, email, password, role, active) VALUES (%s, %s, %s, %s, %s)",
        (user.username, user.email, hashed, "user", True)   # 👈 rol fijo "user"
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return {"id": user_id, "username": user.username, "email": user.email, "role": "user", "active": True}

# Actualizar usuario
@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    hashed = hash_password(user.password)

    cursor.execute(
        "UPDATE users SET username = %s, email = %s, password = %s, role = %s WHERE id = %s",
        (user.username, user.email, hashed, "user", user_id)  # 👈 rol fijo "user"
    )
    conn.commit()
    conn.close()

    return {"id": user_id, "username": user.username, "email": user.email, "role": "user", "active": True}

# Eliminar usuario
@router.delete("/{user_id}")
def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    if affected == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"mensaje": "Usuario eliminado exitosamente"}
