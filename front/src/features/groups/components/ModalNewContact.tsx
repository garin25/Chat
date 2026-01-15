import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChatService } from "@/features/chat/services/chat.service";

const schema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    telefono: z.string()
        .trim() // Quita espacios adelante y atrás
        .min(1, "El teléfono es obligatorio")
        .regex(/^\d+$/, "Solo números, sin guiones ni espacios")
});

export type NewContactFormValues = z.infer<typeof schema>;


interface ModalProps {
    isOpen: boolean,
    onClose: () => void,
    onContactAdded: () => void
}


const chatService = ChatService;

export const ModalNewContact = ({ isOpen, onClose, onContactAdded }: ModalProps) => {

    if (!isOpen) return null;
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);


    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<NewContactFormValues>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: NewContactFormValues) => {

        try {
            setIsSubmitting(true);
            chatService.agendarContacto(data);
            onContactAdded();
            setIsSubmitting(false);
            onClose();
            alert("Contacto agregado correctamente")
        } catch (error: any) {
            setIsSubmitting(false);
            console.error("Error de red:", error);
            //alert("No se pudo conectar con el servidor");
            setServerError(error.message);
        } finally {
            setIsSubmitting(false);

        }
    };



    return (
        <div className="modal-overlay" style={overlayStyle}> {/* Estilo básico para centrar */}
            <div className="modal-content" style={modalStyle}>
                <h2>Nuevo Contacto</h2>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        <label>Nombre (Alias): </label>
                        <input type="text" {...register("nombre")} />
                        {errors.nombre && <small style={{ color: "red" }}>{errors.nombre.message}</small>}
                    </div>

                    <div>
                        <label>Teléfono:</label>
                        {/* Usamos type="text" para que el regex de Zod valide, type="number" a veces molesta */}
                        <input type="text" placeholder="1122334455" {...register("telefono")} />
                        {errors.telefono && <small style={{ color: "red" }}>{errors.telefono.message}</small>}
                    </div>

                    {/* Mensaje de error del servidor */}
                    {serverError && <div style={{ color: "red", fontWeight: "bold" }}>{serverError}</div>}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Agendar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )

}

// Estilos rápidos para que parezca un modal (luego muévelos a CSS)
const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
};
const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px'
};