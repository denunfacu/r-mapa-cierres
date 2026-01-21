# 🧪 Setup Local para Testing

Si quieres probar la app en tu computadora antes de deployar a Render:

## Requisitos

- Node.js 18+ instalado
- npm (viene con Node.js)

## Pasos

### 1. Instalar dependencias

```bash
cd /Users/facudenunciato/mapa-cierres/backend
npm install
```

### 2. Iniciar el servidor

```bash
npm start
# Debería aparecer: 🚀 Servidor en puerto 3000
```

### 3. Acceder a la app

Desde tu navegador:
```
http://localhost:3000
```

## Cuentas de prueba

**Admin (ya existe):**
- Email: `admin@inmobiliaria.local`
- Password: `AdminSecure2024!`

**Crear nuevas:**
- Registro en http://localhost:3000/registro
- El admin debe aprobar la cuenta antes de poder usarla

## Detener el servidor

Presiona `Ctrl+C` en la terminal

## Errores comunes

### "Cannot find module 'express'"
→ Ejecutaste `npm install` en backend/? Intenta de nuevo

### "Port 3000 already in use"
→ Otro programa usa el puerto. Cambia en server.js o cierra el otro programa

### "Database is locked"
→ Múltiples instancias de la app. Asegúrate de tener solo una corriendo

## Desarrollo con cambios automáticos

Para que recargue automáticamente al cambiar archivos:

```bash
npm install -g nodemon  # Solo primera vez
npm run dev
```

---

**¡Listo para deployar a Render!** Consulta README.md para la guía de deploy.
