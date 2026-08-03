import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useState } from "react";

const schema = z.object({
    telefono: z.string().min(8, "El telefono debe tener al menos 8 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

type LoginFormValues = z.infer<typeof schema>;

function LoginForm() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const navigate = useNavigate();
    const { login } = useAuth();
    const [mostrandoContrasenia, setMostrandoContrasenia] = useState(false);
    
    const {
        register,
        handleSubmit,
        setValue, // Extraemos setValue para autocompletar la demo
        formState: { errors }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await fetch(`${API_URL}/api/usuarios/login`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const jsonResponse = await response.json();
                login(jsonResponse.token, jsonResponse.user);
                console.log("Usuario logueado " + jsonResponse.user.telefono);
                navigate("/wsp");
            } else {
                alert("Credenciales incorrectas");
            }

        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    };

    // Función para manejar el login de la demo
    const handleDemoLogin = () => {
        const demoData = {
            telefono: "1128578286",
            password: "contrasenia"
        };
        
        // Completamos los inputs visualmente para mejor UX
        setValue("telefono", demoData.telefono);
        setValue("password", demoData.password);
        
        // Ejecutamos el submit directamente
        onSubmit(demoData);
    };

    const handleMostrarContrasenia = () => {
        setMostrandoContrasenia(!mostrandoContrasenia);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label>Telefono:</label>
                        <input type="text" className="form-input" {...register("telefono")} />
                        {errors.telefono && <span className="error-msg">{errors.telefono.message}</span>}
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <div className="password-input-wrapper">
                            <input
                                type={mostrandoContrasenia ? "text" : "password"}
                                className="form-input password-input"
                                {...register("password")}
                            />
                            <button
                                type="button"
                                onClick={handleMostrarContrasenia}
                                className="toggle-password-btn"
                            >
                                {mostrandoContrasenia ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>
                        {errors.password && <span className="error-msg">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="submit-btn">Login</button>
                    
                    {/* --- SECCIÓN BOTÓN DEMO --- */}
                    <div className="demo-divider">
                        <span>o ingresa con</span>
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={handleDemoLogin} 
                        className="demo-btn"
                    >
                        Probar cuenta Demo
                    </button>
                    {/* --------------------------- */}

                    <div className="auth-footer">
                        ¿No tenés cuenta?
                        <Link to="/wsp/registro" className="auth-link">Registro</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginForm;