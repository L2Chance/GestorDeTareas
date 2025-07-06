# Usar la imagen oficial de .NET 9.0
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Usar la imagen de SDK para compilar
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar archivos del proyecto
COPY ["GestorTareas.API.csproj", "./"]
RUN dotnet restore "GestorTareas.API.csproj"

# Copiar todo el código fuente
COPY . .
RUN dotnet build "GestorTareas.API.csproj" -c Release -o /app/build

# Publicar la aplicación
FROM build AS publish
RUN dotnet publish "GestorTareas.API.csproj" -c Release -o /app/publish

# Imagen final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Crear directorio para la base de datos
RUN mkdir -p /app/Data

# Exponer puerto (Render usa $PORT)
EXPOSE 8080

# Comando de inicio con configuración para Render
ENTRYPOINT ["dotnet", "GestorTareas.API.dll", "--urls", "http://0.0.0.0:8080"] 