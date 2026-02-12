import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosclient from "../api/axiosClient"; // Ajusta la ruta a tu api/axiosClient
import fondoImagen from '../assets/fondo_bosque.jpg'; // Ajusta la ruta a tu imagen
import aveLogo from '../assets/ave.png'; // Importamos el logo

export const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Estado para el error
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Estado para el modal de éxito
  const [showPassword, setShowPassword] = useState(false); // Estado para ver password

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setShowSuccessModal(false);
    try {
      await axiosclient.post("/usuarios/registro", {
        email, password, nombre_completo: nombre, role: "usuario"
      });
      setShowSuccessModal(true);
      setIsLogin(true);
      // Limpiar campos del formulario
      setEmail("");
      setPassword("");
      setNombre("");
    } catch (error) {
      console.error(error);
      setErrorMsg("Error al registrarse. Verifica los datos o intenta con otro correo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setShowSuccessModal(false);
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

        // 3. ¡REDIRECCIÓN CORRECTA! 
        // Usamos navigate para no recargar la página y evitar que se borre el token
        navigate("/", { replace: true });

      } catch (error) {
        // Fallback si falla /me
        localStorage.setItem("userName", email);
        localStorage.setItem("role_id", "1"); // Asumimos usuario normal
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error);
      // Usamos el estado en lugar de alert
      setErrorMsg("Credenciales incorrectas. Por favor verifica tu correo y contraseña.");
      setLoading(false);
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
          {/* LOGO COLOREADO CON CSS MASK */}
          <div
            className="mx-auto mb-2"
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "#198754",
              maskImage: `url(${aveLogo})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${aveLogo})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center"
            }}
          />
          <h1 className="fw-bold text-success display-6">BirdIA</h1>
          <p className="text-muted">{isLogin ? "Bienvenido de nuevo" : "Únete a la investigación"}</p>
        </div>

        {/* ALERTA DE ERROR ESTILO BOOTSTRAP */}
        {errorMsg && (
          <div className="alert alert-danger d-flex align-items-center animate__animated animate__headShake" role="alert">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
            <div>
              {errorMsg}
            </div>
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">Nombre Completo</label>
              <input type="text" className="form-control rounded-4 py-2 bg-light border-0"
                value={nombre} onChange={(e) => { setNombre(e.target.value); setErrorMsg(null); }} required={!isLogin} placeholder="Ej. Juan Pérez" />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label fw-bold small text-secondary">Correo Electrónico</label>
            <input type="email" className="form-control rounded-4 py-2 bg-light border-0"
              value={email} onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }} required placeholder="Ingrese su correo electrónico." />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small text-secondary">Contraseña</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control rounded-start-4 py-2 bg-light border-0"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                required
                placeholder="Ingrese su contraseña."
              />
              <button
                className="btn btn-light border-0 rounded-end-4 px-3"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ backgroundColor: "rgba(248, 249, 250, 1)" }}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-secondary`}></i>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-success w-100 py-2 fw-bold rounded-pill shadow-sm hover-scale">
            {loading ? "Procesando..." : (isLogin ? "Iniciar Sesión" : "Registrarse")}
          </button>
        </form>

        <div className="mt-4 text-center border-top pt-3">
          <button className="btn btn-link text-decoration-none text-muted small" onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); setShowSuccessModal(false); }}>
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <span className="text-success fw-bold">{isLogin ? "Regístrate aquí" : "Inicia sesión"}</span>
          </button>
        </div>
      </div>

      {/* MODAL DE ÉXITO BOOTSTRAP */}
      {showSuccessModal && (
        <>
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg animate__animated animate__zoomIn" style={{ borderRadius: "24px" }}>
                <div className="modal-body text-center p-5">
                  <div className="mb-4 text-success">
                    <i className="bi bi-check-circle-fill" style={{ fontSize: "4rem" }}></i>
                  </div>
                  <h2 className="fw-bold mb-3">¡Cuenta Creada!</h2>
                  <p className="text-muted mb-4">
                    Tu registro ha sido exitoso. Ahora puedes iniciar sesión con tus credenciales.
                  </p>
                  <button
                    type="button"
                    className="btn btn-success w-100 py-2 fw-bold rounded-pill"
                    onClick={() => setShowSuccessModal(false)}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop manually for Bootstrap look */}
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};