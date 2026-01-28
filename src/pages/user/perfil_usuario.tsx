import { useState, useEffect } from "react";
import axios from "axios";
import "../../App.css";

export const Perfil = () => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  
  // Datos del Usuario (se cargan al inicio)
  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    id: 0
  });

  // Estados de los Formularios
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [passwords, setPasswords] = useState({
    nueva: "",
    confirmar: ""
  });

  // --- 1. CARGAR DATOS DEL USUARIO ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Petición para obtener datos del usuario logueado
        const response = await axios.get("http://127.0.0.1:8000/v1/usuarios/", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        // Asumiendo que response.data devuelve { nombre: "...", email: "...", ... }
        setUsuario(response.data);
        setNuevoNombre(response.data.nombre); // Rellenar input con nombre actual
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };
    cargarDatos();
  }, []);

  // --- 2. FUNCIÓN ACTUALIZAR NOMBRE ---
  const handleUpdateNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return alert("El nombre no puede estar vacío");

    setLoading(true);
    try {
      await axios.put(
        "http://127.0.0.1:8000/v1/usuarios/actualizar", 
        { nombre: nuevoNombre }, // Envia el JSON: { "nombre": "Juan" }
        { 
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } 
        }
      );
      
      alert("Nombre actualizado correctamente");
      setUsuario({ ...usuario, nombre: nuevoNombre }); // Actualizar vista localmente
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el nombre. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. FUNCIÓN CAMBIAR CONTRASEÑA ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones simples
    if (passwords.nueva !== passwords.confirmar) {
      return alert("Las contraseñas no coinciden.");
    }
    if (passwords.nueva.length < 4) {
      return alert("La contraseña es muy corta.");
    }

    setLoading(true);
    try {
      await axios.put(
        "http://127.0.0.1:8000/v1/usuarios/cambiar-password", 
        { password: passwords.nueva }, // Envia el JSON: { "password": "123" }
        { 
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } 
        }
      );
      
      alert("Contraseña cambiada con éxito. Por favor inicia sesión nuevamente.");
      // Opcional: Cerrar sesión para obligar a reloguearse
      // localStorage.clear(); window.location.reload();
      
      setPasswords({ nueva: "", confirmar: "" }); // Limpiar formulario
    } catch (error) {
      console.error(error);
      alert("Error al cambiar contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      <h4 className="fw-bold text-dark mb-4">Configuración de Perfil</h4>

      <div className="row">
        
        {/* --- COLUMNA 1: DATOS PERSONALES --- */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            
            <div className="d-flex align-items-center mb-4">
              <div className="bg-success-light text-success rounded-circle d-flex justify-content-center align-items-center" style={{width:'50px', height:'50px'}}>
                <i className="bi bi-person-lines-fill fs-4"></i>
              </div>
              <h5 className="fw-bold ms-3 mb-0">Información Personal</h5>
            </div>

            <form onSubmit={handleUpdateNombre}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Correo (No editable)</label>
                <input 
                  type="email" 
                  className="form-control bg-light text-muted" 
                  value={usuario.email} 
                  disabled 
                />
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
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {loading ? "Guardando..." : "Actualizar Nombre"}
              </button>
            </form>
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
                <label className="form-label text-muted small fw-bold">Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={passwords.nueva}
                  onChange={(e) => setPasswords({...passwords, nueva: e.target.value})}
                  required
                  placeholder="••••••"
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-bold">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={passwords.confirmar}
                  onChange={(e) => setPasswords({...passwords, confirmar: e.target.value})}
                  required
                  placeholder="••••••"
                />
              </div>

              <button disabled={loading} className="btn btn-outline-danger w-100 rounded-pill fw-bold border-2">
                {loading ? "Procesando..." : "Cambiar Contraseña"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};