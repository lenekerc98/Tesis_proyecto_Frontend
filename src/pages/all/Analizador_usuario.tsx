import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient"; 
import '../../App.css';

// --- COMPONENTES IMPORTS ---
import { Sidebar } from "../../components/Sidebar"; 
import { Navbar } from "../../components/Navbar"; 
import { AnalizadorAudio } from "../../components/AnalizadorAudio"; 
import { Resumen } from "../user/resumen_usuario";
import { Historial } from "../user/historial_usuario";
import { ModalResultados } from "../../components/ModalResultados"; 
import { CatalogoAves } from "./CatalogoAves";
import { Mapas } from "../all/Mapas";
import { Perfil } from "../all/perfil_usuario"; 

export const Analizador = () => {
  // --- ESTADOS DE CONTROL ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [vista, setVista] = useState("analizador");
  const [active, setActive] = useState(true); 

  // --- ESTADOS DE DATOS ---
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [infoAvesMap, setInfoAvesMap] = useState<Record<string, { nombre: string; url: string }>>({});

  // --- ESTADOS DE GEOLOCALIZACIÓN ---
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [localizacion, setLocalizacion] = useState<string>("");

  const formatearTexto = (texto: string) => {
      if (!texto) return "Desconocido";
      return texto.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // --- INICIALIZACIÓN DE DATOS Y ROL ---
  useEffect(() => {
    const initData = async () => {
        try {
            // Obtenemos info del usuario actual
            const resUser = await axiosClient.get("/usuarios/me");
            const userData = resUser.data;
            setIsAdmin(userData.role_id === 0);
            localStorage.setItem("role_id", userData.role_id.toString());
            localStorage.setItem("userName", userData.nombre_completo);

            // Cargamos catálogo de aves para tener nombres comunes y fotos listas
            const resAves = await axiosClient.get("/inferencia/listar_aves");
            const mapa: any = {};
            if (Array.isArray(resAves.data)) {
                resAves.data.forEach((ave: any) => {
                    mapa[ave.nombre_cientifico] = { 
                      nombre: ave.nombre, 
                      url: ave.imagen_url 
                    };
                });
            }
            setInfoAvesMap(mapa);
        } catch (error) {
            console.error("Error al inicializar datos:", error);
        } finally {
            setCheckingRole(false);
        }
    };
    initData();
    
    // Auto-cerrar sidebar en móviles al inicio
    if (window.innerWidth < 768) setActive(false);
  }, []);

  // --- FUNCIÓN DE GEOLOCALIZACIÓN ---
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
        setLocalizacion(`Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}`);
      },
      (err) => console.warn("Ubicación no disponible:", err.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const toggleSidebar = () => setActive(!active);
  
  const navegarA = (nuevaVista: string) => { 
    setVista(nuevaVista); 
    if (window.innerWidth < 768) setActive(false);
  };

  const handleLogout = () => { 
    localStorage.clear(); 
    window.location.href = "/"; 
  };

  // --- LÓGICA DE PROCESAMIENTO DE AUDIO (ALTA CALIDAD) ---
  const handleProcesarAudio = async (uploadedFile: File | null, recordedBlob: Blob | null) => {
    let archivoParaEnviar: File | null = uploadedFile;

    // 1. Si es una grabación nueva desde el componente AnalizadorAudio
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

    if (!archivoParaEnviar) { 
      alert("No hay audio seleccionado o grabado."); 
      return; 
    }

    setLoading(true);
    // Intentamos refrescar la ubicación justo antes de enviar
    obtenerUbicacion(); 

    const formData = new FormData();
    formData.append("file", archivoParaEnviar);
    formData.append("latitud", (latitud || 0).toString());
    formData.append("longitud", (longitud || 0).toString());
    formData.append("localizacion", localizacion || "Ubicación no proporcionada");

    try {
      const response = await axiosClient.post("/inferencia/procesar_inferencia", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResultado(response.data);
      setShowModal(true); // Abrimos el modal de resultados
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Error al procesar el audio. Revisa tu conexión.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-grow text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      {/* SIDEBAR (Solo para Investigadores) */}
      {!isAdmin && (
        <Sidebar 
          isOpen={active} 
          setIsOpen={setActive} 
          currentView={vista} 
          onNavigate={navegarA} 
          isAdmin={isAdmin} 
        />
      )}

      <div id="content" className="justify-content-start d-flex flex-column h-100 w-100 overflow-hidden bg-light">
        {/* NAVBAR */}
        {!isAdmin && (
          <div className="flex-shrink-0">
            <Navbar 
                toggleSidebar={toggleSidebar} 
                currentView={vista} 
                userName={localStorage.getItem("userName") || "Usuario"}
                userRole={isAdmin ? "Administrador" : "Investigador"}
                onLogout={() => { if(window.confirm("¿Seguro que deseas salir?")) handleLogout(); }}
                onNavigate={navegarA}
            />
          </div>
        )}

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <div className="main-content-area flex-grow-1 w-100 p-0 overflow-hidden position-relative">
          
          {/* Vista Principal: Analizador de Audio */}
          {vista === "analizador" ? (
             <AnalizadorAudio 
                onAnalizar={handleProcesarAudio} 
                loading={loading}
                onClear={() => setResultado(null)}
             />
          ) : (
             /* Otras Vistas (Resumen, Mapas, etc.) con Scroll independiente */
             <div className="p-3 h-100 overflow-auto">
                 {vista === 'resumen' && <Resumen onNavigate={navegarA} />}
                 {vista === 'mapas' && <Mapas />}
                 {vista === 'catalogo' && <CatalogoAves />}
                 {vista === 'historial' && <Historial />}
                 {vista === 'perfil' && <Perfil/>}

                 {/* Fallback para Admin en esta ruta si fuera necesario */}
                 {isAdmin && vista === "admin_dashboard" && (
                    <div className="p-5 text-center bg-white rounded-4 shadow-sm">
                        <h2 className="fw-bold">Panel de Administración</h2>
                        <div className="mt-4">
                            <button className="btn btn-success" onClick={() => navegarA('analizador')}>
                              Volver al Analizador
                            </button>
                        </div>
                    </div>
                 )}
             </div>
          )}
        </div>
      </div>

      {/* MODAL GLOBAL DE RESULTADOS */}
      {showModal && resultado && (
          <ModalResultados
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              titulo="Resultado de Identificación"
              
              // Mapeo inteligente de datos para el modal
              prediccionPrincipal={{
                  nombre: infoAvesMap[resultado.prediccion_principal.especie]?.nombre || formatearTexto(resultado.prediccion_principal.especie),
                  nombre_cientifico: resultado.prediccion_principal.especie,
                  probabilidad: resultado.prediccion_principal.probabilidad,
                  url_imagen: resultado.prediccion_principal.url_imagen || infoAvesMap[resultado.prediccion_principal.especie]?.url
              }}
              
              listaPredicciones={resultado.top_5_predicciones || []}
              
              botonAccion={
                  <button className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowModal(false)}>
                    <i className="bi bi-mic me-2"></i>Nueva Captura
                  </button>
              }
          />
      )}
    </div>
  );
};