from pydantic import BaseModel
from datetime import datetime

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

    class Config:
        orm_mode = True
