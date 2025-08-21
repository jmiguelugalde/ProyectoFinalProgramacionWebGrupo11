from pydantic import BaseModel, EmailStr
from typing import Optional, List
import enum
from datetime import datetime


class TokenData(BaseModel):
    username: str
    rol: Optional[str] = None

# -----------------------------
# Roles de Usuario
# -----------------------------
class UserRole(str, enum.Enum):
    cliente = "cliente"
    admin = "admin"
    contador = "contador"

# -----------------------------
# Productos
# -----------------------------
class ProductBase(BaseModel):
    nombre: str
    descripcion: str
    marca: Optional[str]
    presentacion: Optional[str]
    codigo_barras: Optional[str]
    costo: float
    margen_utilidad: float
    precio_venta: float
    stock: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    """Usado para actualizar productos (mismos campos que base)."""
    pass


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ProductOut(ProductRead):
    pass

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

# -----------------------------
# Usuarios
# -----------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole   # 👈 enlazamos con el Enum de arriba

class UserCreate(UserBase):
    password: str   # contraseña que el usuario envía al registrarse

class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
