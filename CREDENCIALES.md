# 🔐 Credenciales y Configuración Inicial

## 👤 Cuentas Preconfiguradas

### Admin (Creado Automáticamente)
```
Email: admin@inmobiliaria.local
Contraseña: AdminSecure2024!
Rol: admin
Permisos: Cargar (puede crear cierres)
Estado: activo (habilitado)
```

⚠️ **IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login en producción.

---

## 🆕 Crear Nuevas Cuentas

### Proceso Normal
1. Registrarse en `/registro`
2. El admin debe aprobar la cuenta
3. El usuario recibe acceso

### Permisos Disponibles
- **Rol**:
  - `admin`: Panel de administración
  - `user`: Solo visualización

- **Permiso Nivel**:
  - `ver`: Solo ver propiedades
  - `cargar`: Cargar y editar cierres

---

## ⚙️ Configuración por Entorno

### Local (desarrollo)
```
PORT: 3000
NODE_ENV: development
DB_PATH: ./cierres.db
UPLOADS_DIR: ./uploads
SECRET_KEY: facuautoriza
```

### Render (producción)
```
PORT: (asignado automáticamente)
NODE_ENV: production
DB_PATH: /var/data/cierres.db
UPLOADS_DIR: /var/data/uploads
SECRET_KEY: facuautoriza
```

---

## 🔑 Variables de Entorno Necesarias

```env
# Ambiente
NODE_ENV=production

# Server
PORT=3000

# Database
DB_PATH=/var/data/cierres.db

# Uploads
UPLOADS_DIR=/var/data/uploads

# Security
SECRET_KEY=facuautoriza
```

---

## 📋 Checklist Post-Deploy

- [ ] Acceder a https://tu-dominio.onrender.com
- [ ] Loguear con admin@inmobiliaria.local / AdminSecure2024!
- [ ] Cambiar contraseña del admin
- [ ] Crear cuenta de prueba
- [ ] Aprobar cuenta de prueba desde admin
- [ ] Cargar un cierre de prueba
- [ ] Verificar que aparezca en el mapa
- [ ] Verificar que la foto se carga
- [ ] Probar filtros
- [ ] Probar reportes
- [ ] Loguear con usuario de prueba
- [ ] Verificar permisos correctos

---

## 🔧 Cambiar Contraseña del Admin

1. Loguear con `admin@inmobiliaria.local`
2. Ir al panel admin
3. Buscar a Admin en la tabla de usuarios
4. (Nota: actualmente no hay UI para cambiar password - se hace directamente en BD)

### Cambiar en Base de Datos (si es necesario)

```bash
# Acceder a Render Console y ejecutar:
# Generar nuevo hash con:
# node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NuevaPassword', 10).then(h => console.log(h));"
# Luego actualizar en la BD
```

---

## 📊 Datos de Ejemplo

Para probar la app con datos, puedes:

1. **Cargar manualmente** desde el formulario
2. **Importar datos** (no hay script de migración, pero puedes agregarlo)

---

## 🚨 Problemas Comunes

### "Email ya registrado"
→ El email ya existe. Usa otro o borra la cuenta desde admin.

### "Cuenta no aprobada"
→ El admin no ha aprobado tu registro. Avísale.

### "Sesión expirada"
→ El token de 24 horas caducó. Loguéate nuevamente.

### "Acceso denegado"
→ No tienes permisos. Pídele al admin que aumente tu nivel.

---

## 🔄 Operaciones de Mantenimiento

### Respaldar Base de Datos
1. Ir a Render Dashboard
2. Disk → Descargar archivo de BD

### Restaurar Base de Datos
1. Eliminar cierres.db existente
2. Subir el backup
3. Reiniciar servicio

### Eliminar Usuario
1. Panel Admin
2. Buscar usuario
3. Click en botón de eliminar
4. Se borran todos sus cierres también

---

## 📞 Contacto

Para cambios en permisos o detalles de configuración, contacta al administrador.

---

**Última actualización**: enero 2026
