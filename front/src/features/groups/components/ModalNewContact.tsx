import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAgregarContacto } from "../hooks/useAgregarContacto";

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
}



export const ModalNewContact = ({ isOpen, onClose}: ModalProps) => {

    const { mutate: agregarContacto } = useAgregarContacto();
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
        setIsSubmitting(true);
        agregarContacto(data, {
            onSuccess: () => {
                setIsSubmitting(false);
                onClose();
                alert("Contacto agregado correctamente")
            },
            onError: (error: any) => {
                setIsSubmitting(false);
                console.error("Error de red:", error);
                setServerError(error.message);
            }
        });

    };

    if (!isOpen) return null;


    return (
        <div className="modal-overlay" >
            <div className="modal-content">
                <h2>Nuevo Contacto</h2>

                <form onSubmit={handleSubmit(onSubmit)}>

                    <div className="form-group">
                        <label className="form-label">Nombre (Alias):</label>
                        <input className="form-input" type="text" {...register("nombre")} />
                        {errors.nombre && <small style={{ color: "red" }}>{errors.nombre.message}</small>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Teléfono:</label>
                        <input className="form-input" type="text" placeholder="1122334455" {...register("telefono")} />
                        {errors.telefono && <small style={{ color: "red" }}>{errors.telefono.message}</small>}
                    </div>

                    {serverError && <div style={{ color: "red", fontWeight: "bold", marginBottom: 10 }}>{serverError}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>

                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Agendar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )

}
