# Sistema de Punto de Venta (POS)

Sistema de gestión de inventario y ventas desarrollado especialmente para ferreterías y negocios de repuestos automotrices.

## 🚀 Tecnologías

*   **Frontend**: React 18 + TypeScript + Vite
*   **Backend**: PHP 8.x (API REST)
*   **Base de Datos**: MySQL
*   **Estilos**: Tailwind CSS 3.x
*   **Iconos**: Lucide React
*   **Routing**: React Router v6
*   **Notificaciones**: React Hot Toast

## ✨ Características Principales

*   **Gestión de Inventario**: Altas, bajas y modificación de productos (pernos, herramientas, repuestos, neumáticos).
*   **Punto de Venta (POS)**: Interfaz rápida optimizada para ferreterías con carrito, cálculo de cambio y conversión de divisas en tiempo real.
*   **Gestión de Clientes**: Registro detallado de clientes para facturación.
*   **Historial de Ventas**: Registro inalterable de transacciones y cierres de caja.
*   **Configuración del Negocio**:
    *   Gestión de categorías personalizadas.
    *   Configuración fiscal y datos de empresa.
    *   **Moneda Dinámica**: Soporte para tasa de cambio en dólares y moneda local.
*   **Autenticación y Seguridad**:
    *   Arquitectura JWT (JSON Web Tokens) segura.
    *   Encriptación de contraseñas de grado industrial.
    *   Sistema de roles (Administrador/Cajero).

## 🎨 Diseño de Interfaz

*   **Diseño Moderno**: Interfaz limpia y profesional con elementos redondeados y colores pasteles.
*   **Modo Claro**: Diseño optimizado para visualización en modo claro con excelente contraste.
*   **Responsive**: Adaptable a diferentes tamaños de pantalla (desktop, tablet, móvil).
*   **Componentes Reutilizables**: Tarjetas, tablas, modales y formularios con diseño consistente.
*   **Animaciones Suaves**: Transiciones y efectos hover para mejor experiencia de usuario.
*   **Tipografía**: Uso de la fuente Inter para una apariencia moderna y legible.

## 🛠️ Instalación y Configuración

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (usa `.env.example` como base):
```env
DB_HOST=db
DB_NAME=pos_ferreteria
DB_USER=root
DB_PASS=
JWT_SECRET=tu_secreto_super_seguro
```

### 2. Despliegue con Docker
```bash
# Levantar infraestructura (DB + PHP + PMA)
docker-compose up -d
```

### 3. Frontend Development
```bash
npm install
npm run dev
```

---

## 📱 Guía de Usuario

### Punto de Venta (POS)
1. **Selección**: Escanea el código o busca el producto manualmente.
2. **Carrito**: Ajusta las cantidades. El sistema calculará impuestos y cambio.
3. **Facturación**: Selecciona un cliente registrado o vende a "Consumidor Final".
4. **Impresión**: Genera el ticket térmico al confirmar la venta.

### Gestión de Inventario
- Visualiza productos con **bajo stock** (resaltados automáticamente).
- Edita precios de forma rápida para pernos según medida o peso.

---

## 🔧 Mantenimiento

- **Logs del Backend**: `docker-compose logs -f pos-app`
- **Backup de BD**: `docker exec pos-db /usr/bin/mysqldump -u root pos_ferreteria > fallback.sql`
- **Actualización**: Ejecuta `npm run build` antes de desplegar cambios en el frontend.

---

**Desarrollado para Pernos y Cauchos JM** 🏎️🔧
*Soluciones tecnológicas para el crecimiento automotriz.*
