#!/bin/bash

# Script de inicio para Render
echo "Starting GestorTareas API..."

# Verificar que estamos en el directorio correcto
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Aplicar migraciones (opcional, ya que se hace automáticamente en Program.cs)
echo "Applying database migrations..."
dotnet ef database update --project . --startup-project . || echo "Migrations will be applied automatically by the application"

# Iniciar la aplicación
echo "Starting application on port $PORT..."
dotnet GestorTareas.API.dll --urls "http://0.0.0.0:$PORT" 