# backend/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import enum
from datetime import datetime

# -----------------------------
# Roles de Usuario
# -----------------------------
class UserRole(str, enum.Enum):
    cliente = "cliente"
    admin = "admin"
    contabilidad = "contabilidad"

# -----------------------------
# Usuarios
# -----------------------------
class UserBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: UserRole

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    correo: EmailStr
    password: str

class TokenData(BaseModel):
    username: str
    rol: UserRole

# -----------------------------
# Productos
# -----------------------------
class ProductBase(BaseModel):
    descripcion: str
    marca: str
    presentacion: str
    codigo_barras: str
    costo: float
    margen_utilidad: float
    precio_venta: float

class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# -----------------------------
# Ventas
# -----------------------------
class SaleBase(BaseModel):
    producto_id: int
    cantidad: int

class SaleCreate(SaleBase):
    pass

class SaleCreateBulk(BaseModel):
    items: List[SaleCreate]   # ✅ Aquí agrupamos varias ventas

class SaleOut(SaleBase):
    id: int
    usuario: str
    precio_unitario: float
    total: float
    fecha: datetime

    class Config:
        orm_mode = True
