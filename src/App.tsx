import { useState } from "react";
import axiosclient from "../src/api/axiosClient";
// Importamos tus páginas
import { Analizador } from './pages/all/Analizador_usuario'; 
// 1. DESCOMENTAMOS ESTA LÍNEA:
import { DashboardAdmin } from "../src/pages/admin/dashboard_admin"; 
import fondoImagen from './assets/fondo_bosque.jpg';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role_id"));
  
  // Estados del formulario
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  // --- REGISTRO DE USUARIOS ---
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axiosclient.post("/usuarios/registro", {
        email: email,
        password: password,
        nombre_completo: nombre, 
        role: "usuario"
      });
      alert("Cuenta creada con éxito. Ahora inicia sesión.");
      setIsLogin(true); 
    } catch (error: any) {
      console.error(error);
      alert("Error al registrarse. Verifica los datos.");
    }
  };

  // --- LOGIN ACTUALIZADO ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      
      const response = await axiosclient.post("/usuarios/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const { access_token } = response.data;
      localStorage.setItem("token", access_token);

      try {
        const meResponse = await axiosclient.get("/usuarios/me", {
            headers: { "Authorization": `Bearer ${access_token}` }
        });

        // Aseguramos obtener los datos correctos según tu API
        const nombreReal = meResponse.data.nombre_completo || meResponse.data.nombre || meResponse.data.email;
        const rolReal = meResponse.data.role_id; // Tu API devuelve role_id numérico (0 admin, 1 usuario)

        localStorage.setItem("userName", nombreReal);
        localStorage.setItem("role_id", String(rolReal));
        setRole(String(rolReal));

      } catch (errorProfile) {
        console.warn("No se pudo cargar el perfil completo", errorProfile);
        // Fallback básico si falla /me
        localStorage.setItem("userName", email.split("@")[0]);
        localStorage.setItem("role_id", "1"); 
      }

      setToken(access_token);

    } catch (error: any) {
      console.error("Error login:", error);
      alert("Credenciales incorrectas o error de conexión");
    }
  };

  // --- LÓGICA DE NAVEGACIÓN ---
  if (token) {
    // 2. AQUÍ HACEMOS EL CAMBIO CLAVE:
    if (role === "0") {
      return <DashboardAdmin />; // Renderizamos el componente DashboardAdmin
    }
    // Si no es 0, es usuario normal
    return <Analizador />; 
  }

  // --- VISTA DE LOGIN / REGISTRO (Sin cambios) ---
  return (
    <div 
      className="d-flex justify-content-center align-items-center vh-100 w-100"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${fondoImagen})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="card p-4 shadow-lg border-0" style={{ maxWidth: "360px", width: "100%", borderRadius: "24px", backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
        
        <div className="text-center mb-4">
            <h1 className="fw-bold text-success display-6">🦜 BirdIA</h1>
            <p className="text-muted">{isLogin ? "Bienvenido al Sistema" : "Únete a la investigación"}</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">Nombre Completo</label>
              <input 
                type="text" 
                className="form-control rounded-4 py-2" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required={!isLogin}
                placeholder="Ej. Juan Pérez" 
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-bold small text-secondary">Correo Electrónico</label>
            <input 
                type="email" 
                className="form-control rounded-4 py-2" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="correo@ejemplo.com" 
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold small text-secondary">Contraseña</label>
            <input 
                type="password" 
                className="form-control rounded-4 py-2" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
            />
          </div>

          <button type="submit" className="btn btn-success w-100 py-2 fw-bold rounded-pill shadow-sm">
            {isLogin ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </form>

        <div className="mt-4 text-center border-top pt-3">
          <button className="btn btn-link text-decoration-none text-muted small" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <span className="text-success fw-bold">
                {isLogin ? "Regístrate aquí" : "Inicia sesión"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;