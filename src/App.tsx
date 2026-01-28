import { useState } from "react";
import axios from "axios";
// Importamos tus páginas
import { Analizador } from './pages/user/Analizador_usuario'; 
// import { DashboardAdmin } from "./pages/admin/DashboardAdmin"; 

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
      await axios.post("http://127.0.0.1:8000/v1/usuarios/", {
        email: email,
        password: password,
        nombre_completo: nombre, // Este nombre se guarda en la BD
        role: "usuario"
      });
      alert("Cuenta creada con éxito. Ahora inicia sesión.");
      setIsLogin(true); // Cambiamos a la vista de Login
    } catch (error: any) {
      console.error(error);
      alert("Error al registrarse. Verifica los datos.");
    }
  };

  // --- LOGIN (AQUÍ ES DONDE "JALAMOS" EL NOMBRE) ---
  // --- LOGIN ACTUALIZADO ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      
      // 1. PRIMERA PETICIÓN: Obtener el Token
      const response = await axios.post("http://127.0.0.1:8000/v1/usuarios/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const { access_token } = response.data;
      
      // Guardamos el token primero
      localStorage.setItem("token", access_token);

      // 2. SEGUNDA PETICIÓN (EXTRA): Obtener los datos del usuario usando el token
      // Intentamos obtener el perfil para sacar el nombre real
      try {
        const meResponse = await axios.get("http://127.0.0.1:8000/v1/usuarios/me", {
            headers: { "Authorization": `Bearer ${access_token}` }
        });

        console.log("Datos del usuario:", meResponse.data); // <--- MIRA ESTO EN CONSOLA

        // Extraemos los datos reales de la base de datos
        const nombreReal = meResponse.data.nombre_completo || meResponse.data.nombre || meResponse.data.email;
        const rolReal = meResponse.data.role_id || meResponse.data.rol || "1";

        // Guardamos en LocalStorage
        localStorage.setItem("userName", nombreReal);
        localStorage.setItem("role_id", String(rolReal));
        
        // Actualizamos estado
        setRole(String(rolReal));

      } catch (errorProfile) {
        console.warn("No se pudo cargar el perfil, usando datos temporales", errorProfile);
        // Fallback si falla la petición /me
        localStorage.setItem("userName", email.split("@")[0]);
        localStorage.setItem("role_id", "1");
      }

      // 3. Finalizar Login
      setToken(access_token);

    } catch (error: any) {
      console.error("Error login:", error);
      alert("Credenciales incorrectas o error de conexión");
    }
  };

  // --- LÓGICA DE NAVEGACIÓN ---
  if (token) {
    if (role === "0") {
      return <div>Bienvenido Admin (Panel en construcción)</div>;
      // return <DashboardAdmin />;
    }
    // Usuario normal
    return <Analizador />; 
  }

  // --- VISTA DE LOGIN / REGISTRO ---
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg border-0" style={{ maxWidth: "420px", width: "100%", borderRadius: "24px" }}>
        
        <div className="text-center mb-4">
            <h1 className="fw-bold text-success display-6">🦜 BirdIA</h1>
            <p className="text-muted">{isLogin ? "Bienvenido de nuevo" : "Únete a la investigación"}</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Campo Nombre solo visible en Registro */}
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