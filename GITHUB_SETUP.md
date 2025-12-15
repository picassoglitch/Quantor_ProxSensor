# Configuración de GitHub para Quantor_Prox

## Pasos para crear el repositorio y hacer push

### Opción 1: Usando GitHub CLI (si lo tienes instalado)

```bash
gh repo create Quantor_Prox --public --source=. --remote=origin --push
```

### Opción 2: Crear manualmente en GitHub

1. **Ir a GitHub**: https://github.com/new
2. **Nombre del repositorio**: `Quantor_Prox`
3. **Descripción**: "WiFi People Counter Dashboard with Admin Panel - Quantor"
4. **Visibilidad**: Público o Privado (según prefieras)
5. **NO inicializar** con README, .gitignore o licencia (ya los tenemos)
6. **Click en "Create repository"**

### Opción 3: Usar los comandos siguientes

Después de crear el repositorio en GitHub, ejecuta:

```bash
cd "C:\Users\USER\Desktop\TBM Sensor"
git remote add origin https://github.com/TU-USUARIO/Quantor_Prox.git
git branch -M main
git push -u origin main
```

**Nota**: Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub.

## Si necesitas autenticación

Si GitHub te pide autenticación, puedes usar:
- **Personal Access Token** (recomendado)
- **GitHub CLI** (`gh auth login`)

