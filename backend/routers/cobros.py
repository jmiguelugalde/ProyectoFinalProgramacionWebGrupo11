from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Set, Tuple, cast
from decimal import Decimal
from datetime import date, datetime
import io, csv
import os
import mysql.connector

router = APIRouter(prefix="/cobros", tags=["cobros"])


# =============================
# Conexión a BD
# =============================
def db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "pulperia"),
    )


# =============================
# Modelos
# =============================
class Periodo(BaseModel):
    inicio: str  # YYYY-MM-DD
    fin: str     # YYYY-MM-DD


# =============================
# Utilidades de conversión
# =============================
def to_str(x: Any) -> str:
    if x is None:
        return ""
    if isinstance(x, (datetime, date)):
        return x.isoformat()
    if isinstance(x, bytes):
        try:
            return x.decode("utf-8", errors="ignore")
        except Exception:
            return str(x)
    return str(x)

def to_float(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, Decimal):
        return float(x)
    if isinstance(x, (int, float)):
        return float(x)
    try:
        return float(x)
    except Exception:
        return 0.0

def to_int(x: Any) -> int:
    if x is None:
        return 0
    if isinstance(x, Decimal):
        return int(x)
    if isinstance(x, (int,)):
        return int(x)
    if isinstance(x, float):
        return int(x)
    try:
        return int(x)
    except Exception:
        return 0

