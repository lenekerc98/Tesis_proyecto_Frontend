import React, { useState } from "react";
import axiosclient from "../api/axiosClient"; // Ajusta la ruta a tu api/axiosClient
import fondoImagen from '../assets/fondo_bosque.jpg'; // Ajusta la ruta a tu imagen

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosclient.post("/usuarios/registro", {
        email, password, nombre_completo: nombre, role: "usuario"
      });
      alert("Cuenta creada con éxito. Ahora inicia sesión.");
      setIsLogin(true); 
    } catch (error) {
      console.error(error);
      alert("Error al registrarse. Verifica los datos.");
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      
      const response = await axiosclient.post("/usuarios/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const { access_token } = response.data;
      
      // 1. Guardamos el token
      localStorage.setItem("token", access_token);

      // 2. Obtenemos datos del usuario inmediatamente
      try {
        const meResponse = await axiosclient.get("/usuarios/me", {
             headers: { "Authorization": `Bearer ${access_token}` }
        });
        const rolReal = meResponse.data.role_id;
        const nombreReal = meResponse.data.nombre_completo;

        localStorage.setItem("userName", nombreReal);
        localStorage.setItem("role_id", String(rolReal));
        
        // 3. ¡REDIRECCIÓN FORZADA! 
        // Esto recarga la página y hace que App.tsx lea el nuevo token y redireccione
        window.location.href = "/"; 

      } catch (error) {
        // Fallback si falla /me
        localStorage.setItem("userName", email);
        localStorage.setItem("role_id", "1"); // Asumimos usuario normal
        window.location.href = "/";
      }
    } catch (error) {
      //console.error(error);
      //alert("Credenciales incorrectas");
      //setLoading(false);
      <div className="alert alert-primary d-flex align-items-center" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <div>
          Contraseña incorrecta. Por favor, inténtalo de nuevo.
        </div>
      </div>
    }
  };

  return (
    <div 
      className="d-flex justify-content-center align-items-center vh-100 w-100"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${fondoImagen})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="card p-4 shadow-lg border-0 animate__animated animate__fadeInUp" 
           style={{ maxWidth: "400px", width: "90%", borderRadius: "24px", backgroundColor: "rgba(255, 255, 255, 0.98)" }}>
        
        <div className="text-center mb-4">
            <h1 className="fw-bold text-success display-6">🦜 BirdIA</h1>
            <p className="text-muted">{isLogin ? "Bienvenido de nuevo" : "Únete a la investigación"}</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">Nombre Completo</label>
              <input type="text" className="form-control rounded-4 py-2 bg-light border-0" 
                     value={nombre} onChange={(e) => setNombre(e.target.value)} required={!isLogin} placeholder="Ej. Juan Pérez" />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label fw-bold small text-secondary">Correo Electrónico</label>
            <input type="email" className="form-control rounded-4 py-2 bg-light border-0" 
                   value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small text-secondary">Contraseña</label>
            <input type="password" className="form-control rounded-4 py-2 bg-light border-0" 
                   value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-success w-100 py-2 fw-bold rounded-pill shadow-sm hover-scale">
            {loading ? "Procesando..." : (isLogin ? "Iniciar Sesión" : "Registrarse")}
          </button>
        </form>

        <div className="mt-4 text-center border-top pt-3">
          <button className="btn btn-link text-decoration-none text-muted small" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <span className="text-success fw-bold">{isLogin ? "Regístrate aquí" : "Inicia sesión"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};