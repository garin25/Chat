// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const apiInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Inyecta el token automáticamente en cada petición
apiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    console.log("Interceptor Axios:", token ? "Token encontrado" : "SIN TOKEN"); // AGREGA ESTO
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor: Manejo global de errores 
apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Aquí podrías detectar si es 401 (token vencido) y desloguear
        if (error.response?.status === 401) {
            console.warn("Sesión expirada");
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);