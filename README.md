# 🚀 Mapa de Cierres Inmobiliarios - Guía de Deploy

Este proyecto está completamente preparado para ser subido a GitHub y deployado en Render sin necesidad de más cambios.

## ✅ Cambios Ya Realizados

✓ **Backend (server.js)**
- Puerto dinámico desde variables de entorno
- Rutas de uploads configurables
- Base de datos persistente en `/var/data`
- Variables de entorno para SECRET_KEY

✓ **Frontend (main.js, login.html, registro.html, admin.html)**
- Detecta automáticamente si es localhost o producción
- URLs dinámicas en todas las llamadas a fetch
- Compatible con cualquier dominio

✓ **Archivos de configuración**
- `.gitignore` - archivos a ignorar en git
- `Procfile` - instrucciones para Render
- `.env.example` - variables de ejemplo
- `package.json` - dependencias actualizadas

---

## 📋 Pasos para Deploy (Solo 5 minutos)

### 1. Subir a GitHub

```bash
cd /Users/facudenunciato/mapa-cierres

# Si aún no has inicializado git:
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"
git branch -M main

# Crear repositorio en GitHub primero, luego:
git remote add origin https://github.com/TU_USUARIO/mapa-cierres.git
git push -u origin main
```

### 2. Crear Cuenta en Render

1. Ir a https://render.com
2. Registrarse con GitHub
3. Autorizar a Render

### 3. Crear Web Service

1. Click en **New +** → **Web Service**
2. Buscar y seleccionar el repositorio `mapa-cierres`
3. Configurar:
   - **Name**: `mapa-cierres`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (o pago según necesites)

### 4. Crear Persistencia de Datos

En el mismo Web Service de Render:

1. Click en **Disks**
2. Click en **New Disk**
3. Configurar:
   - **Name**: `data`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB (suficiente para muchas fotos)

### 5. Configurar Variables de Entorno

En tu Web Service → **Environment** → agregar:

```
NODE_ENV=production
DB_PATH=/var/data/cierres.db
UPLOADS_DIR=/var/data/uploads
PORT=3000
SECRET_KEY=facuautoriza
```

### 6. Deploy Automático

Render hará el deploy automáticamente. Espera a que diga "live" en el dashboard.

---

## 🎯 Resultado Final

Una vez completado, tendrás:

- **URL pública**: `https://mapa-cierres.onrender.com`
- **Base de datos**: Persistente en disco
- **Fotos**: Almacenadas en `/var/data/uploads`
- **Usuarios**: Guardados en la BD con sus cierres
- **Panel Admin**: Totalmente funcional

---

## 🔐 Seguridad

- El proyecto está protegido por JWT (tokens)
- Las contraseñas se hashean con bcryptjs
- Las fotos se sirven desde el servidor
- La BD no es accesible públicamente

---

## ⚡ Cold Starts

Render puede pausar la app si no hay actividad en 15 minutos (plan free). 
Cuando alguien acceda, se reinicia automáticamente (tarda ~30 segundos la primera vez).

Para evitarlo, considera un plan pago o usa un servicio de uptime monitoring.

---

## 🐛 Troubleshooting

### "La BD se borra al reiniciar"
→ Verifica que el Disk esté montado en `/var/data`

### "Las fotos no se guardan"
→ Asegúrate que UPLOADS_DIR esté configurado en `/var/data/uploads`

### "Error de CORS"
→ El backend ya tiene CORS habilitado, no debería haber problemas

### "Cannot find module"
→ Espera a que termine el build. Si persiste, revisa la consola de Render

---

## 📱 Acceder desde cualquier lugar

Desde cualquier dispositivo (celular, tablet, otro servidor):

```
https://mapa-cierres.onrender.com
```

¡Listo! Tu app estará disponible para todo el mundo.

---

## 🔄 Hacer cambios futuros

Simplemente:
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Render detectará los cambios y hará re-deploy automáticamente.

---

**¿Preguntas? Revisa el archivo DEPLOY_INSTRUCCIONES.md para más detalles.**
