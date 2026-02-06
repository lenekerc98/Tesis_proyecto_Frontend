import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axiosclient from "./api/axiosClient"; // Asegúrate que la ruta sea correcta
import { Analizador } from './pages/all/Analizador_usuario'; 
import { DashboardAdmin } from "./pages/admin/dashboard_admin"; 
import fondoImagen from './assets/fondo_bosque.jpg';

function App() {
  // Leemos el token y el rol del almacenamiento local al iniciar
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role_id"));

  // --- COMPONENTE INTERNO: VISTA DE LOGIN/REGISTRO ---
  const LoginView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        await axiosclient.post("/usuarios/registro", {
          email, password, nombre_completo: nombre, role: "usuario"
        });
        alert("Cuenta creada con éxito. Ahora inicia sesión.");
        setIsLogin(true); 
      } catch (error) {
        console.error(error);
        alert("Error al registrarse.");
      }
    };

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
        
        // Guardamos token y actualizamos estado para provocar la redirección
        localStorage.setItem("token", access_token);
        setToken(access_token); 

        // Obtener datos del usuario (Rol y Nombre)
        try {
          const meResponse = await axiosclient.get("/usuarios/me", {
              headers: { "Authorization": `Bearer ${access_token}` }
          });
          const rolReal = meResponse.data.role_id;
          const nombreReal = meResponse.data.nombre_completo;

          localStorage.setItem("userName", nombreReal);
          localStorage.setItem("role_id", String(rolReal));
          setRole(String(rolReal)); 
        } catch (error) {
          // Fallback si falla la petición /me
          localStorage.setItem("userName", email);
          localStorage.setItem("role_id", "1");
          setRole("1");
        }
      } catch (error) {
        console.error(error);
        alert("Credenciales incorrectas");
      }
    };

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
                <input type="text" className="form-control rounded-4 py-2" value={nombre} onChange={(e) => setNombre(e.target.value)} required={!isLogin} placeholder="Ej. Juan Pérez" />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">Correo Electrónico</label>
              <input type="email" className="form-control rounded-4 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold small text-secondary">Contraseña</label>
              <input type="password" className="form-control rounded-4 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-success w-100 py-2 fw-bold rounded-pill shadow-sm">
              {isLogin ? "Iniciar Sesión" : "Registrarse"}
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

  // --- RUTAS Y NAVEGACIÓN ---
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. RUTA LOGIN: Si NO tienes token, ves el Login. Si YA tienes, te manda al inicio ("/") */}
        <Route path="/login" element={!token ? <LoginView /> : <Navigate to="/" />} />

        {/* 2. RUTA INICIO ("/"): Si TIENES token, te muestra la app. Si NO, te manda al Login */}
        <Route 
          path="/" 
          element={
            token ? (
              // Si eres Admin (0) vas al Dashboard, si no al Analizador
              role === "0" ? <DashboardAdmin /> : <Analizador />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        {/* 3. CUALQUIER OTRA RUTA: Te manda al inicio para que el filtro decida */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;