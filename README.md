# 💬 [ChatApp] - Sistema de Chat en Tiempo Real

![Demo de la App](https://github.com/user-attachments/assets/b8dcc201-bb7e-44f7-a6e2-20cf905c134d)
> *Una aplicación Full Stack de mensajería instantánea con notificaciones de estado, presencia y gestión de grupos.*

## 🚀 Sobre el Proyecto
Este proyecto nació de la necesidad de entender a fondo la comunicación bidireccional en la web. No utiliza librerías de "caja negra" para el chat (como Firebase)
, sino que implementa una arquitectura personalizada de **WebSockets con STOMP** sobre un backend robusto en Java.

## 🛠️ Stack Tecnológico

**Frontend:**
- ⚛️ **React + TypeScript:** (Vite) Para una UI reactiva y tipado seguro.
- 🔄 **Custom Hooks:** Lógica encapsulada para WebSockets (`useChatConnection`, `usePresencia`).
- 🎨 **CSS Modules / Tailwind:** Diseño responsive y limpio.

**Backend:**
- ☕ **Java 17 + Spring Boot 3:** API REST y Servidor WebSocket.
- 🔐 **Spring Security + JWT:** Autenticación y protección de rutas.
- 📡 **WebSockets (STOMP):** Gestión de eventos (Typing, Online/Offline, Read Receipts).
- 🗄️ **PostgreSQL:** Persistencia relacional compleja (Usuarios, Chats, Mensajes, Participantes).
- 🐳 **Docker:** Contenerización para despliegue simplificado.

## ✨ Funcionalidades Clave

1.  **Comunicación en Tiempo Real:** Mensajería instantánea con latencia mínima.
2.  **Sistema de Presencia:**
    - Indicador de "En línea" (verde) y "Última vez" preciso.
    - Detección de desconexión abrupta.
3.  **Indicadores de Escritura (Typing...):**
    - Feedback visual cuando otro usuario está escribiendo (con debounce para optimizar red).
4.  **Estados de Mensajería:**
    - Doble check (Enviado, Entregado, Leído).
5.  **Gestión de Grupos:**
    - Creación de grupos con validación de participantes únicos.
    - Roles de administrador.

## 🧠 Desafíos Técnicos Superados

Durante el desarrollo, me enfrenté a retos interesantes:
* **Race Conditions en React:** Implementé referencias (`useRef`) para manejar la conexión del socket sin perder el contexto de los estados.
* **Consistencia de Datos:** Uso de `Set<Long>` en Java para evitar duplicados en la creación de grupos y manejo transaccional (`@Transactional`)
para asegurar la integridad de la base de datos.
* **Sincronización de Estado:** Coordinación entre llamadas REST (para el historial) y eventos WebSocket (para lo nuevo) sin duplicar mensajes en la UI.

## 📦 Instalación y Despliegue

```bash
# Clonar el repositorio
git clone [https://github.com/garin25/Chat.git](https://github.com/garin25/Chat.git)

# Levantar con Docker Compose (Backend + DB)
docker-compose up -d

# Correr Frontend
cd frontend
npm install && npm run dev
