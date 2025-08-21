from pydantic import BaseModel, EmailStr

# -----------------------------
# Base de usuario
# -----------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    rol: str  # valores posibles: cliente, contador, admin

# -----------------------------
# Crear usuario (entrada)
# -----------------------------
class UserCreate(UserBase):
    password: str

# -----------------------------
# Usuario en DB (interno)
# -----------------------------
class UserInDB(UserBase):
    id: int
    password: str

    class Config:
        orm_mode = True  # 👈 útil si luego usás ORMs como SQLAlchemy

# -----------------------------
# Usuario para respuestas (salida)
# -----------------------------
class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True
