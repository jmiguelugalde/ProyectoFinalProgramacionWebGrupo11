-- ============================================
-- Reinicio completo del esquema
-- ============================================
DROP DATABASE IF EXISTS pulperia;
CREATE DATABASE pulperia;
USE pulperia;

-- ============================================
-- Tabla de usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','contador','cliente') NOT NULL
);

-- Usuario inicial (password encriptada con bcrypt: "admin123")
INSERT INTO users (username, password, role)
VALUES (
    'admin',
    '$2b$12$4XDWj3jJ4V0FvYpXqX9E7eQ6dFQ3lqpFjYbAVdI6Lw2jQKjYp3P8m',
    'admin'
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
    FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- Ventas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Historial de ventas (auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS ventas_hist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME NOT NULL,
    fecha_liquidacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_liquidacion VARCHAR(50) DEFAULT 'sistema',
    FOREIGN KEY (producto_id) REFERENCES products(id),
    FOREIGN KEY (usuario_id) REFERENCES users(id)
);

DELIMITER $$
CREATE TRIGGER after_delete_ventas
AFTER DELETE ON ventas
FOR EACH ROW
BEGIN
    INSERT INTO ventas_hist (
        id_venta, usuario_id, producto_id, cantidad,
        precio_unitario, total, fecha, fecha_liquidacion, usuario_liquidacion
    ) VALUES (
        OLD.id, OLD.usuario_id, OLD.producto_id, OLD.cantidad,
        OLD.precio_unitario, OLD.total, OLD.fecha,
        NOW(), USER()
    );
END$$
DELIMITER ;

-- ============================================
-- Cuentas por cobrar
-- ============================================
CREATE TABLE IF NOT EXISTS cuentas_por_cobrar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    cliente_id INT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    saldo_pendiente DECIMAL(12,2) NOT NULL,
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATETIME NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Cobros
-- ============================================
CREATE TABLE IF NOT EXISTS cobros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    metodo_pago ENUM('efectivo','tarjeta','transferencia','otro') NOT NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NULL,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Toma física (encabezado)
-- ============================================
CREATE TABLE IF NOT EXISTS toma_fisica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    usuarios_presentes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Diferencias de inventario (detalle)
-- ============================================
CREATE TABLE IF NOT EXISTS diferencias_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    toma_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_encontrada INT NOT NULL DEFAULT 0,
    cantidad_teorica INT NOT NULL DEFAULT 0,
    diferencia_unidades INT NOT NULL DEFAULT 0,
    costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    diferencia_monetaria DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (toma_id) REFERENCES toma_fisica(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- Índices recomendados
-- ============================================
CREATE INDEX idx_inventory_producto ON inventory_entries(producto_id);
CREATE INDEX idx_diferencias_toma ON diferencias_inventario(toma_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_producto ON ventas(producto_id);
