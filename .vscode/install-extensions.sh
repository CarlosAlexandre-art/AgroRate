#!/bin/bash
# Instala todas as extensões recomendadas para o ecossistema AgroRate/AgroOS/AgroCore
# Execute: bash .vscode/install-extensions.sh

EXTENSIONS=(
  "bradlc.vscode-tailwindcss"
  "Prisma.prisma"
  "dbaeumer.vscode-eslint"
  "eamodio.gitlens"
  "humao.rest-client"
  "usernamehw.errorlens"
  "mattpocock.ts-error-translator"
  "steoates.autoimport"
  "esbenp.prettier-vscode"
  "csstools.postcss"
  "figma.figma-vscode-extension"
  "ms-vscode.vscode-typescript-next"
  "formulahendry.auto-rename-tag"
  "christian-kohler.path-intellisense"
)

echo "Instalando ${#EXTENSIONS[@]} extensões..."
for ext in "${EXTENSIONS[@]}"; do
  echo "→ $ext"
  code --install-extension "$ext" --force
done
echo "✅ Todas as extensões instaladas!"
