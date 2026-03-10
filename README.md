# 💬 [ChatApp] - Sistema de Chat en Tiempo Real

![Demo de la App](https://github.com/user-attachments/assets/b8dcc201-bb7e-44f7-a6e2-20cf905c134d)

> *Una aplicación Full Stack de mensajería instantánea con notificaciones de estado, presencia y gestión de grupos.*

## 🚀 Sobre el Proyecto

Este proyecto nació de la necesidad de entender a fondo la comunicación bidireccional en la web y resolver problemas complejos de UI/UX. No utiliza librerías de "caja negra" (como Firebase) para el chat, sino que implementa una arquitectura personalizada de WebSockets con STOMP sobre un backend robusto en Java.

## 🛠️ Stack Tecnológico

### Frontend
* **React + TypeScript (Vite):** Interfaz reactiva y tipado seguro.
* **TanStack Query (React Query):** Gestión avanzada del estado del servidor, caché de mensajes, sincronización e invalidación optimista.
* **Custom Hooks:** Lógica encapsulada para WebSockets (`useChatConnection`, `usePresencia`).
* **CSS Puro / CSS Modules:** Diseño limpio, responsive y con arquitectura "inmóvil" adaptada a navegadores móviles (usando `100dvh`).

### Backend
* **Java 17 + Spring Boot 3:** API REST y Servidor WebSocket.
* **Spring Security + JWT:** Autenticación y protección de rutas.
* **WebSockets (STOMP):** Gestión de eventos en tiempo real (Typing, Online/Offline, Read Receipts).
* **PostgreSQL:** Persistencia relacional compleja.
* **Redis:** Caché en memoria para optimización de consultas de alta frecuencia (Sidebar de chats).
* **Docker:** Contenerización (App, DB y Redis) para despliegue simplificado.

## ✨ Funcionalidades Clave

* **Comunicación en Tiempo Real:** Mensajería instantánea con latencia mínima.
* **Sistema de Presencia:** Indicador de "En línea" (verde) y "Última vez" preciso, con detección de desconexión abrupta.
* **Indicadores de Escritura (Typing...):** Feedback visual cuando otro usuario está escribiendo, optimizado con debounce en el cliente para no saturar la red.
* **Estados de Mensajería:** Doble check (Enviado, Entregado, Leído).
* **Gestión de Grupos:** Creación de grupos con validación de participantes únicos y roles de administrador.
* **UX Móvil Nativa:** Teclado virtual dinámico, scroll matemático y prevención de overscroll para simular el comportamiento exacto de una app instalada.

## 🧠 Desafíos Técnicos Superados

Durante el desarrollo, me enfrenté a retos arquitectónicos interesantes:

* **Sincronización de Estado y Caché:** Coordinación fluida entre llamadas REST (para cargar el historial desde PostgreSQL) y eventos WebSocket (para los mensajes nuevos), utilizando la caché de TanStack Query para no renderizar mensajes duplicados.
* **Race Conditions en React:** Implementación de referencias (`useRef`) y lógica de auto-reconexión para manejar caídas del socket sin bloquear el renderizado de la UI, asegurando que la aplicación se recupere sola de cortes de red.
* **Desafíos en Dispositivos Móviles:** Resolución de problemas estructurales en iOS y Android donde el teclado virtual rompía el layout. Se implementó una arquitectura de Dynamic Viewport (`100dvh`) para mantener el header fijo y gestionar el scroll internamente.
* **Consistencia de Datos:** Uso de `Set<Long>` en Java para evitar duplicados en la creación de grupos y manejo transaccional (`@Transactional`) para asegurar la integridad absoluta de la base de datos.
* **Optimización de Carga con Redis:** Implementación de caché en el backend (`@Cacheable`) para la carga del Sidebar de contactos. Esto reduce drásticamente las consultas a PostgreSQL en el endpoint más consultado de la app, gestionando la invalidación de la caché (`@CacheEvict`) de manera estratégica cuando el estado de los chats cambia.
* **Paginación Eficiente (Spring Boot + React):** Manejo de grandes volúmenes de datos en el historial de chat mediante paginación desde la base de datos en Java. Esto se integró en el frontend con el *infinite scroll* de TanStack Query, permitiendo al usuario scrollear hacia atrás en el tiempo de forma fluida sin colapsar la memoria del servidor ni del navegador.

## 📦 Instalación y Despliegue

```bash
# Clonar el repositorio
git clone [https://github.com/garin25/Chat.git](https://github.com/garin25/Chat.git)

# Levantar con Docker Compose (Backend, DB y Redis)
docker-compose up -d

# Correr Frontend
cd frontend
npm install
npm run dev
