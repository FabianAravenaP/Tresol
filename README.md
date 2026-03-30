# Tresol ERP - Gestión Logística Avanzada

Sistema integral de Planificación de Recursos Empresariales (ERP) diseñado específicamente para la gestión de servicios de transporte, logística y disposición de residuos.

## 🚀 Tecnologías Core
- **Frontend**: Next.js (App Router) + React 19
- **Backend-as-a-Service**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Estilos**: Tailwind CSS 4 + Lucide React para iconografía.
- **Componentes**: Arquitectura basada en Radix UI y animaciones de alto rendimiento.

## 🏗️ Estructura de Módulos

### 1. Panel de Operaciones (CORE)
- **Planificación**: Calendario interactivo para asignación de rutas y conductores.
- **Flota en Vivo**: Monitoreo de estatus operativo de vehículos.
- **GPS Tracking**: Seguimiento en tiempo real de rutas activas y cálculo automático de kilometraje.

### 2. Administración Maestro
- **Gestión de Personal**: Control de conductores y personal administrativo.
- **Gestión de Flota**: Administración técnica de camiones y equipos.
- **Analíticas**: Inteligencia de negocios y exportación de reportes consolidados.

### 3. Ecosistema Móvil
- Aplicación dedicada para conductores con flujo de estados de servicio (Pendiente -> En Ruta -> Completado) y captura de firmas digitales.

### 4. Soporte Operativo
- **Digitalizador**: Gestión de certificados y documentos de pesaje.
- **Portería**: Control de accesos y pesajes de entrada/salida.

## ⚙️ Configuración y Desarrollo

### Lanzamiento Local
```bash
npm run dev
```

### Sincronización Realtime
El sistema utiliza canales de Supabase para actualización instantánea en todos los dispositivos conectados sin necesidad de recarga manual.

---
**Tresol ERP** - *Potenciando la eficiencia logística.*
