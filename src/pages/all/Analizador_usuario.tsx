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
  // --- ESTADOS ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [vista, setVista] = useState("analizador");
  const [active, setActive] = useState(true); 

  // --- DATOS ---
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [infoAvesMap, setInfoAvesMap] = useState<Record<string, { nombre: string; url: string }>>({});

  // --- GEOLOCALIZACIÓN ---
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [localizacion, setLocalizacion] = useState<string>("");

  const formatearTexto = (texto: string) => {
      if (!texto) return "Desconocido";
      return texto.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    const initData = async () => {
        try {
            const resUser = await axiosClient.get("/usuarios/me");
            const userData = resUser.data;
            setIsAdmin(userData.role_id === 0);
            localStorage.setItem("role_id", userData.role_id.toString());
            localStorage.setItem("userName", userData.nombre_completo);

            const resAves = await axiosClient.get("/inferencia/listar_aves");
            const mapa: any = {};
            if (Array.isArray(resAves.data)) {
                resAves.data.forEach((ave: any) => {
                    mapa[ave.nombre_cientifico] = { nombre: ave.nombre, url: ave.imagen_url };
                });
            }
            setInfoAvesMap(mapa);
        } catch (error) {
            console.error("Error init:", error);
        } finally {
            setCheckingRole(false);
        }
    };
    initData();
    if (window.innerWidth < 768) setActive(false);
  }, []);

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

  const toggleSidebar = () => setActive(!active);
  const navegarA = (nuevaVista: string) => { 
    setVista(nuevaVista); 
    if (window.innerWidth < 768) setActive(false);
  };
  const handleLogout = () => { localStorage.clear(); window.location.href = "/"; };

  const handleProcesarAudio = async (uploadedFile: File | null, recordedBlob: Blob | null) => {
    let archivoParaEnviar = uploadedFile;
    if (!archivoParaEnviar && recordedBlob) {
       archivoParaEnviar = new File([recordedBlob], "grabacion_temp.webm", { type: "audio/webm" });
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
      setResultado(response.data);
      setShowModal(true);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con la API de análisis.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingRole) return <div className="d-flex justify-content-center align-items-center vh-100">Cargando...</div>;

  return (
    <div className="wrapper">
      {!isAdmin && (
        <Sidebar isOpen={active} setIsOpen={setActive} currentView={vista} onNavigate={navegarA} isAdmin={isAdmin} />
      )}

      <div id="content" className="justify-content-start d-flex flex-column h-100 w-100 overflow-hidden">
        {!isAdmin && (
          <div className="flex-shrink-0">
            <Navbar 
                toggleSidebar={toggleSidebar} currentView={vista} 
                userName={localStorage.getItem("userName") || "Usuario"}
                userRole={isAdmin ? "Administrador" : "Investigador"}
                onLogout={() => { if(window.confirm("¿Salir?")) handleLogout(); }}
                onNavigate={navegarA}
            />
          </div>
        )}

        {/* --- CORRECCIÓN AQUÍ --- */}
        {/* Usamos un condicional estricto: O mostramos el analizador O mostramos el contenedor de otras vistas. NUNCA AMBOS. */}
        
        <div className="main-content-area flex-grow-1 w-100 p-0 overflow-hidden position-relative">
          
          {vista === "analizador" ? (
             // CASO A: Solo el Analizador (Sin padding extra, ocupa 100%)
             <AnalizadorAudio 
                onAnalizar={handleProcesarAudio} 
                loading={loading}
                onClear={() => setResultado(null)}
             />
          ) : (
             // CASO B: Cualquier otra vista (Con padding y scroll)
             <div className="p-3 h-100 overflow-auto">
                 {vista === 'resumen' && <Resumen onNavigate={navegarA} />}
                 {vista === 'mapas' && <Mapas />}
                 {vista === 'catalogo' && <CatalogoAves />}
                 {vista === 'historial' && <Historial />}
                 {vista === 'perfil' && <Perfil/>}

                 {isAdmin && vista === "admin_dashboard" && (
                    <div className="p-5 text-center bg-white rounded-4 shadow-sm">
                        <h2 className="fw-bold">Panel de Administración</h2>
                        <div className="mt-4">
                            <button className="btn btn-primary me-2" onClick={() => navegarA('analizador')}>Ir al Analizador</button>
                        </div>
                    </div>
                 )}
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
                 <button className="btn btn-success rounded-pill px-4 fw-bold" onClick={() => setShowModal(false)}>
                    Nuevo Análisis
                 </button>
             }
          />
      )}
    </div>
  );
};