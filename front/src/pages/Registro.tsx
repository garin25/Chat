import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import './Auth.css';

const schema = z.object({
    telefono: z.string().min(8, "El teléfono debe tener al menos 8 caracteres"),
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    estado: z.string().optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmarPassword: z.string() 
}).refine((data) => data.password === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"], // Le decimos a Zod que ponga el error en este campo
});


type RegistroFormValues = z.infer<typeof schema>;

function Registro() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const navigate = useNavigate(); // Hook para navegar

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegistroFormValues>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: RegistroFormValues) => {
        //separamos confirmarPassword ya que no lo debo enviar
        const { confirmarPassword, ...datosParaBackend } = data;
        try {
            const response = await fetch(`${API_URL}/api/usuarios/registrar`, {
                method: 'POST',
                body: JSON.stringify(datosParaBackend),
                headers: { 'Content-Type': 'application/json' },
            });
            const dataResponse = await response.json();

            if (response.ok) {
                navigate("/wsp/login");
                alert("Bienvenido! Iniciá sesión para continuar");
            } else {
                const mensajeError = dataResponse.mensaje || "Ocurrió un error desconocido";

                alert(mensajeError); 
                console.error("Detalle del error:", dataResponse);
            }

        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    };

  return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Crear Cuenta</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            {...register("nombre", { required: "El nombre es obligatorio" })} 
                        />
                        {errors.nombre && <span className="error-msg">{errors.nombre.message}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Teléfono</label>
                        <input 
                            type="text" 
                            className="form-input"
                            {...register("telefono", { required: "Teléfono requerido" })} 
                        />
                        {errors.telefono && <span className="error-msg">{errors.telefono.message}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Estado</label>
                        <input 
                            type="text" 
                            className="form-input"
                            placeholder="Ej: Disponible"
                            {...register("estado")} 
                        />
                        {errors.estado && <span className="error-msg">{errors.estado.message}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input 
                            type="password" 
                            className="form-input"
                            {...register("password")} 
                        />
                        {errors.password && <span className="error-msg">{errors.password.message}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirmar Contraseña</label>
                        <input 
                            type="password" 
                            className="form-input"
                            {...register("confirmarPassword")} 
                        />
                        {errors.confirmarPassword && <span className="error-msg">{errors.confirmarPassword.message}</span>}
                    </div>

                    <button type="submit" className="submit-btn">Registrarme</button>
                </form>

                <div className="auth-footer">
                    ¿Ya tenés cuenta? 
                    <Link to="/wsp/login" className="auth-link">Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default Registro;