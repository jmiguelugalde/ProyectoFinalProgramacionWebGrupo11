import os
import re
from pathlib import Path
from typing import List
import mysql.connector
from mysql.connector import ProgrammingError
from dotenv import load_dotenv

# Carga backend/.env (funciona aunque ejecutes desde la raíz)
load_dotenv(Path(__file__).with_name(".env"))

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "pulperia")

SQL_FILE = Path(__file__).resolve().parents[1] / "sql" / "init_db.sql"

# Errores que podemos ignorar si la estructura ya existe
IGNORABLE_ERRNOS = {
    1050,  # Table already exists
    1060,  # Duplicate column
    1061,  # Duplicate key name
    1091,  # Can't DROP ... check that column/key exists
    1826,  # Duplicate foreign key (InnoDB)
}

def connect(db: str | None = None):
    return mysql.connector.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, database=db
    )

# Reescrituras para versiones que no soportan IF NOT EXISTS en ADD/INDEX/CONSTRAINT
REWRITES = [
    (re.compile(r"\bADD\s+IF\s+NOT\s+EXISTS\b", re.IGNORECASE), "ADD COLUMN"),
    (re.compile(r"\bADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\b", re.IGNORECASE), "ADD COLUMN"),
    (re.compile(r"\bADD\s+INDEX\s+IF\s+NOT\s+EXISTS\b", re.IGNORECASE), "ADD INDEX"),
    (re.compile(r"\bADD\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\b", re.IGNORECASE), "ADD UNIQUE INDEX"),
    (re.compile(r"\bADD\s+KEY\s+IF\s+NOT\s+EXISTS\b", re.IGNORECASE), "ADD KEY"),
    (re.compile(r"\bADD\s+CONSTRAINT\s+IF\s+NOT\s+EXISTS\b", re.IGNORECASE), "ADD CONSTRAINT"),
]

def rewrite_for_mysql_compat(stmt: str) -> str | None:
    new_stmt = stmt
    changed = False
    for pat, repl in REWRITES:
        if pat.search(new_stmt):
            new_stmt = pat.sub(repl, new_stmt)
            changed = True
    return new_stmt if changed else None

def execute_stmt(cur, stmt: str):
    s = stmt.strip()
    if not s:
        return
    try:
        cur.execute(s)
        return
    except ProgrammingError as e:
        # Si hay error de sintaxis, probamos reescrituras
        if e.errno == 1064:
            rewritten = rewrite_for_mysql_compat(s)
            if rewritten:
                cur.execute(rewritten)
                return
        # Ignora errores típicos de “ya existe”
        if e.errno in IGNORABLE_ERRNOS:
            return
        raise

def run_sql_file(cur, sql_text: str):
    """
    Ejecuta el SQL sin 'multi', manejando 'DELIMITER' y ejecutando statement por statement.
    """
    delimiter = ';'
    buf: List[str] = []

    def flush():
        if not buf:
            return
        stmt = ''.join(buf).strip()
        buf.clear()
        if not stmt:
            return
        # quita delimitador final si está presente
        if stmt.endswith(delimiter):
            stmt = stmt[: -len(delimiter)].rstrip()
        execute_stmt(cur, stmt)

    for raw_line in sql_text.splitlines():
        line = raw_line.rstrip('\n')
        stripped = line.strip()

        # saltar comentarios/líneas vacías
        if not stripped or stripped.startswith('--') or stripped.startswith('#'):
            continue

        # cambio de delimitador: DELIMITER $$
        if stripped.upper().startswith('DELIMITER '):
            flush()
            delimiter = stripped.split(None, 1)[1]
            continue

        buf.append(line + '\n')

        joined = ''.join(buf)
        if joined.endswith(delimiter + '\n') or joined.endswith(delimiter):
            flush()

    flush()

def main():
    if not SQL_FILE.exists():
        raise FileNotFoundError(f"No se encontró el archivo SQL: {SQL_FILE}")

    # 1) Crea DB si no existe
    conn = connect(None)
    cur = conn.cursor()
    cur.execute(
        f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    )
    conn.commit()
    cur.close(); conn.close()

    # 2) Conecta a la DB e importa el SQL
    conn = connect(DB_NAME)
    cur = conn.cursor()
    sql_text = SQL_FILE.read_text(encoding="utf-8")
    print(f"Importando esquema desde: {SQL_FILE}")
    run_sql_file(cur, sql_text)
    conn.commit()
    cur.close(); conn.close()
    print("✔ Esquema importado correctamente.")

if __name__ == "__main__":
    main()
