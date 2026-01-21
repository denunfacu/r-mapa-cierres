# ⚠️ INSTRUCCIONES PARA PREPARAR GIT

Debido a que las herramientas de desarrollo de Xcode no están completamente instaladas, necesitas hacer esto manualmente en Terminal.

---

## 📋 PASOS A SEGUIR

### PASO 1: Instalar Herramientas de Desarrollo (Una sola vez)

Abre Terminal (⌘ + Espacio, escribe "terminal")

Ejecuta este comando:

```bash
xcode-select --install
```

Cuando aparezca un diálogo:
- ✅ Click en **"Install"**
- Espera a que termine (puede tardar 10-15 minutos)
- ✅ Click en "Agree" en los términos de licencia
- Espera a que se complete la instalación

---

### PASO 2: Configurar Git (Una sola vez)

Una vez instalado, en Terminal ejecuta:

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu.email@gmail.com"
```

Ejemplo:
```bash
git config --global user.name "Facundo Denunciato"
git config --global user.email "facundo@example.com"
```

---

### PASO 3: Preparar el Repositorio

Copia y pega estos comandos en Terminal (uno por uno, esperando a que termine cada uno):

```bash
cd /Users/facudenunciato/mapa-cierres
```

Verificar que git está disponible:
```bash
git --version
```

Inicializar repositorio:
```bash
git init
```

Agregar todos los archivos:
```bash
git add .
```

Ver estado (debería mostrar todos los archivos en verde):
```bash
git status
```

Hacer commit inicial:
```bash
git commit -m "Initial commit - Mapa de Cierres lista para producción"
```

Cambiar rama a main:
```bash
git branch -M main
```

Verificar que todo está bien:
```bash
git log
```

---

## ✅ SI TERMINASTE TODO LO ANTERIOR

Deberías ver algo como:

```
commit 1a2b3c4d... (HEAD -> main)
Author: Tu Nombre <tu.email@gmail.com>
Date:   Mon Jan 20 12:00:00 2026 +0000

    Initial commit - Mapa de Cierres lista para producción

 create mode 100644 .gitignore
 create mode 100644 COMIENZA_AQUI.md
 ... (más archivos)
```

---

## 🚀 PRÓXIMO PASO: Crear Repositorio en GitHub

Una vez que git está preparado localmente:

1. Ve a https://github.com/new
2. Crea un repositorio llamado **"mapa-cierres"**
3. **NO** hagas nada en el repositorio, solo créalo vacío
4. Copia la URL que te muestra GitHub (será algo como: `https://github.com/TU_USUARIO/mapa-cierres.git`)

---

## 🔗 CONECTAR CON GITHUB

Una vez que tengas el repo en GitHub, en Terminal ejecuta:

```bash
cd /Users/facudenunciato/mapa-cierres

# Conectar con GitHub (reemplaza la URL con la tuya)
git remote add origin https://github.com/TU_USUARIO/mapa-cierres.git

# Subir el código
git push -u origin main
```

---

## 🎯 CUANDO HAYAS HECHO TODO

Tu código estará en GitHub y listo para:

1. ✅ Crear cuenta en Render
2. ✅ Conectar el repositorio de GitHub
3. ✅ Deployar automáticamente

---

## 📞 Si Algo Falla

Si ves algún error, intenta:

```bash
# Ver configuración actual
git config --list

# Ver estado del repositorio
git status

# Ver commits
git log --oneline
```

Si ves "fatal: not a git repository", significa que no ejecutaste `git init` correctamente.

---

**¡Ejecuta estos pasos en Terminal y me avisas cuando termines!**
