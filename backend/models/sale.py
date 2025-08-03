from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SaleCreate(BaseModel):
    producto_id: int
    cantidad: int

class SaleOut(BaseModel):
    id: int
    usuario: str
    producto_id: int
    cantidad: int
    precio_unitario: float
    total: float
    fecha: datetime
