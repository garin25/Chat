import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "@/features/auth/AuthContext";

// 1. OPTIMIZACIÓN: El esquema va AFUERA del componente
const schema = z.object({
    telefono: z.string().min(8, "El telefono debe tener al menos 8 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

type LoginFormValues = z.infer<typeof schema>;

function LoginForm() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const navigate = useNavigate(); // Hook para navegar
    const { login } = useAuth(); // Tu función del contexto

    const {
        register,
        handleSubmit,
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
                // 2. EXTRAER EL TOKEN
                // Asumo que tu backend devuelve un JSON así: { "token": "eyJhbG..." }
                const jsonResponse = await response.json(); 
                
                // 3. USAR EL CONTEXTO
                // Al llamar a login(), el AuthContext guarda el token en localStorage
                // y actualiza el estado de toda la app.
                login(jsonResponse.token,jsonResponse.user); 
        
                // 4. REDIRECCIÓN 
                navigate("/wsp")

            } else {
                alert("Credenciales incorrectas");
            }

        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
                <label>Telefono:</label>
                <input type="text" {...register("telefono")} />
                {errors.telefono && <span style={{ color: "red" }}>{errors.telefono.message}</span>}
            </div>
            <div>
                <label>Password:</label>
                <input type="password" {...register("password")} />
                {errors.password && <span style={{ color: "red" }}>{errors.password.message}</span>}
            </div>

            <button type="submit">Login</button>
        </form>
    );
}

export default LoginForm;