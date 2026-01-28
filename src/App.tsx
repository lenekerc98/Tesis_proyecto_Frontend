import { useState } from "react";
import axios from "axios";
// Importamos desde las nuevas carpetas
import { Analizador } from './pages/user/Analizador_usuario'; 
// import { DashboardAdmin } from "./pages/admin/DashboardAdmin"; 

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role_id"));
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  // REGISTRO DE USUARIOS
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/v1/usuarios/registro", {
        email: email,
        password: password,
        nombre_completo: nombre,
        role: "usuario" // Se envía como string para evitar error 422
      });
      alert("Cuenta creada. Ahora puedes iniciar sesión.");
      setIsLogin(true);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      alert("Error: " + (typeof detail === "object" ? JSON.stringify(detail) : detail));
    }
  };

  // LOGIN CON REDIRECCIÓN POR ROL
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  try {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    
    const response = await axios.post("http://127.0.0.1:8000/v1/usuarios/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    // 1. Extraemos solo lo que el Swagger muestra que envías
    const { access_token } = response.data; 

    // 2. Si el login es exitoso (status 200), asumimos rol de usuario (1) por ahora
    // hasta que el backend envíe el role_id real
    const role_id_temporal = "1"; 

    localStorage.setItem("token", access_token);
    localStorage.setItem("role_id", role_id_temporal);
    
    setToken(access_token);
    setRole(role_id_temporal);


  } catch (error: any) {
    // Si entra aquí es porque los datos (email/password) no coinciden en la DB
    console.error("Error capturado:", error.response?.data);
    alert("Credenciales incorrectas o error de servidor");
  }
};

  // LÓGICA DE NAVEGACIÓN HACIA LAS CARPETAS DE PAGES
  if (token) {
    if (role === "0") {
      return <div>Página de Administrador (Cargando desde /pages/admin/...)</div>;
      // return <DashboardAdmin />;
    }
    return <Analizador />; // Cargada desde /pages/usuario/Analizador.tsx
  }

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg border-0" style={{ maxWidth: "420px", width: "100%", borderRadius: "20px" }}>
        <h2 className="text-center mb-4 fw-bold text-primary">
          {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
        </h2>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label fw-bold small">Nombre Completo</label>
              <input type="text" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Juan Perez" />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label fw-bold small">Correo Electrónico</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@correo.com" />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small">Contraseña</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="********" />
          </div>
          <button type="submit" className="btn btn-primary w-100 py-2 fw-bold rounded-pill">
            {isLogin ? "Entrar" : "Registrarse"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button className="btn btn-link text-decoration-none small" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;