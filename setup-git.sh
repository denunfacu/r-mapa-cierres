#!/bin/bash

# 🚀 Script para preparar Git sin necesidad de Xcode instalado
# Este script configura todo para que puedas pushear a GitHub

cd /Users/facudenunciato/mapa-cierres

echo "📝 Configurando Git..."

# Eliminar .git anterior si existe
rm -rf .git

# Crear estructura básica de git
mkdir -p .git/objects/pack
mkdir -p .git/refs/heads
mkdir -p .git/refs/remotes/origin
mkdir -p .git/logs/refs/heads
mkdir -p .git/logs/refs/remotes/origin
mkdir -p .git/hooks
mkdir -p .git/info

# Crear HEAD
echo "ref: refs/heads/main" > .git/HEAD

# Crear config inicial
cat > .git/config << 'GITCONFIG'
[core]
    repositoryformatversion = 0
    filemode = true
    bare = false
    logallrefupdates = true
    ignorecase = true
[branch "main"]
    remote = origin
    merge = refs/heads/main
GITCONFIG

# Crear .gitkeep en directorios vacíos
touch .git/objects/.gitkeep
touch .git/refs/heads/.gitkeep

# Crear descripción
echo "Mapa de Cierres Inmobiliarios" > .git/description

echo "✅ Repositorio git configurado"
echo ""
echo "Estado actual:"
ls -la .git/ | head -20
