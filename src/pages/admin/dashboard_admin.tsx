import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- IMPORTAMOS COMPONENTES COMPARTIDOS ---
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar"; 
import '../../App.css'; 

// --- IMPORTAMOS LAS PÁGINAS INTERNAS ---
import { CatalogoAves } from "../all/CatalogoAves";
import { Historial_admin } from "./historial_admin";
import { GestionUsuarios } from "./gestionusuarios_admin"; 
import { Mapas } from "../all/Mapas";
import { Analizador } from "../all/Analizador_usuario";

// --- TIPOS DE DATOS ---
interface Sesion {
  usuario: { email: string; rol: string };
  fecha_ingreso: string;
  ip_origen: string;
  estado: string;
  observacion: string;
}

// 1. ACTUALIZAMOS LA INTERFAZ LOGERROR
interface LogError {
  id_log: number;
  mensaje_error: string;
  fuente: string;
  fecha: string;
  nombre_usuario?: string; // <--- NUEVO CAMPO (Opcional por si es nulo)
}

export const DashboardAdmin = () => {
  // --- ESTADOS ---
  const [vista, setVista] = useState("admin_dashboard");
  const [active, setActive] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("Cargando...");

  // --- EFECTO: OBTENER NOMBRE DEL USUARIO ---
  useEffect(() => {
    const fetchUserData = async () => {
        try {
            const storedName = localStorage.getItem("userName");
            if(storedName) setNombreUsuario(storedName);

            const res = await axiosClient.get("/usuarios/me");
            if (res.data && res.data.nombre_completo) {
                setNombreUsuario(res.data.nombre_completo);
                localStorage.setItem("userName", res.data.nombre_completo);
            }
        } catch (error) {
            console.error("Error cargando usuario", error);
            setNombreUsuario("Administrador"); 
        }
    };
    fetchUserData();
  }, []);

  // --- HANDLERS ---
  const toggleSidebar = () => setActive(!active);
  const navegarA = (v: string) => { setVista(v); setActive(false); };

  const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role_id");
      localStorage.removeItem("userName");
      window.location.href = "/login";
    };

  // --- VISTAS INTERNAS ---
  const VistaResumen = () => (
    <div className="animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-4">Panel de Control</h2>
        
        <div className="alert alert-success border-0 shadow-sm rounded-4 d-flex align-items-center mb-4">
            <i className="bi bi-shield-check fs-1 me-3"></i>
            <div>
                <h5 className="alert-heading fw-bold m-0">Hola, {nombreUsuario}</h5>
                <p className="mb-0">Bienvenido al panel de administración del sistema.</p>
            </div>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100 border-start border-primary border-5 cursor-pointer" onClick={() => navegarA("gestion_usuarios")}>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="bi bi-people-fill text-primary fs-3"></i>
                </div>
                <div><h6 className="text-muted mb-1">Usuarios</h6><h3 className="fw-bold m-0">Gestionar</h3></div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100 border-start border-danger border-5 cursor-pointer" onClick={() => navegarA("admin_errores")}>
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="bi bi-bug-fill text-danger fs-3"></i>
                </div>
                <div><h6 className="text-muted mb-1">Errores</h6><h3 className="fw-bold m-0">Revisar Logs</h3></div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100 border-start border-success border-5 cursor-pointer" onClick={() => navegarA("admin_sesiones")}>
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="bi bi-shield-lock-fill text-success fs-3"></i>
                </div>
                <div><h6 className="text-muted mb-1">Sesiones</h6><h3 className="fw-bold m-0">Auditoría</h3></div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );

  const VistaSesiones = () => {
    const [sesiones, setSesiones] = useState<Sesion[]>([]);
    useEffect(() => { axiosClient.get("/admin/logs/Listar_sesiones").then(res => setSesiones(res.data)); }, []);
    return (
      <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
         <div className="card-header bg-white py-3"><h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2"></i>Historial de Sesiones</h5></div>
        <div className="table-responsive" style={{maxHeight: '600px'}}>
            <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light"><tr><th>Usuario</th><th>Fecha</th><th>IP</th><th>Estado</th><th>Obs</th></tr></thead>
                <tbody>
                    {sesiones.map((s, i) => (
                        <tr key={i}>
                            <td><div>{s.usuario.email}</div><small className="text-muted">{s.usuario.rol}</small></td>
                            <td>{new Date(s.fecha_ingreso).toLocaleString()}</td>
                            <td>{s.ip_origen}</td>
                            <td><span className={`badge ${s.estado === 'EXITOSO' ? 'bg-success' : 'bg-danger'}`}>{s.estado}</span></td>
                            <td className="small text-muted">{s.observacion}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  };

  // 2. ACTUALIZAMOS LA VISTA DE ERRORES PARA MOSTRAR EL NOMBRE
  const VistaErrores = () => {
      const [logs, setLogs] = useState<LogError[]>([]);
      useEffect(() => { axiosClient.get("/admin/logs/errores?limite=50").then(res => setLogs(res.data)); }, []);
      return (
        <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn border-start border-danger border-4">
            <div className="card-header bg-white py-3 text-danger"><h5 className="mb-0 fw-bold"><i className="bi bi-bug-fill me-2"></i>Logs de Errores</h5></div>
            <div className="table-responsive" style={{maxHeight: '500px'}}>
                <table className="table table-striped table-sm mb-0">
                    <thead>
                        {/* 5 COLUMNAS EN EL HEADER */}
                        <tr><th>ID</th><th>Nombre Usuario</th><th>Fuente</th><th>Mensaje</th><th>Fecha</th></tr>
                    </thead>
                    <tbody>
                        {logs.map(l => (
                            <tr key={l.id_log}>
                                <td>{l.id_log}</td>
                                
                                {/* AÑADIMOS LA COLUMNA DE USUARIO QUE FALTABA */}
                                <td>
                                    {l.nombre_usuario ? (
                                        <span className="fw-bold text-dark">{l.nombre_usuario}</span>
                                    ) : (
                                        <span className="text-muted fst-italic">Sistema / Desconocido</span>
                                    )}
                                </td>

                                <td className="fw-bold">{l.fuente}</td>
                                <td className="text-danger small">{l.mensaje_error}</td>
                                <td>{new Date(l.fecha).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      );
  }

  // --- ESTRUCTURA PRINCIPAL ---
  return (
    <div className="wrapper">
      
      {/* 1. SIDEBAR */}
      <Sidebar 
        isOpen={active} 
        setIsOpen={setActive} 
        currentView={vista} 
        onNavigate={navegarA}
        isAdmin={true} 
      />

      {/* 2. CONTENIDO PRINCIPAL */}
      <div id="content">
        
        {/* --- NAVBAR DINÁMICO --- */}
        <Navbar 
          // 1. Usamos tu función 'toggleSidebar' (que usa 'active')
          toggleSidebar={toggleSidebar} 

          // 2. Usamos tu variable 'vista'
          currentView={vista}

          // 3. Usamos tu variable 'nombreUsuario'
          userName={nombreUsuario}
          
          // 4. Rol fijo
          userRole="Administrador" 

          // 5. Tu función de logout
          onLogout={handleLogout}

          // 6. Tu función 'navegarA' (que cambia la vista y cierra el menú)
          onNavigate={navegarA} 
        />

        {/* ÁREA DE VISTAS */}
        <div className="main-content-area h-100 p-3">
            {vista === 'admin_dashboard' && <VistaResumen />}  
            {vista === 'analizador' && <Analizador />} 
            {vista === 'gestion_usuarios' && <GestionUsuarios />}
            {vista === 'mapas' && <Mapas />}
            {vista === 'admin_sesiones' && <VistaSesiones />}
            {vista === 'admin_errores' && <VistaErrores />}
            {vista === 'admin_historial' && <Historial_admin />}
            {vista === 'catalogo' && <CatalogoAves />}
            {vista === 'catalogo' && <CatalogoAves />}
            
        </div>

      </div>
    </div>
  );
};