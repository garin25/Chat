import { useState, useEffect, useCallback } from "react";

// 1. Aceptamos string o null
export const useFetch = <T>(url: string | null) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false); // Arrancamos en false
    const [error, setError] = useState<any>(null);

    const fetchData = useCallback(async () => {
        // 2. CLÁUSULA DE GUARDIA: Si es null o vacío, no hacemos nada.
        if (!url) {
            setLoading(false);
            return; 
        }

        setLoading(true);
        setError(null); // Limpiamos errores previos al reintentar

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};