def row_dicts(rows: List[Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for r in rows:
        if isinstance(r, dict):
            out.append(cast(Dict[str, Any], r))
        else:
            try:
                out.append(dict(r))
            except Exception:
                out.append({"_raw": r})
    return out

def now_str() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


# =============================
# PREVIEW (base)
# =============================
@router.post("/preview")
def preview(p: Periodo):
    cnx = db()
    cur = cnx.cursor(dictionary=True)
    query = """
    SELECT
      v.id AS venta_id,
      v.created_at AS fecha,
      u.id AS user_id,
      u.username,
      u.nombre,
      u.cedula,
      u.employee_code,
      p.descripcion AS producto,
      vi.cantidad,
      vi.precio,
      vi.total
    FROM ventas v
    JOIN users u        ON u.id = v.user_id
    JOIN venta_items vi ON vi.venta_id = v.id
    JOIN productos p    ON p.id = vi.producto_id
    WHERE v.estado = 'registrada'
      AND DATE(v.created_at) BETWEEN %s AND %s
      AND (v.periodo_cobro_id IS NULL OR v.periodo_cobro_id = 0)
    """
    try:
        cur.execute(query, (p.inicio, p.fin))
        raw_rows = cur.fetchall() or []
    finally:
        cur.close()
        cnx.close()

    rows = row_dicts(raw_rows)

    detalle: List[Dict[str, Any]] = []
    resumen_map: Dict[int, Dict[str, Any]] = {}
    ventas_por_user: Dict[int, Set[int]] = {}

    for r in rows:
        venta_id = to_int(r.get("venta_id"))
        fecha_str = to_str(r.get("fecha"))
        user_id = to_int(r.get("user_id"))
        username = to_str(r.get("username"))
        nombre = to_str(r.get("nombre")) or username
        producto = to_str(r.get("producto"))
        cantidad = to_int(r.get("cantidad"))
        precio = to_float(r.get("precio"))
        total = to_float(r.get("total"))
        cedula = r.get("cedula")
        emp_code = r.get("employee_code")

        detalle.append({
            "fecha": fecha_str,
            "usuario": nombre,
            "producto": producto,
            "cantidad": cantidad,
            "precio": precio,
            "total": total,
            "venta_id": venta_id,
        })

        if user_id not in resumen_map:
            resumen_map[user_id] = {
                "user_id": user_id,
                "nombre": nombre,
                "cedula": to_str(cedula) if cedula is not None else None,
                "employee_code": to_str(emp_code) if emp_code is not None else None,
                "ventas": 0,
                "items": 0,
                "total": 0.0,
            }
            ventas_por_user[user_id] = set()

        ventas_por_user[user_id].add(venta_id)
        resumen_map[user_id]["items"] = to_int(resumen_map[user_id]["items"]) + cantidad
        resumen_map[user_id]["total"] = to_float(resumen_map[user_id]["total"]) + total

    for uid, s in ventas_por_user.items():
        resumen_map[uid]["ventas"] = len(s)

    resumen = list(resumen_map.values())
    total_periodo = sum(to_float(x["total"]) for x in resumen)

    return {
        "periodo": {"inicio": p.inicio, "fin": p.fin},
        "resumen": resumen,
        "detalle": detalle,
        "total_periodo": total_periodo,
        "total_asociados": len(resumen),
        "total_ventas": len({d["venta_id"] for d in detalle}),
    }


# =============================
# GENERAR PERÍODO / COBROS
# =============================
@router.post("/generar")
def generar(p: Periodo):
    """
    Crea el período, genera cobros por asociado y vincula ventas al período.
    """
    # 1) Reutilizamos la query de preview para traer ventas e items
    cnx = db()
    cur = cnx.cursor(dictionary=True)
    preview_sql = """
    SELECT
      v.id AS venta_id,
      v.created_at AS fecha,
      u.id AS user_id,
      u.username,
      u.nombre,
      vi.total
    FROM ventas v
    JOIN users u        ON u.id = v.user_id
    JOIN venta_items vi ON vi.venta_id = v.id
    WHERE v.estado = 'registrada'
      AND DATE(v.created_at) BETWEEN %s AND %s
      AND (v.periodo_cobro_id IS NULL OR v.periodo_cobro_id = 0)
    """
    try:
        cur.execute(preview_sql, (p.inicio, p.fin))
        raw_rows = cur.fetchall() or []
    finally:
        cur.close()

    if not raw_rows:
        cnx.close()
        raise HTTPException(status_code=400, detail="No hay ventas pendientes en ese período.")

    rows = row_dicts(raw_rows)

    # 2) Agregaciones: total por usuario y total por venta
    total_por_user: Dict[int, float] = {}
    ventas_por_user: Dict[int, Set[int]] = {}
    total_por_venta: Dict[int, float] = {}
    venta_user: Dict[int, int] = {}

    for r in rows:
        venta_id = to_int(r.get("venta_id"))
        user_id = to_int(r.get("user_id"))
        monto = to_float(r.get("total"))

        total_por_user[user_id] = total_por_user.get(user_id, 0.0) + monto
        total_por_venta[venta_id] = total_por_venta.get(venta_id, 0.0) + monto

        if user_id not in ventas_por_user:
            ventas_por_user[user_id] = set()
        ventas_por_user[user_id].add(venta_id)
        venta_user[venta_id] = user_id

    total_periodo = sum(total_por_user.values())

    # 3) Transacción: crear periodo, cobros, items, actualizar ventas
    cur = cnx.cursor()
    try:
        cnx.start_transaction()

        # 3.1 periodo_cobro
        cur.execute(
            "INSERT INTO periodos_cobro (inicio, fin, total, estado, created_at) VALUES (%s,%s,%s,%s,%s)",
            (p.inicio, p.fin, total_periodo, "pendiente", now_str()),
        )
        periodo_id = cur.lastrowid

        # 3.2 cobros por usuario
        cobro_id_por_user: Dict[int, int] = {}
        for user_id, total_u in total_por_user.items():
            cur.execute(
                "INSERT INTO cobros (periodo_id, user_id, total, estado, created_at) VALUES (%s,%s,%s,%s,%s)",
                (periodo_id, user_id, total_u, "pendiente", now_str()),
            )
            cobro_id_por_user[user_id] = cur.lastrowid

        # 3.3 items por venta (monto = total de la venta)
        items_to_insert: List[Tuple[int, int, float]] = []
        all_ventas: List[int] = []
        for venta_id, monto in total_por_venta.items():
            user_id = venta_user.get(venta_id, 0)
            cobro_id = cobro_id_por_user[user_id]
            items_to_insert.append((cobro_id, venta_id, monto))
            all_ventas.append(venta_id)

        cur.executemany(
            "INSERT INTO cobro_items (cobro_id, venta_id, monto) VALUES (%s,%s,%s)",
            items_to_insert
        )

        # 3.4 actualizar ventas con el período
        if all_ventas:
            # chunk simple por si fueran muchas
            chunk = 900
            for i in range(0, len(all_ventas), chunk):
                ids = all_ventas[i:i+chunk]
                placeholders = ",".join(["%s"] * len(ids))
                sql_upd = f"UPDATE ventas SET periodo_cobro_id = %s WHERE id IN ({placeholders})"
                cur.execute(sql_upd, (periodo_id, *ids,))

        # 3.5 actualizar total en el período (ya lo pusimos, pero por si acaso recalculado)
        cur.execute("UPDATE periodos_cobro SET total=%s WHERE id=%s", (total_periodo, periodo_id))

        cnx.commit()
    except Exception as e:
        cnx.rollback()
        cnx.close()
        raise
    finally:
        cur.close()
        cnx.close()

    return {
        "periodo_id": periodo_id,
        "total_periodo": total_periodo,
        "asociados": len(total_por_user),
        "ventas": len(total_por_venta),
        "mensaje": "Período y cobros generados correctamente."
    }


# =============================
# LISTA DE PERÍODOS
# =============================
@router.get("/periodos")
def periodos():
    cnx = db()
    cur = cnx.cursor(dictionary=True)
    sql = """
    SELECT
      pc.id, pc.inicio, pc.fin, pc.total, pc.estado, pc.created_at,
      COUNT(DISTINCT c.user_id) AS asociados,
      COUNT(c.id) AS cobros
    FROM periodos_cobro pc
    LEFT JOIN cobros c ON c.periodo_id = pc.id
    GROUP BY pc.id
    ORDER BY pc.inicio DESC, pc.id DESC
    """
    try:
        cur.execute(sql)
        raw = cur.fetchall() or []
    finally:
        cur.close()
        cnx.close()

    lst = []
    for r in row_dicts(raw):
        lst.append({
            "id": to_int(r.get("id")),
            "inicio": to_str(r.get("inicio")),
            "fin": to_str(r.get("fin")),
            "total": to_float(r.get("total")),
            "estado": to_str(r.get("estado")),
            "created_at": to_str(r.get("created_at")),
            "asociados": to_int(r.get("asociados")),
            "cobros": to_int(r.get("cobros")),
        })
    return lst


# =============================
# RESUMEN DE UN PERÍODO
# =============================
@router.get("/periodos/{pid}/resumen")
def periodo_resumen(pid: int):
    cnx = db()
    cur = cnx.cursor(dictionary=True)
    sql = """
    SELECT
      c.id AS cobro_id,
      u.id AS user_id,
      u.username,
      u.nombre,
      u.cedula,
      u.employee_code,
      c.total,
      c.estado
    FROM cobros c
    JOIN users u ON u.id = c.user_id
    WHERE c.periodo_id = %s
    ORDER BY u.nombre, u.username
    """
    try:
        cur.execute(sql, (pid,))
        raw = cur.fetchall() or []
    finally:
        cur.close()
        cnx.close()

    data = []
    total_periodo = 0.0
    for r in row_dicts(raw):
        total = to_float(r.get("total"))
        total_periodo += total
        data.append({
            "cobro_id": to_int(r.get("cobro_id")),
            "user_id": to_int(r.get("user_id")),
            "nombre": to_str(r.get("nombre")) or to_str(r.get("username")),
            "cedula": to_str(r.get("cedula")) or None,
            "employee_code": to_str(r.get("employee_code")) or None,
            "total": total,
            "estado": to_str(r.get("estado")),
        })

    return {
        "periodo_id": pid,
        "total_periodo": total_periodo,
        "asociados": len(data),
        "resumen": data,
    }


# =============================
# DETALLE (por venta) DE UN PERÍODO
# =============================
@router.get("/periodos/{pid}/detalle")
def periodo_detalle(pid: int):
    cnx = db()
    cur = cnx.cursor(dictionary=True)
    # Mostramos cada venta (monto) del período
    sql = """
    SELECT
      ci.venta_id,
      v.created_at AS fecha,
      u.id AS user_id,
      u.username,
      u.nombre,
      ci.monto AS total
    FROM cobro_items ci
    JOIN cobros c ON c.id = ci.cobro_id
    JOIN users u  ON u.id = c.user_id
    JOIN ventas v ON v.id = ci.venta_id
    WHERE c.periodo_id = %s
    ORDER BY u.nombre, v.created_at, ci.venta_id
    """
    try:
        cur.execute(sql, (pid,))
        raw = cur.fetchall() or []
    finally:
        cur.close()
        cnx.close()

    detalle = []
    for r in row_dicts(raw):
        detalle.append({
            "venta_id": to_int(r.get("venta_id")),
            "fecha": to_str(r.get("fecha")),
            "user_id": to_int(r.get("user_id")),
            "usuario": to_str(r.get("nombre")) or to_str(r.get("username")),
            "total": to_float(r.get("total")),
        })
    return {"periodo_id": pid, "detalle": detalle, "ventas": len(detalle)}


# =============================
# MARCAR COMO DESCONTADO
# =============================
@router.post("/periodos/{pid}/marcar-descontado")
def periodo_marcar_descontado(pid: int):
    cnx = db()
    cur = cnx.cursor()
    try:
        cnx.start_transaction()
        cur.execute("UPDATE periodos_cobro SET estado='descontado', descontado_at=%s WHERE id=%s", (now_str(), pid))
        cur.execute("UPDATE cobros SET estado='descontado', descontado_at=%s WHERE periodo_id=%s", (now_str(), pid))
        cnx.commit()
    except Exception:
        cnx.rollback()
        raise
    finally:
        cur.close()
        cnx.close()
    return {"periodo_id": pid, "estado": "descontado"}


# =============================
# EXPORT CSV (resumen por asociado)
# =============================
@router.get("/periodos/{pid}/export")
def periodo_export(pid: int, format: str = "csv"):
    if format.lower() != "csv":
        raise HTTPException(status_code=400, detail
