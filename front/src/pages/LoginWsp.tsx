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
    const [isLoading, setIsLoading] = useState(false); // Estado para controlar la carga

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
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
            alert("No se pudo conectar con el servidor. Si estaba inactivo, intentá nuevamente en unos segundos.");
        } finally {
            setIsLoading(false); // Siempre libera el estado de carga al terminar
        }
    };

    const handleDemoLogin = () => {
        const demoData = {
            telefono: "1128578286",
            password: "contrasenia"
        };

        setValue("telefono", demoData.telefono);
        setValue("password", demoData.password);

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
                        <input
                            type="text"
                            className="form-input"
                            disabled={isLoading}
                            {...register("telefono")}
                        />
                        {errors.telefono && <span className="error-msg">{errors.telefono.message}</span>}
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <div className="password-input-wrapper">
                            <input
                                type={mostrandoContrasenia ? "text" : "password"}
                                className="form-input password-input"
                                disabled={isLoading}
                                {...register("password")}
                            />
                            <button
                                type="button"
                                onClick={handleMostrarContrasenia}
                                className="toggle-password-btn"
                                disabled={isLoading}
                            >
                                {mostrandoContrasenia ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>
                        {errors.password && <span className="error-msg">{errors.password.message}</span>}
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? "Conectando..." : "Login"}
                    </button>

                    {/* --- SECCIÓN BOTÓN DEMO --- */}
                    <div className="demo-divider">
                        <span>o ingresa con</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        className="demo-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? "Despertando servidor, aguarde..." : "Probar cuenta Demo"}
                    </button>

                    {isLoading && (
                        <p style={{ fontSize: "0.8rem", color: "#666", textAlign: "center", marginTop: "8px" }}>
                            El servidor gratuito puede demorar hasta 45s en iniciar por inactividad.
                        </p>
                    )}
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