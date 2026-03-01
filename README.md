# Sistema de Punto de Venta (POS)

Sistema de gestión de inventario y ventas multi-tenant con integración de Facturación Electrónica SRI, desarrollado para ferreterías y negocios de repuestos automotrices en Ecuador.

**Desplegado en:** [pernosycauchosjm.com](https://pernosycauchosjm.com)

---

## Tecnologías

| Capa | Stack |
|------|-------|
| Frontend | React 19.2 + TypeScript 5.9 + Vite 7.2 |
| Estilos | Tailwind CSS 3.4 |
| Routing | React Router 7.13 |
| Backend | PHP puro con PDO (sin framework) |
| Base de datos | MySQL 5.7+ |
| Autenticación | JWT custom (HMAC-SHA256) con blacklist |
| Iconos | Lucide React |
| Notificaciones | React Hot Toast |
| Impresión | react-to-print (80mm térmico) |
| Firma electrónica | xmlseclibs (PKCS#12 / RSA-SHA1) |

---

## Características

### Punto de Venta (POS)
- Búsqueda y filtrado de productos por nombre y categoría
- Carrito con validación de stock en tiempo real
- Soporte para **Ticket** (sin IVA) y **Factura** (con IVA configurable)
- Selección de cliente o venta a Consumidor Final
- IVA calculado **en el servidor** (nunca se confía en el cliente)
- Precios validados server-side para evitar manipulación

### Inventario
- CRUD de productos con paginación
- Ajuste de stock (entradas / salidas)
- Categorías personalizables por empresa
- **Imágenes de productos**: subida directa desde el formulario (JPEG/PNG/WebP, máx. 2MB)

### Clientes
- Registro con cédula, RUC o pasaporte
- Historial de compras con total acumulado

### Facturación Electrónica SRI (Ecuador)
- Generación de XML firmado con certificado PKCS#12
- Envío al webservice SRI (ambiente pruebas / producción)
- Soporte para regímenes: **RIMPE Negocio Popular**, **RIMPE Emprendedor**, **General**
- IVA dinámico según tasa configurada (0%, 8%, 12%, 15%)
- Serie (`establecimiento` + `punto de emisión`) configurable por empresa
- Mapeo de método de pago a código SRI (efectivo, tarjeta, transferencia…)
- Página de **Facturas Emitidas** con estado SRI, clave de acceso y reenvío manual

### Historial de Ventas
- Paginación server-side
- Filtros por fecha (hoy, ayer, 7 días, mes, rango personalizado)
- Búsqueda por cliente o número de venta
- Impresión de comprobante (ticket térmico 80mm o PDF)

### Configuración
- Datos de empresa (nombre, dirección, RUC, logo)
- Tasa de IVA, moneda, régimen SRI
- Establecimiento y punto de emisión SRI
- Gestión de cajeros (crear / eliminar usuarios)
- Cambio de contraseña con verificación

### Seguridad
- JWT con `jti` único por token — **invalidación en logout** mediante blacklist en BD
- Rate limiting en login y registro (5 intentos / 15 min por IP)
- Validación de email con `FILTER_VALIDATE_EMAIL`
- Todas las queries con PDO parametrizado (sin SQL injection)
- Contraseñas con bcrypt (cost 10)
- CORS con whitelist por origen (no wildcard)
- Aislamiento multi-tenant en cada query

---

## Estructura del Proyecto

```
sistemaWeb/
├── public/
│   ├── api/                    # Backend PHP
│   │   ├── config.php          # Conexión DB + helpers
│   │   ├── cors.php            # CORS whitelist
│   │   ├── SimpleJWT.php       # JWT con jti único
│   │   ├── auth_middleware.php # Validación + blacklist check
│   │   ├── login.php           # POST /login (rate limited)
│   │   ├── logout.php          # POST /logout (revoca token)
│   │   ├── register.php        # POST /register (rate limited)
│   │   ├── inventory.php       # CRUD /inventory + image_path
│   │   ├── upload-image.php    # POST /upload-image (multipart)
│   │   ├── categories.php      # CRUD /categories
│   │   ├── customers.php       # CRUD /customers
│   │   ├── users.php           # CRUD /users
│   │   ├── sales.php           # POST + GET /sales (paginado, filtros)
│   │   ├── settings.php        # GET + POST /settings
│   │   ├── sri-status.php      # GET /sri-status
│   │   ├── sri-upload.php      # POST /sri-upload
│   │   └── classes/
│   │       └── SriService.php  # XML + firma + envío SRI
│   └── uploads/
│       └── products/           # Imágenes de productos (auto-creado)
├── src/
│   ├── api/http.ts             # Cliente HTTP centralizado
│   ├── context/
│   │   ├── AuthContext.tsx     # Auth + logout con revocación
│   │   ├── CompanyContext.tsx  # Settings de empresa
│   │   └── CartContext.tsx     # Carrito de compras
│   ├── hooks/
│   │   ├── useInventory.ts
│   │   ├── useCategories.ts
│   │   ├── useCustomers.ts
│   │   └── useSales.ts
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── POS.tsx
│   │   ├── Inventory.tsx       # Con subida de imágenes
│   │   ├── Customers.tsx
│   │   ├── SalesHistory.tsx
│   │   ├── Facturas.tsx        # Facturas electrónicas + SRI
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── ProductCard.tsx     # Muestra imagen si disponible
│   │   ├── CartPanel.tsx
│   │   ├── CheckoutModal.tsx
│   │   ├── Receipt.tsx         # Comprobante 80mm para impresión
│   │   └── layout/
│   └── types/models.ts
├── database.sql                # Schema completo + seed data
├── .env.example
└── package.json
```

---

## Instalación

### Requisitos
- Node.js 18+ (para build del frontend)
- PHP 8.1+ con extensiones: `pdo_mysql`, `openssl`, `soap`, `fileinfo`
- MySQL 5.7+ / MariaDB 10.4+
- Composer (para xmlseclibs)

### 1. Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Base de datos
DB_HOST=localhost
DB_NAME=pos_ferreteria
DB_USER=root
DB_PASS=

# Frontend URL (para CORS)
FRONTEND_URL=https://tudominio.com

# JWT — mínimo 32 caracteres, genera uno seguro
JWT_SECRET=cambia_esto_por_un_secreto_de_64_caracteres_minimo

# SRI
SRI_ENV=1                          # 1=Pruebas, 2=Producción
SRI_RUC=9999999999999              # RUC de la empresa
SRI_FIRMA_PATH=/ruta/a/firma.p12   # Ruta al certificado PKCS#12
SRI_FIRMA_PASS=contraseña_firma    # Contraseña del certificado

# Frontend
VITE_API_URL=https://tudominio.com/api
```

### 2. Base de datos

```bash
mysql -u root -p < database.sql
```

Si la base de datos ya existe y solo necesitas las nuevas columnas:

```sql
-- Índices de rendimiento
ALTER TABLE products   ADD INDEX idx_tenant_category (tenant_id, category_id);
ALTER TABLE sales      ADD INDEX idx_tenant_date     (tenant_id, created_at);
ALTER TABLE sale_items ADD INDEX idx_sale            (sale_id);

-- Imágenes de productos
ALTER TABLE products ADD COLUMN image_path VARCHAR(500) NULL;

-- SRI: establecimiento y punto de emisión
ALTER TABLE company_settings ADD COLUMN sri_establecimiento VARCHAR(3) DEFAULT '001';
ALTER TABLE company_settings ADD COLUMN sri_punto_emision   VARCHAR(3) DEFAULT '001';

-- Blacklist de tokens JWT (logout seguro)
CREATE TABLE IF NOT EXISTS token_blacklist (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    jti        VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE KEY uk_jti (jti),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Dependencias PHP

```bash
composer install
```

### 4. Frontend

```bash
npm install
npm run build   # Genera dist/ para producción
npm run dev     # Servidor de desarrollo
```

### 5. Directorio de uploads (cPanel / servidor)

Asegúrate de que el directorio `public/uploads/products/` tenga permisos de escritura:

```bash
mkdir -p public/uploads/products
chmod 755 public/uploads/products
```

---

## Despliegue en cPanel

1. Sube el contenido de `dist/` al `public_html` (o subdirectorio correspondiente)
2. Sube `public/api/` a `public_html/api/`
3. Sube `public/uploads/` a `public_html/uploads/`
4. Sube `vendor/` a la raíz (fuera de `public_html`)
5. Sube `.env` a la raíz (fuera de `public_html`)
6. Importa `database.sql` en phpMyAdmin
7. Ejecuta las migraciones de la sección anterior si actualizas una instalación existente

---

## API — Endpoints principales

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/login.php` | Iniciar sesión | No |
| POST | `/api/logout.php` | Cerrar sesión (revoca token) | Sí |
| POST | `/api/register.php` | Registrar usuario | Admin |
| GET/POST | `/api/inventory.php` | Productos CRUD | Sí |
| POST | `/api/upload-image.php` | Subir imagen de producto | Admin |
| GET/POST | `/api/customers.php` | Clientes CRUD | Sí |
| GET/POST | `/api/sales.php` | Ventas + historial paginado | Sí |
| GET/POST | `/api/settings.php` | Configuración de empresa | Admin |
| POST | `/api/sri-upload.php` | Enviar factura al SRI | Admin |
| GET | `/api/sri-status.php` | Estado de configuración SRI | Admin |

**Parámetros de `/api/sales.php` (GET):**
```
?page=1&limit=10&search=nombre&document_type=factura&date_from=2025-01-01&date_to=2025-12-31
```

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total: inventario, ventas, clientes, configuración, usuarios |
| `cashier` | Solo POS, historial de ventas y clientes |

---

## Configuración SRI

En **Ajustes → SRI** configura:

| Campo | Descripción |
|-------|-------------|
| Régimen | RIMPE Negocio Popular / RIMPE Emprendedor / General |
| Ambiente | Pruebas (1) o Producción (2) |
| Establecimiento | 3 dígitos, ej: `001` |
| Punto de Emisión | 3 dígitos, ej: `001` |
| Tasa IVA | 0%, 8%, 12% o 15% (se mapea automáticamente al código SRI) |

El certificado `.p12` y su contraseña se configuran en el `.env` del servidor.

---

## Changelog

### v2.0 — Refactorización y hardening de seguridad

**Seguridad**
- JWT con `jti` único por token: al hacer logout el token se añade a una blacklist en BD y queda inutilizable aunque no haya expirado
- Nuevo endpoint `POST /api/logout.php`
- Rate limiting en `/api/register.php` (mismo patrón que login: 5 intentos/15 min por IP)
- Validación de email con `FILTER_VALIDATE_EMAIL` en registro (antes solo sanitizaba)
- `auth_middleware.php` verifica la blacklist en cada request autenticado

**Correcciones críticas**
- `customerId` en POS ahora envía `null` en lugar de `undefined` para ventas sin cliente
- `useSales.ts`: eliminado el fallback `id || 0` para clientes — ya no aparecen IDs inválidos en el historial
- `AuthContext.signUp()` ahora despacha `auth:login` tras registro para cargar settings correctamente

**Rendimiento — Base de Datos**
- Añadidos 3 índices compuestos: `idx_tenant_category`, `idx_tenant_date`, `idx_sale`
- Las consultas de historial de ventas y productos pasan de O(n) a O(log n)

**Funcionalidades completadas**

*SRI — Facturación Electrónica:*
- Serie (`establecimiento` + `punto de emisión`) se lee desde `company_settings` — ya no está hardcodeada como `001001`
- IVA calculado desde la tasa real de la empresa; mapeado al código SRI correcto (0→`'0'`, 12→`'2'`, 15→`'4'`)
- Método de pago mapeado al código SRI (efectivo→`01`, tarjeta crédito→`19`, débito→`16`, transferencia→`20`)
- `obligadoContabilidad` se lee del campo `accounting_obligated` de la empresa
- Nuevos campos en `company_settings`: `sri_establecimiento`, `sri_punto_emision`

*Imágenes de productos:*
- Nuevo endpoint `POST /api/upload-image.php`: valida tipo MIME real (no solo extensión), máx. 2MB
- `inventory.php` guarda y actualiza `image_path`
- Formulario de inventario con selector de archivo, preview inmediato y subida asíncrona
- `ProductCard` muestra miniatura si el producto tiene imagen
- Nueva columna `image_path` en tabla `products`

*Página Facturas Emitidas:*
- Filtra correctamente solo ventas de tipo `factura` (antes mostraba todos los documentos)
- Filtros de fecha (hoy/ayer/semana/mes/rango) ahora se procesan en el servidor
- `sales.php` soporta nuevos parámetros: `document_type`, `date_from`, `date_to`

*Impresión de comprobantes:*
- `Receipt.tsx` ahora muestra el monto de IVA real (prop `tax` estaba declarada pero no usada)

---

**Desarrollado para Pernos y Cauchos JM** — Soluciones tecnológicas para el crecimiento automotriz.
