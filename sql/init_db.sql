CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('cliente', 'contador', 'admin') NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    presentacion VARCHAR(100),
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    margen_utilidad DECIMAL(5,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabla para registrar entradas de inventario
CREATE TABLE IF NOT EXISTS inventory_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES products(id)
);

-- Agregar columna de stock a productos (si no existe)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;


-- Tabla para registrar ventas realizadas por los usuarios
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES products(id)
);


-- Tabla de encabezado para tomas físicas de inventario
CREATE TABLE IF NOT EXISTS inventory_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL,
    usuarios TEXT NOT NULL
);

-- Detalle de productos escaneados por cada toma física
CREATE TABLE IF NOT EXISTS inventory_audit_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_encontrada INT NOT NULL,
    cantidad_teorica INT NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (audit_id) REFERENCES inventory_audits(id),
    FOREIGN KEY (producto_id) REFERENCES products(id)
);
