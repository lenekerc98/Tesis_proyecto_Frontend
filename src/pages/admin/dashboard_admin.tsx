import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- IMPORTAMOS COMPONENTES COMPARTIDOS ---
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import '../../App.css';

// --- IMPORTAMOS LOS COMPONENTES FUNCIONALES ---
import { AnalizadorAudio } from "../../components/AnalizadorAudio";
import { ModalResultados } from "../../components/ModalResultados";

// --- IMPORTAMOS LAS OTRAS VISTAS ---
import { CatalogoAves } from "../all/CatalogoAves";
import { Historial_admin } from "./historial_admin";
import { GestionUsuarios } from "./gestionusuarios_admin";
import { Mapas } from "../all/Mapas";
import { Perfil } from "../all/perfil_usuario";

// --- TIPOS DE DATOS ---
interface DashboardStats {
    metricas: {
        logins_hoy: number;
        usuarios_totales: number;
    };
    tops: {
        dia: { especie: string; total: number; imagen: string | null } | null;
        semana: { especie: string; total: number; imagen: string | null } | null;
        general: { especie: string; total: number; imagen: string | null } | null;
    };
}

interface Sesion {
    usuario: { email: string; rol: string };
    fecha_ingreso: string;
    ip_origen: string;
    estado: string;
    observacion: string;
}

interface LogError {
    id_log: number;
    mensaje_error: string;
    fuente: string;
    fecha: string;
    nombre_usuario?: string;
}

