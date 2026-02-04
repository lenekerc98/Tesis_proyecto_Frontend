import { useState, useEffect } from "react";
// Importamos tu cliente configurado (Ajusta la ruta si es necesario)
import client from "../../api/axiosClient"; 
import "../../App.css";

export const Perfil = () => {
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(true);
  
  const [usuario, setUsuario] = useState({
    nombre_completo: "",
    email: "",
    id_usuario: 0,
    usuario_activo: true,
    role: ""
  });

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });

  // --- 1. CARGAR DATOS (NUEVA ESTRATEGIA: /me) ---
  useEffect(() => {
    const cargarDatos = async () => {
      setBuscando(true);
      try {
        // ¡MIRA QUÉ LIMPIO! Una sola línea hace todo el trabajo.
        // El cliente ya envía el token y sabe la URL base.
        const { data } = await client.get("/usuarios/me");

        setUsuario(data);
        setNuevoNombre(data.nombre_completo);
        
        // Actualizamos el localStorage por si acaso
        localStorage.setItem("userName", data.nombre_completo);

      } catch (error) {
        console.error("Error cargando perfil:", error);
        // Si falla (ej: token vencido), podrías redirigir al login
      } finally {
        setBuscando(false);
      }
    };
    cargarDatos();
  }, []);

  // --- 2. ACTUALIZAR NOMBRE ---
  const handleUpdateNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return alert("El nombre no puede estar vacío");
    
    setLoading(true);
    try {
      const payload = {
        nombre_completo: nuevoNombre,
        // Enviamos el estado actual para no desactivarlo accidentalmente
        usuario_activo: usuario.usuario_activo 
      };
      
      await client.put("/usuarios/actualiza_usuario", payload);
      
      alert("Nombre actualizado correctamente.");
      setUsuario({ ...usuario, nombre_completo: nuevoNombre });
      localStorage.setItem("userName", nuevoNombre); 
      
      // Opcional: Recargar página para actualizar el Sidebar inmediatamente
      // window.location.reload();
      
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el nombre.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. CAMBIAR CONTRASEÑA ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.actual) return alert("Ingresa tu contraseña actual.");
    if (passwords.nueva !== passwords.confirmar) return alert("Las contraseñas nuevas no coinciden.");
    if (passwords.nueva.length < 4) return alert("La contraseña es muy corta.");

    setLoading(true);
    try {
      // PASO A: VERIFICAR LA CONTRASEÑA ACTUAL
      // Hacemos un login "silencioso" para ver si la clave actual es real.
      const loginParams = new URLSearchParams();
      loginParams.append("username", usuario.email);
      loginParams.append("password", passwords.actual);

      try {
        // NOTA: Para login necesitamos x-www-form-urlencoded, así que sobrescribimos el header
        await client.post("/usuarios/login", loginParams, {
             headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
      } catch {
        setLoading(false);
        return alert("Error: La contraseña actual es incorrecta.");
      }

      // PASO B: SI LA ACTUAL ES CORRECTA, ACTUALIZAMOS A LA NUEVA
      const payload = {
        nombre_completo: usuario.nombre_completo, // Mantenemos el nombre
        password: passwords.nueva,                // Enviamos la nueva clave
        usuario_activo: usuario.usuario_activo
      };

      await client.put("/usuarios/actualiza_usuario", payload);
      
      alert("¡Contraseña actualizada! Por seguridad, inicia sesión nuevamente.");
      localStorage.clear();
      window.location.reload(); 
      
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      <h4 className="fw-bold text-dark mb-4">Configuración de Perfil</h4>

      <div className="row">
        {/* --- COLUMNA 1: INFORMACIÓN PERSONAL --- */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-success-light text-success rounded-circle d-flex justify-content-center align-items-center" style={{width:'50px', height:'50px'}}>
                <i className="bi bi-person-lines-fill fs-4"></i>
              </div>
              <h5 className="fw-bold ms-3 mb-0">Información Personal</h5>
            </div>
            
            {buscando ? (
                <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm mb-2 text-success"></div>
                    <p>Cargando perfil...</p>
                </div>
            ) : (
                <form onSubmit={handleUpdateNombre}>
                <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Correo (No editable)</label>
                    <input type="email" className="form-control bg-light text-muted" value={usuario.email} disabled />
                </div>
                <div className="mb-4">
                    <label className="form-label text-muted small fw-bold">Nombre Completo</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        value={nuevoNombre} 
                        onChange={(e) => setNuevoNombre(e.target.value)} 
                        placeholder="Tu nombre aquí"
                    />
                </div>
                <button disabled={loading} className="btn btn-success w-100 rounded-pill fw-bold">
                    {loading ? "Guardando..." : "Actualizar Nombre"}
                </button>
                </form>
            )}
          </div>
        </div>

        {/* --- COLUMNA 2: SEGURIDAD --- */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-warning-light text-warning rounded-circle d-flex justify-content-center align-items-center" style={{width:'50px', height:'50px'}}>
                <i className="bi bi-shield-lock-fill fs-4"></i>
              </div>
              <h5 className="fw-bold ms-3 mb-0">Seguridad</h5>
            </div>

            <form onSubmit={handleUpdatePassword}>
              <div className="mb-3">
                <label className="form-label text-dark small fw-bold">Contraseña Actual <span className="text-danger">*</span></label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-key"></i></span>
                    <input 
                        type="password" 
                        className="form-control border-start-0 ps-0" 
                        value={passwords.actual} 
                        onChange={(e) => setPasswords({...passwords, actual: e.target.value})} 
                        required 
                        placeholder="Para verificar que eres tú"
                    />
                </div>
              </div>

              <hr className="my-4 text-muted opacity-25"/>

              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Nueva Contraseña</label>
                <input 
                    type="password" 
                    className="form-control" 
                    value={passwords.nueva} 
                    onChange={(e) => setPasswords({...passwords, nueva: e.target.value})} 
                    required 
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted small fw-bold">Confirmar Nueva Contraseña</label>
                <input 
                    type="password" 
                    className="form-control" 
                    value={passwords.confirmar} 
                    onChange={(e) => setPasswords({...passwords, confirmar: e.target.value})} 
                    required 
                />
              </div>

              <button disabled={loading} className="btn btn-outline-danger w-100 rounded-pill fw-bold border-2">
                {loading ? "Verificando..." : "Cambiar Contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};