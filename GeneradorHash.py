from passlib.hash import bcrypt

def generar_hash(password: str) -> str:
    """
    Genera un hash seguro usando bcrypt para la contraseña dada.
    """
    try:
        hashed = bcrypt.hash(password)
        return hashed
    except Exception as e:
        print(f"Error al generar el hash: {e}")
        return ""

if __name__ == "__main__":
    # Cambiá aquí la contraseña que quieras hashear
    password_plano = "admin123"
    hash_generado = generar_hash(password_plano)
    print(f"Hash generado para '{password_plano}':\n{hash_generado}")