export const DashboardAdmin = () => {
    // --- ESTADOS DE UI ---
    const [vista, setVista] = useState("admin_dashboard");
    const [active, setActive] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState("Cargando...");

    // --- ESTADOS PARA EL ANALIZADOR (Microfono) ---
    const [resultado, setResultado] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showNoBirdModal, setShowNoBirdModal] = useState(false);
    const [analizadorKey, setAnalizadorKey] = useState(0);
    const [infoAvesMap, setInfoAvesMap] = useState<Record<string, { nombre: string; url: string }>>({});

    // --- GEOLOCALIZACIÓN ---
    const [latitud, setLatitud] = useState<number | null>(null);
    const [longitud, setLongitud] = useState<number | null>(null);
    const [localizacion, setLocalizacion] = useState<string>("");

    // --- EFECTO: CARGA DE DATOS INICIALES ---
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 1. Datos del Usuario
                const storedName = localStorage.getItem("userName");
                if (storedName) setNombreUsuario(storedName);

                const res = await axiosClient.get("/usuarios/me");
                if (res.data && res.data.nombre_completo) {
                    setNombreUsuario(res.data.nombre_completo);
                    localStorage.setItem("userName", res.data.nombre_completo);
                }

                // 2. Catálogo de Aves (Para el Modal de Resultados)
                const resAves = await axiosClient.get("/inferencia/listar_aves");
                const mapa: any = {};
                if (Array.isArray(resAves.data)) {
                    resAves.data.forEach((ave: any) => {
                        mapa[ave.nombre_cientifico] = { nombre: ave.nombre, url: ave.imagen_url };
                    });
                }
                setInfoAvesMap(mapa);

            } catch (error) {
                console.error("Error cargando datos", error);
                setNombreUsuario("Administrador");
            }
        };
        fetchUserData();
    }, []);

    // --- HANDLERS GENERALES ---
    const toggleSidebar = () => setActive(!active);
    const navegarA = (v: string) => {
        setVista(v);
        if (window.innerWidth < 768) setActive(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role_id");
        localStorage.removeItem("userName");
        window.location.href = "/login";
    };

    const formatearTexto = (texto: string) => {
        if (!texto) return "Desconocido";
        return texto.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    // --- LÓGICA DEL ANALIZADOR ---
    // --- FUNCIÓN DE RESETEO (NUEVO ANÁLISIS) ---
    const handleReset = () => {
        setResultado(null);
        setShowModal(false);
        setShowNoBirdModal(false);
        setAnalizadorKey(Date.now());
    };

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitud(pos.coords.latitude);
                setLongitud(pos.coords.longitude);
                setLocalizacion(`Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}`);
            },
            (err) => console.warn("Ubicación error:", err.message),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleProcesarAudio = async (uploadedFile: File | null, recordedBlob: Blob | null) => {
        let archivoParaEnviar = uploadedFile;
        if (!archivoParaEnviar && recordedBlob) {
            // Detectamos si es iPhone (MP4) o Android/PC (WebM) basado en el tipo del Blob
            const esIphone = recordedBlob.type.includes("mp4");
            const extension = esIphone ? "mp4" : "webm";
            const mimeType = recordedBlob.type || (esIphone ? "audio/mp4" : "audio/webm");

            // Creamos el objeto File con el nombre y extensión correcta para el Backend
            archivoParaEnviar = new File([recordedBlob], `grabacion_birdia_alta_calidad.${extension}`, {
                type: mimeType
            });
        }
        if (!archivoParaEnviar) { alert("No hay audio para procesar."); return; }

        setLoading(true);
        obtenerUbicacion();

        const formData = new FormData();
        formData.append("file", archivoParaEnviar);
        formData.append("latitud", (latitud || 0).toString());
        formData.append("longitud", (longitud || 0).toString());
        formData.append("localizacion", localizacion || "Ubicación no disponible");

        try {
            const response = await axiosClient.post("/inferencia/procesar_inferencia", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const data = response.data;

            // VERIFICAMOS SI SE DETECTÓ ALGO O NO
            const especie = data.prediccion_principal.especie;
            const nombrePrediccion = (data.prediccion_principal.nombre || "").toLowerCase();
            const top1Nombre = (data.top_5_predicciones?.[0]?.nombre || "").toLowerCase();

            if (
                especie === "Desconocido" ||
                nombrePrediccion.includes("no se detectó") ||
                nombrePrediccion.includes("baja confianza") ||
                top1Nombre.includes("no se detectó")
            ) {
                setShowNoBirdModal(true);
            } else {
                setResultado(data);
                setShowModal(true);
            }

        } catch (error) {
            console.error(error);
            alert("Error al conectar con la API.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================================
    // VISTA: RESUMEN (EL DASHBOARD REAL CON TARJETAS)
    // =========================================================================
    const VistaResumen = () => {
        const [stats, setStats] = useState<DashboardStats | null>(null);
        const [loadingStats, setLoadingStats] = useState(true);

        useEffect(() => {
            const cargarStats = async () => {
                try {
                    const { data } = await axiosClient.get("/admin/logs/dashboard_stats");
                    setStats(data);
                } catch (error) {
                    console.error("Error cargando stats del dashboard", error);
                } finally {
                    setLoadingStats(false);
                }
            };
            cargarStats();
        }, []);

        // Componente interno para las tarjetas de Top Aves
        const TarjetaTop = ({ titulo, data, icono, color }: any) => {
            const infoAve = data ? infoAvesMap[data.especie] : null;
            const nombreAve = infoAve ? infoAve.nombre : (data ? data.especie.replace(/_/g, " ") : "Sin datos");
            const imagenAve = (data && data.imagen) ? data.imagen : (infoAve ? infoAve.url : "https://cdn-icons-png.flaticon.com/512/821/821260.png");
            return (
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden position-relative hover-card">
                        <div className={`card-header bg-white border-0 pt-4 pb-0 d-flex align-items-center text-${color}`}>
                            <i className={`bi ${icono} me-2 fs-5`}></i>
                            <h6 className="fw-bold mb-0 text-uppercase small ls-1 opacity-75">{titulo}</h6>
                        </div>
                        <div className="card-body text-center pt-3 pb-4">
                            {data ? (
                                <>
                                    <div className="mb-3 position-relative d-inline-block">
                                        <img
                                            src={imagenAve}
                                            alt={nombreAve}
                                            className="rounded-circle shadow-sm border border-4 border-white object-fit-cover"
                                            style={{ width: '110px', height: '110px', backgroundColor: '#f8f9fa' }}
                                        />
                                        <span className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${color} border border-2 border-white shadow-sm`} style={{ fontSize: '0.9rem' }}>
                                            {data.total}
                                        </span>
                                    </div>
                                    <h5 className="fw-bold text-dark mb-1 text-capitalize">{nombreAve}</h5>
                                    <small className="text-muted">Identificaciones realizadas</small>
                                </>
                            ) : (
                                <div className="py-4 text-muted opacity-50">
                                    <i className="bi bi-search fs-1 d-block mb-2"></i>
                                    <small>No hay registros</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };

        if (loadingStats) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

        return (
            <div className="animate__animated animate__fadeIn pb-5">
                {/* 1. HERO */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h2 className="fw-bold text-dark m-0">Dashboard General</h2>
                        <p className="text-muted m-0">Resumen de actividad del sistema BirdIA</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-pill shadow-sm border d-flex align-items-center">
                        <i className="bi bi-calendar-check me-2 text-success"></i>
                        <span className="fw-bold text-secondary small">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* 2. MÉTRICAS (TARJETAS GRANDES) */}
                <div className="row g-4 mb-5">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center bg-white h-100">
                            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle me-3">
                                <i className="bi bi-person-check-fill fs-3"></i>
                            </div>
                            <div>
                                <h2 className="fw-bold m-0">{stats?.metricas?.logins_hoy || 0}</h2>
                                <small className="text-muted fw-bold">Logins Hoy</small>
                            </div>
                        </div>
                    </div>
                    {/* TARJETA 2: USUARIOS ONLINE */}
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center bg-white h-100">
                            <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle me-3">
                                {/* Cambiamos el icono a uno de "señal" o "broadcast" */}
                                <i className="bi bi-broadcast fs-3"></i>
                            </div>
                            <div>
                                <h2 className="fw-bold m-0">{stats?.metricas?.usuarios_totales || 0}</h2>
                                {/* Cambiamos el texto para que sea claro */}
                                <small className="text-muted fw-bold">Usuarios En Línea</small>
                            </div>
                        </div>
                    </div>
                    {/* Atajo al Analizador */}
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 p-3 h-100 text-white position-relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #198754, #20c997)' }}>
                            <i className="bi bi-soundwave position-absolute" style={{ fontSize: '8rem', opacity: 0.1, right: '-20px', bottom: '-40px' }}></i>
                            <div className="d-flex justify-content-between align-items-center h-100 position-relative z-1 px-2">
                                <div>
                                    <h4 className="fw-bold mb-1">¿Nueva identificación?</h4>
                                    <p className="mb-0 opacity-75 small">Accede al módulo de inteligencia artificial.</p>
                                </div>
                                <button onClick={() => navegarA('analizador')} className="btn btn-light rounded-pill fw-bold text-success px-4 py-2 shadow-sm">
                                    <i className="bi bi-mic-fill me-2"></i> Ir al Analizador
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. TOPS DE AVES */}
                <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-bar-chart-line-fill text-dark me-2"></i>
                    <h5 className="fw-bold text-dark m-0">Tendencias de Aves</h5>
                </div>
                <div className="row g-4 mb-5">
                    <TarjetaTop titulo="Top del Día" data={stats?.tops?.dia} icono="bi-sun-fill" color="warning" />
                    <TarjetaTop titulo="Top Semanal" data={stats?.tops?.semana} icono="bi-calendar-week-fill" color="info" />
                    <TarjetaTop titulo="Más Frecuente (Histórico)" data={stats?.tops?.general} icono="bi-trophy-fill" color="success" />
                </div>

                {/* 4. ACCESOS ADMINISTRATIVOS */}
                <h5 className="fw-bold text-dark mb-3">Gestión del Sistema</h5>
                <div className="row g-3">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-3 h-100 hover-card cursor-pointer" onClick={() => navegarA("gestion_usuarios")}>
                            <div className="d-flex align-items-center">
                                <div className="bg-secondary bg-opacity-10 p-2 rounded-3 me-3"><i className="bi bi-gear-fill text-secondary fs-4"></i></div>
                                <div><h6 className="fw-bold m-0 text-dark">Gestionar Usuarios</h6><small className="text-muted">Altas, bajas y edición</small></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-3 h-100 hover-card cursor-pointer" onClick={() => navegarA("admin_errores")}>
                            <div className="d-flex align-items-center">
                                <div className="bg-danger bg-opacity-10 p-2 rounded-3 me-3"><i className="bi bi-shield-exclamation text-danger fs-4"></i></div>
                                <div><h6 className="fw-bold m-0 text-dark">Logs de Errores</h6><small className="text-muted">Monitoreo de fallos</small></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-3 h-100 hover-card cursor-pointer" onClick={() => navegarA("admin_sesiones")}>
                            <div className="d-flex align-items-center">
                                <div className="bg-info bg-opacity-10 p-2 rounded-3 me-3"><i className="bi bi-clock-history text-info fs-4"></i></div>
                                <div><h6 className="fw-bold m-0 text-dark">Historial de Sesiones</h6><small className="text-muted">Accesos y auditoría</small></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- OTRAS VISTAS (TABLAS SIMPLES) ---
    const VistaSesiones = () => {
        const [sesiones, setSesiones] = useState<Sesion[]>([]);
        useEffect(() => { axiosClient.get("/admin/logs/Listar_sesiones").then(res => setSesiones(res.data)); }, []);
        return (
            <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                <div className="card-header bg-white py-3"><h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2"></i>Historial de Sesiones</h5></div>
                <div className="table-responsive" style={{ maxHeight: '600px' }}>
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

    const VistaErrores = () => {
        const [logs, setLogs] = useState<LogError[]>([]);
        useEffect(() => { axiosClient.get("/admin/logs/errores?limite=50").then(res => setLogs(res.data)); }, []);
        return (
            <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn border-start border-danger border-4">
                <div className="card-header bg-white py-3 text-danger"><h5 className="mb-0 fw-bold"><i className="bi bi-bug-fill me-2"></i>Logs de Errores</h5></div>
                <div className="table-responsive" style={{ maxHeight: '500px' }}>
                    <table className="table table-striped table-sm mb-0">
                        <thead><tr><th>ID</th><th>Nombre Usuario</th><th>Fuente</th><th>Mensaje</th><th>Fecha</th></tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.id_log}>
                                    <td>{l.id_log}</td>
                                    <td>{l.nombre_usuario ? <span className="fw-bold text-dark">{l.nombre_usuario}</span> : <span className="text-muted fst-italic">Sistema / Desconocido</span>}</td>
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
        <div className="wrapper" style={{ height: '100vh', overflow: 'hidden' }}>

            {/* 1. SIDEBAR */}
            <Sidebar
                isOpen={active} setIsOpen={setActive} currentView={vista} onNavigate={navegarA} isAdmin={true}
            />

            {/* 2. CONTENIDO PRINCIPAL */}
            <div id="content" className="d-flex flex-column h-100 w-100 overflow-hidden position-relative">

                {/* NAVBAR */}
                <div className="flex-shrink-0 w-100">
                    <Navbar
                        toggleSidebar={toggleSidebar} currentView={vista}
                        userName={nombreUsuario} userRole="Administrador"
                        onLogout={handleLogout} onNavigate={navegarA}
                    />
                </div>

                {/* ÁREA DE CONTENIDO */}
                <div className="flex-grow-1 w-100 overflow-hidden position-relative d-flex flex-column">

                    {/* Vista Analizador: Sin Padding */}
                    {vista === 'analizador' ? (
                        <div className="flex-grow-1 h-100 overflow-hidden">
                            <AnalizadorAudio
                                key={analizadorKey}
                                onAnalizar={handleProcesarAudio}
                                loading={loading}
                                onClear={() => setResultado(null)}
                            />
                        </div>
                    ) : (
                        // Vistas Dashboard: Con Padding y Scroll
                        <div className="h-100 overflow-auto p-3">
                            {vista === 'admin_dashboard' && <VistaResumen />}
                            {vista === 'gestion_usuarios' && <GestionUsuarios />}
                            {vista === 'mapas' && <Mapas />}
                            {vista === 'admin_sesiones' && <VistaSesiones />}
                            {vista === 'admin_errores' && <VistaErrores />}
                            {vista === 'admin_historial' && <Historial_admin />}
                            {vista === 'catalogo' && <CatalogoAves />}
                            {vista === 'perfil' && <Perfil />}
                        </div>
                    )}

                </div>
            </div>

            {/* MODAL RESULTADOS */}
            {showModal && resultado && (
                <ModalResultados
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    titulo="Resultado del Análisis"
                    prediccionPrincipal={{
                        nombre: infoAvesMap[resultado.prediccion_principal.especie]?.nombre || formatearTexto(resultado.prediccion_principal.especie),
                        nombre_cientifico: resultado.prediccion_principal.especie,
                        probabilidad: resultado.prediccion_principal.probabilidad,
                        url_imagen: resultado.prediccion_principal.url_imagen || infoAvesMap[resultado.prediccion_principal.especie]?.url
                    }}
                    listaPredicciones={resultado.top_5_predicciones || []}
                    botonAccion={
                        <button className="btn btn-success rounded-pill px-4 fw-bold" onClick={handleReset}>
                            Nuevo Análisis
                        </button>
                    }
                />
            )}

            {/* MODAL NO SE DETECTÓ AVE (NUEVO) */}
            {showNoBirdModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4 animate__animated animate__zoomIn">
                            <div className="modal-body text-center p-5">
                                <div className="mb-4 text-warning">
                                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h3 className="fw-bold mb-3 text-dark">No se detectó ninguna ave</h3>
                                <p className="text-muted mb-4 fs-5">
                                    El audio analizado no contiene cantos de aves reconocibles o la confianza es muy baja.
                                </p>
                                <div className="d-grid gap-2 col-8 mx-auto">
                                    <button
                                        className="btn btn-warning rounded-pill px-5 fw-bold text-white shadow-sm"
                                        onClick={handleReset}
                                    >
                                        <i className="bi bi-arrow-repeat me-2"></i>Intentar de nuevo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};