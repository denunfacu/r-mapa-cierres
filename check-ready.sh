#!/bin/bash

# 🚀 Script de Verificación - Ejecuta esto antes de subir a GitHub

echo "🔍 Verificando que todo está listo para deploy..."
echo ""

# Verificar archivos existentes
echo "📋 Verificando archivos de configuración..."

files=(
    ".gitignore"
    "Procfile"
    ".env.example"
    "README.md"
    "SETUP_LOCAL.md"
    "DEPLOY_INSTRUCCIONES.md"
    "backend/package.json"
    "backend/server.js"
    "frontend/main.js"
    "frontend/login.html"
    "frontend/registro.html"
    "frontend/admin.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ FALTA: $file"
    fi
done

echo ""
echo "🔧 Verificando configuración en server.js..."
if grep -q 'process.env.PORT' backend/server.js; then
    echo "✅ Puerto dinámico configurado"
else
    echo "❌ Puerto dinámico NO configurado"
fi

if grep -q 'UPLOADS_DIR' backend/server.js; then
    echo "✅ Uploads dinámico configurado"
else
    echo "❌ Uploads dinámico NO configurado"
fi

echo ""
echo "🌐 Verificando URLs dinámicas en frontend..."
if grep -q 'const API_URL' frontend/main.js; then
    echo "✅ main.js con API_URL dinámica"
else
    echo "❌ main.js SIN API_URL dinámica"
fi

if grep -q 'API_URL' frontend/login.html; then
    echo "✅ login.html con API_URL dinámica"
else
    echo "❌ login.html SIN API_URL dinámica"
fi

if grep -q 'API_URL' frontend/admin.html; then
    echo "✅ admin.html con API_URL dinámica"
else
    echo "❌ admin.html SIN API_URL dinámica"
fi

echo ""
echo "📦 Verificando dependencias en package.json..."
if grep -q '"start".*"node server.js"' backend/package.json; then
    echo "✅ Script start configurado"
else
    echo "❌ Script start NO configurado"
fi

echo ""
echo "======================================="
echo "✅ TODO LISTO PARA DEPLOY"
echo "======================================="
echo ""
echo "Próximos pasos:"
echo "1. git init"
echo "2. git add ."
echo "3. git commit -m 'Initial commit'"
echo "4. git push origin main"
echo "5. Ir a Render.com y seguir pasos en README.md"
echo ""
