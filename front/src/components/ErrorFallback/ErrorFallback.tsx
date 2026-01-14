import type { FallbackProps } from "react-error-boundary";
function ErrorFallback({ error, resetErrorBoundary }:FallbackProps) {
  return (
    <div role="alert" style={{ padding: '20px', border: '1px solid red' }}>
      <h2>Ups, algo salió mal.</h2>
      <p style={{ color: 'red' }}>{error.message}</p>
      
      {/* Este botón llama a la función de reseteo */}
      <button onClick={resetErrorBoundary}>
        Intentar de nuevo
      </button>
    </div>
  );
}

export default ErrorFallback;