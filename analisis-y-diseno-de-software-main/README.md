# Aplicación Node.js con Docker y PostgreSQL

Este es un ejemplo de una aplicación Node.js usando Express, Docker y PostgreSQL. Incluye configuración para desarrollo y producción.

## Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [Node.js](https://nodejs.org/) (opcional, solo para desarrollo local)
- `curl` o cliente HTTP (para probar endpoints)

## Instalación

### 1. Descargar aplicación
En la página principal del repositorio se puede observar un botón verde que dice "<> Code" al clickearlo saldrá una opcion de "Download ZIP" una vez descargado extraer el archivo en una carpeta deseada

1. Deben navegar hasta  la carpeta llamada "analisis-y-diseno-de-software-main" y abrir la terminal dentro de ésta. Escribir el comando npm install

2. (les instalará las dependencias se suele demorar un poco la primera vez con esto levantan el proyecto)  
docker compose-up -d
docker compose up
A través de la aplicación docker se podrá ingresar o sino directamente por el link http://localhost:3000

(para detener los contenedores)  
docker compose down -v


Si estas instrucciones fallan, Repetir proceso pero desde el branch "OnlyDownload" y obviar el npm-install
si no les ejecuta asegurense de estar en la carpeta correcta  
si trabajan desde windows deben tener instalado WSL2 y tenerlo activado en docker desktop  
esto se puede verificar en  
Configuración   
-Resources  
  -Configure which WSL 2 distros you want to access Docker from. (esto debe estar activo)  
  -Enable integration with additional distros:(esto debe estar activo)  

# Comandos útiles 

Pueden levantar el proyecto sin volver a construir las imágenes con el siguiente comando:
  - docker compose up
Si quieren levantar el proyecto en segundo plano pueden usar:
  - docker compose up -d
Para ver el estado de los servicios que están corriendo:
  - docker compose ps
Para ver los logs en tiempo real de todos los servicios:
  - docker compose logs -f
O de un servicio específico:
  - docker compose logs -f nombre_servicio
Para reiniciar un servicio específico:
  - docker compose restart nombre_servicio
Para detener todos los contenedores sin eliminar volúmenes:
  - docker compose down



