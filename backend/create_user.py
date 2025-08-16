import os
import sys
import argparse
import importlib
import mysql.connector
from pathlib import Path
from typing import Callable, Set, Any, Optional
from dotenv import load_dotenv

# Carga backend/.env si existe (en Docker usará variables de entorno del servicio)
load_dotenv(Path(__file__).with_name(".env"))

def resolve_hasher() -> Callable[[str], str]:
    """
    1) Usa backend.security.get_password_hash si existe.
    2) Si no, usa backend.security.pwd_context.hash si existe.
    3) Fallback: passlib[bcrypt] (importado dinámicamente).
    """
    try:
        sec = importlib.import_module("backend.security")
        f = getattr(sec, "get_password_hash", None)
        if callable(f):
            return f  # type: ignore[return-value]
        pwd_context = getattr(sec, "pwd_context", None)
        if pwd_context is not None and hasattr(pwd_context, "hash"):
            return lambda pw: pwd_context.hash(pw)
    except Exception:
        pass

    try:
        ctx_mod = importlib.import_module("passlib.context")
        CryptContext = getattr(ctx_mod, "CryptContext")
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return lambda pw: pwd.hash(pw)
    except Exception as e:
        raise RuntimeError(
            "No se encontró un hasher en backend.security y falló el fallback con passlib.\n"
            "Instala dependencias: pip install \"passlib[bcrypt]\""
        ) from e

get_password_hash = resolve_hasher()

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "pulperia"),
    )

def get_users_columns(cur) -> Set[str]:
    cur.execute("SHOW COLUMNS FROM users")
    rows = cur.fetchall() or []
    cols: Set[str] = set()
    for row in rows:
        if isinstance(row, (tuple, list)):
            cols.add(row[0])
        elif isinstance(row, dict):
            cols.add(row.get("Field") or row.get("COLUMN_NAME") or next(iter(row.values())))
        else:
            try:
                cols.add(row[0])  # type: ignore[index]
            except Exception:
                pass
    return cols

def detect_password_column(cols: Set[str]) -> str:
    for c in ("password", "hashed_password", "password_hash"):
        if c in cols:
            return c
    raise RuntimeError(f"No encuentro columna de password en tabla users. Columnas: {cols}")

def default_email_for(username: str) -> str:
    return f"{username}@local.test"

def main():
    ap = argparse.ArgumentParser(description="Crea un usuario en la tabla 'users'.")
    ap.add_argument("--username", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--role", default="cliente")
    ap.add_argument("--email", required=False,
                    help="Email del usuario (si la tabla lo exige y no se pasa, se usa username@local.test)")
    args = ap.parse_args()

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        # ¿ya existe por username?
        cur.execute("SELECT id FROM users WHERE username=%s", (args.username,))
        if cur.fetchone():
            print(f"Usuario '{args.username}' ya existe.")
            return

        cols = get_users_columns(cur)
        passcol = detect_password_column(cols)
        hashed = get_password_hash(args.password)

        # Si la tabla tiene 'email' y suele ser NOT NULL, prepáralo
        email_to_use: Optional[str] = None
        if "email" in cols:
            email_to_use = args.email or default_email_for(args.username)
            # (opcional) comprobar unicidad
            try:
                cur.execute("SELECT id FROM users WHERE email=%s", (email_to_use,))
                if cur.fetchone():
                    print(f"Ya existe un usuario con email '{email_to_use}'. Cambia --email.")
                    return
            except Exception:
                pass

        # Construir INSERT dinámico según columnas presentes
        fields = ["username", passcol]
        values: list[Any] = [args.username, hashed]

        if "role" in cols:
            fields.append("role")
            values.append(args.role)

        if "email" in cols:
            fields.append("email")
            values.append(email_to_use)

        placeholders = ", ".join(["%s"] * len(values))
        columns_sql = ", ".join(fields)
        sql = f"INSERT INTO users ({columns_sql}) VALUES ({placeholders})"

        try:
            cur.execute(sql, tuple(values))
            conn.commit()
        except mysql.connector.errors.IntegrityError as e:
            if getattr(e, "errno", None) == 1062:
                print(f"⚠ Violación de unicidad (username o email duplicado). Detalle: {e.msg}")
                return
            raise

        rol_txt = f" (rol={args.role})" if "role" in cols else ""
        email_txt = f", email={email_to_use}" if "email" in cols else ""
        print(f"✔ Usuario creado: {args.username}{rol_txt}{email_txt}")

    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

if __name__ == "__main__":
    # Asegura que 'backend' esté en sys.path si se ejecuta como script en local
    try:
        sys.path.append(str(Path(__file__).resolve().parents[1]))
    except Exception:
        pass
    main()
