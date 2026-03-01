-- Database Schema for POS System with SRI Integration & Multi-Tenancy
-- Run this script in your MySQL interface

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS company_settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS tenants;

SET FOREIGN_KEY_CHECKS = 1;

-- Multi-Tenant Base Table
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_tenant (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT DEFAULT 0,
    category VARCHAR(100),
    category_id INT,
    code VARCHAR(50),
    image_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE KEY unique_product_code_tenant (tenant_id, code),
    INDEX idx_tenant_category (tenant_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    document_id VARCHAR(50), -- Cedula/NIT
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_document_tenant (tenant_id, document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    customer_id INT,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    document_type VARCHAR(50),
    -- SRI Fields
    sri_secuencial INT UNSIGNED NULL,    -- Número correlativo asignado al momento del envío
    sri_access_key VARCHAR(49) NULL,
    sri_status VARCHAR(20) DEFAULT 'PENDING',
    sri_auth_date DATETIME NULL,
    sri_xml LONGTEXT NULL,
    sri_message TEXT NULL,
    subtotal DECIMAL(10,2) NULL,
    tax_amount DECIMAL(10,2) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_tenant_date (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255) NOT NULL DEFAULT '',
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_sale (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    tax_id VARCHAR(50),
    email VARCHAR(255),
    currency VARCHAR(10) DEFAULT '$',
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    logo LONGTEXT,
    
    -- New SRI Settings
    sri_regime VARCHAR(100) DEFAULT 'GENERAL', -- GENERAL, RIMPE_NEGOCIO_POPULAR, RIMPE_EMPRENDEDOR
    sri_environment VARCHAR(20) DEFAULT 'PRUEBAS', -- PRUEBAS, PRODUCCION
    accounting_obligated BOOLEAN DEFAULT FALSE,
    sri_establecimiento VARCHAR(3) DEFAULT '001', -- Número de establecimiento (3 dígitos)
    sri_punto_emision VARCHAR(3) DEFAULT '001',   -- Punto de emisión (3 dígitos)
    sri_secuencial INT UNSIGNED NOT NULL DEFAULT 0, -- Contador correlativo de facturas SRI
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_settings_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting for login endpoint
CREATE TABLE IF NOT EXISTS login_attempts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    ip         VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_time (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- JWT token blacklist (revoked tokens on logout)
CREATE TABLE IF NOT EXISTS token_blacklist (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    jti        VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE KEY uk_jti (jti),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- INITIAL DATA SEEDING (2 TENANTS)
-- ==========================================

-- Insert the 2 Tenants
INSERT INTO tenants (id, name) VALUES (1, 'Empresa 1 - Admin A');
INSERT INTO tenants (id, name) VALUES (2, 'Empresa 2 - Admin B');

-- Insert Company Settings for Tenant 1
INSERT INTO company_settings (tenant_id, name, address, tax_rate, sri_regime, sri_environment, accounting_obligated)
VALUES (1, 'Comercial Admin 1', 'Av. Principal 1', 0, 'RIMPE_NEGOCIO_POPULAR', 'PRUEBAS', FALSE);

-- Insert Company Settings for Tenant 2
INSERT INTO company_settings (tenant_id, name, address, tax_rate, sri_regime, sri_environment, accounting_obligated)
VALUES (2, 'Distribuidora Admin 2', 'Calle Secundaria 2', 15, 'RIMPE_EMPRENDEDOR', 'PRUEBAS', TRUE);

-- Insert Users
-- Passwords are bcrypt hashes (cost 10). Default password for both is: password
-- Generate a new hash in PHP with: echo password_hash('TuContraseña', PASSWORD_BCRYPT);
INSERT INTO users (tenant_id, email, password_hash, name, role)
VALUES (1, 'admin1@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Uno', 'admin');

INSERT INTO users (tenant_id, email, password_hash, name, role)
VALUES (2, 'admin2@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Dos', 'admin');

-- ══════════════════════════════════════════════════════════════
-- FIX: If you manually inserted users with plain-text passwords,
--      run this PHP snippet to get the correct bcrypt hash,
--      then UPDATE the password_hash column:
--
--  <?php echo password_hash('TuContraseña', PASSWORD_BCRYPT); ?>
--
--  UPDATE users SET password_hash = '<hash_generado>' WHERE email = 'tu@email.com';
-- ══════════════════════════════════════════════════════════════
