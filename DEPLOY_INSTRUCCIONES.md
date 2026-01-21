# 🚀 Instrucciones de Deploy a Render

## Paso 1: Preparar GitHub

```bash
cd /Users/facudenunciato/mapa-cierres

# Inicializar git si no existe
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"

# Cambiar a rama main
git branch -M main

# Añadir repositorio remoto
git remote add origin https://github.com/TU_USUARIO/mapa-cierres.git

# Subir código
git push -u origin main
```

## Paso 2: Crear Cuenta en Render

1. Ir a https://render.com
2. Registrarse con GitHub
3. Autorizar Render a acceder a tus repositorios

## Paso 3: Deploy del Backend

1. En Render → **New +** → **Web Service**
2. Conectar repositorio `mapa-cierres`
3. Configurar:
   - **Name**: `mapa-cierres`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Select **Node**

## Paso 4: Crear Persistencia de Datos

1. En el dashboard del Web Service → **Disks**
2. Crear nuevo Disk:
   - **Name**: `data`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB

## Paso 5: Variables de Entorno

En tu Web Service → **Environment**:

```
NODE_ENV=production
DB_PATH=/var/data/cierres.db
PORT=3000
```

## Paso 6: Obtener URL Pública

Una vez deployado:
- Render te dará una URL como: `https://mapa-cierres.onrender.com`
- Tu API estará en: `https://mapa-cierres.onrender.com/api`

## Paso 7: Verificar que Funciona

```bash
# Desde tu navegador:
https://mapa-cierres.onrender.com
```

---

## ⚠️ Notas Importantes

- **BD Persistente**: Los datos se guardan en `/var/data/cierres.db`
- **Fotos**: Se almacenan en `/var/data/uploads/`
- **Cold Starts**: El primer acceso puede tardar ~30 segundos
- **Gratuito**: Render puede pausar la aplicación si no hay actividad por 15 min (se reinicia al acceder)

---

## Troubleshooting

### La BD se borra al reiniciar
✓ Asegúrate de que el Disk está creado y montado en `/var/data`

### Las fotos no se guardan
✓ Verifica que el Disk tiene espacio suficiente

### Error de "Can't connect to API"
✓ Espera a que Render termina el deploy (status debe ser "live")
✓ Verifica que las URLs en main.js están correctas

