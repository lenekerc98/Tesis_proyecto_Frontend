import React, { useRef } from "react";
import ReactDOM from "react-dom"; // <--- IMPORTANTE: Importamos ReactDOM

interface Usuario {
  id_usuario: number;
  "Nombre completo"?: string; // Puede venir con espacio
  nombre_completo?: string;   // O con guion bajo
  email: string;
  usuario_activo: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario;
  onSave: (id: number, data: any) => Promise<void>;
}

export const ModalEditarUsuario: React.FC<ModalProps> = ({ isOpen, onClose, user, onSave }) => {
  // USAMOS REFS PARA QUE NO HAYA FALLOS AL ESCRIBIR
  const nombreRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const activoRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  // Normalizamos el nombre (por si viene de una forma u otra)
  const nombreInicial = user["Nombre completo"] || user.nombre_completo || "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Obtenemos los valores de los campos
        const nombreValue = nombreRef.current?.value;
        const emailValue = emailRef.current?.value;
        const activoValue = activoRef.current?.checked;
        const passwordValue = passwordRef.current?.value.trim(); // Quitamos espacios

        // 2. Construimos el objeto base (Nombre, Email y Activo siempre van)
        // Usamos 'any' temporalmente para poder agregar propiedades dinámicamente
        const datosParaEnviar: any = {
            nombre_completo: nombreValue,
            email: emailValue,
            usuario_activo: activoValue
        };

        // 3. LÓGICA CRÍTICA: Solo agregamos 'password' si el usuario escribió algo
        if (passwordValue && passwordValue.length > 0) {
            datosParaEnviar.password = passwordValue;
        }
        
        // IMPORTANTE: Si 'passwordValue' está vacío, la propiedad 'password' 
        // NO existirá en 'datosParaEnviar', por lo que el Backend la ignorará 
        // y no lanzará error de validación.

        console.log("Enviando datos:", datosParaEnviar); // Para depurar en consola (F12)
        
        onSave(user.id_usuario, datosParaEnviar);
    };

  // --- LA SOLUCIÓN DEFINITIVA: REACT PORTAL ---
  // Esto renderiza el modal FUERA de la tabla, directamente en el <body>
  return ReactDOM.createPortal(
    <div 
        className="modal-overlay" 
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99999, // Z-Index altísimo
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'auto' // Asegura que reciba clics
        }}
    >
        {/* Contenido del Modal */}
        <div 
            className="bg-white rounded-4 shadow-lg p-4 animate__animated animate__fadeInDown" 
            style={{ width: '90%', maxWidth: '500px', pointerEvents: 'auto' }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-success m-0">Editar Usuario</h4>
                <button 
                    type="button" 
                    className="btn-close" 
                    onClick={onClose} // Esto DEBE funcionar ahora
                    style={{ cursor: 'pointer' }}
                ></button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Nombre Completo</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        defaultValue={nombreInicial} // defaultValue permite escribir sin bloqueos
                        ref={nombreRef}
                        autoFocus
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Email</label>
                    <input 
                        type="email" 
                        className="form-control" 
                        defaultValue={user.email} 
                        ref={emailRef}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Nueva Contraseña</label>
                    <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Dejar vacío para mantener" 
                        ref={passwordRef}
                    />
                </div>

                <div className="mb-4">
                    <div className="form-check form-switch p-3 border rounded-3 d-flex align-items-center gap-2">
                        <input 
                            className="form-check-input m-0" 
                            type="checkbox" 
                            role="switch" 
                            style={{ width: '3em', height: '1.5em', cursor: 'pointer' }} 
                            defaultChecked={user.usuario_activo} 
                            ref={activoRef}
                        />
                        <span className="fw-bold text-secondary">Usuario Activo</span>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <button 
                        type="button" 
                        className="btn btn-light rounded-pill px-4 fw-bold" 
                        onClick={onClose}
                        style={{ cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-success rounded-pill px-4 fw-bold"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    </div>,
    document.body // <--- AQUÍ ESTÁ LA MAGIA: Se pega en el body
  );
};