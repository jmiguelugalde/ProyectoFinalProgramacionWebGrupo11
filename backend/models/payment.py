from pydantic import BaseModel
from typing import Optional

class EstadoCuentaUsuario(BaseModel):
    usuario: str
    total_pendiente: float

class Pago(BaseModel):
    usuario: str
    monto: float
