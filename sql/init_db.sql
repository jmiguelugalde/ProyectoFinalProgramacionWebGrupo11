-- ============================================
-- Reinicio completo del esquema
-- ============================================

DROP DATABASE IF EXISTS punto_venta;
CREATE DATABASE punto_venta;
USE punto_venta;

-- ============================================
-- Tabla de usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('cliente', 'contador', 'admin') NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla de productos
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    presentacion VARCHAR(100),
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    margen_utilidad DECIMAL(5,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stock INT DEFAULT 0
);

-- ============================================
-- Entradas de inventario
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES products(id)
);

-- ============================================
-- Ventas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES products(id)
);

-- ============================================
-- Historial de ventas (auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS ventas_hist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME NOT NULL,
    fecha_liquidacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_liquidacion VARCHAR(50) DEFAULT 'sistema',
    FOREIGN KEY (producto_id) REFERENCES products(id)
);

-- ============================================
-- Auditoría de inventario (encabezado)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL,
    usuarios TEXT NOT NULL
);

-- ============================================
-- Detalle de auditoría de inventario
-- ============================================
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

-- ============================================
-- Trigger: cuando se elimina una venta, se mueve a ventas_hist
-- ============================================
DELIMITER $$
CREATE TRIGGER after_delete_ventas
AFTER DELETE ON ventas
FOR EACH ROW
BEGIN
    INSERT INTO ventas_hist (
        id_venta, usuario, producto_id, cantidad,
        precio_unitario, total, fecha, fecha_liquidacion, usuario_liquidacion
    ) VALUES (
        OLD.id, OLD.usuario, OLD.producto_id, OLD.cantidad,
        OLD.precio_unitario, OLD.total, OLD.fecha,
        NOW(), USER()
    );
END$$
DELIMITER ;
