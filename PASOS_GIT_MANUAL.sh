#!/bin/zsh

# 🔧 INSTRUCCIONES PARA PREPARAR GIT MANUALMENTE

# Abre Terminal en tu Mac y ejecuta estos comandos uno por uno:

# ═══════════════════════════════════════════════════════════════════════════════

# 1️⃣ ENTRAR A LA CARPETA DEL PROYECTO
cd /Users/facudenunciato/mapa-cierres

# 2️⃣ INSTALAR GIT (si aparece diálogo, acepta)
# En Terminal, ejecuta:
# xcode-select --install
# Luego espera a que termine la instalación y acepta los términos

# 3️⃣ UNA VEZ INSTALADO GIT, EJECUTA ESTOS COMANDOS EN ORDEN:

# Inicializar repositorio
git init

# Configurar usuario (reemplaza con tu nombre y email)
git config user.name "Tu Nombre"
git config user.email "tu.email@gmail.com"

# Agregar todos los archivos
git add .

# Ver estado (esto debería mostrar todos los archivos listos)
git status

# Hacer commit inicial
git commit -m "Initial commit - Mapa de Cierres lista para producción"

# Cambiar a rama main (si no está ya)
git branch -M main

# Ver logs para confirmar
git log

# ═══════════════════════════════════════════════════════════════════════════════

# LISTO PARA PUSHEAR A GITHUB

# Cuando estés en GitHub (siguiente paso):
# git remote add origin https://github.com/TU_USUARIO/mapa-cierres.git
# git push -u origin main

# ═══════════════════════════════════════════════════════════════════════════════
