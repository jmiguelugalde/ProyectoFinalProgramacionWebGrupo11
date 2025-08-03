from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from backend.models.user import UserCreate, UserInDB
from backend.auth_utils import hash_password, verify_password, create_access_token
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

@router.post("/register")
def register(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user.username, user.email))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Usuario o correo ya existe")

    hashed = hash_password(user.password)
    cursor.execute("""INSERT INTO users (username, email, hashed_password, role)
                      VALUES (%s, %s, %s, %s)""", (user.username, user.email, hashed, user.role))
    conn.commit()
    conn.close()
    return {"mensaje": "Usuario registrado exitosamente"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    db_user = cursor.fetchone()
    conn.close()

    if not db_user or not verify_password(form_data.password, db_user['hashed_password']):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token({"sub": db_user['username'], "role": db_user['role']})
    return {"access_token": token, "token_type": "bearer"}
