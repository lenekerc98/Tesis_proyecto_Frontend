import { useState, useRef, useEffect } from "react";
import axiosClient from "../../api/axiosClient"; 
import '../../App.css';

// --- COMPONENTES IMPORTS ---
import { Sidebar } from "../../components/Sidebar"; 
import { Navbar } from "../../components/Navbar"; 
import { Resumen } from "../user/resumen_usuario";
import { Historial } from "../user/historial_usuario";
import { ModalResultados } from "../../components/ModalResultados"; 
import { CatalogoAves } from "./CatalogoAves";
import { Mapas } from "../all/Mapas";

// --- IMPORTACIÓN DEL PERFIL (Asegúrate que la ruta sea correcta) ---
import { Perfil } from "../all/perfil_usuario"; 

import aveIcon from "../../assets/ave.png";

export const Analizador = () => {
  // --- ESTADOS DE SEGURIDAD Y CARGA ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [vista, setVista] = useState("analizador");
  const [active, setActive] = useState(false);

  // --- ESTADOS DEL ANALIZADOR ---
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // --- ESTADO PARA DICCIONARIO DE NOMBRES DE AVES ---
  const [infoAvesMap, setInfoAvesMap] = useState<Record<string, { nombre: string; url: string }>>({});

  // --- GEOLOCALIZACIÓN ---
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [localizacion, setLocalizacion] = useState<string>("");

  // --- HELPER: FORMATEAR TEXTO ---
  const formatearTexto = (texto: string) => {
      if (!texto) return "Desconocido";
      return texto.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // --- 1. VERIFICAR ROL Y CARGAR CATÁLOGO ---
  useEffect(() => {
    const initData = async () => {
        try {
            // A. Verificar Sesión
            const resUser = await axiosClient.get("/usuarios/me");
            const userData = resUser.data;
            const esAdminReal = userData.role_id === 0; 
            
            setIsAdmin(esAdminReal);
            localStorage.setItem("role_id", userData.role_id.toString());
            localStorage.setItem("userName", userData.nombre_completo);

            // B. Cargar Catálogo (Para traducir nombres científicos en el Modal)
            const resAves = await axiosClient.get("/inferencia/listar_aves");
            const mapa: any = {};
            if (Array.isArray(resAves.data)) {
                resAves.data.forEach((ave: any) => {
                    mapa[ave.nombre_cientifico] = { nombre: ave.nombre, url: ave.imagen_url };
                });
            }
            setInfoAvesMap(mapa);

        } catch (error) {
            console.error("Error inicializando:", error);
        } finally {
            setCheckingRole(false);
        }
    };
    initData();
  }, []);

  // --- 2. OBTENER UBICACIÓN ---
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitud(lat);
        setLongitud(lon);
        setLocalizacion(`Lat: ${lat}, Lon: ${lon}`);
      },
      (error) => console.warn("Ubicación no obtenida:", error.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // --- 3. TEMPORIZADOR INACTIVIDAD (AMABLE) ---
  useEffect(() => {
    const MINUTOS_LIMITE = 10; 
    const TIEMPO_MS = MINUTOS_LIMITE * 60 * 1000; 
    let timer: number;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Preguntar antes de cerrar
        const seguir = window.confirm(`Tu sesión ha estado inactiva por ${MINUTOS_LIMITE} minutos. ¿Quieres mantenerla abierta?`);
        if (seguir) {
          resetTimer();
        } else {
          handleLogout();
        }
      }, TIEMPO_MS);
    };

    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    eventos.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); 
    obtenerUbicacion();

    return () => {
      eventos.forEach(event => window.removeEventListener(event, resetTimer));
      if (timer) clearTimeout(timer);
    };
  }, []);

  // --- REFERENCIAS Y HANDLERS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const toggleSidebar = () => setActive(!active);
  const navegarA = (nuevaVista: string) => { setVista(nuevaVista); setActive(false); };
  const handleButtonClick = () => fileInputRef.current?.click();

  const handleLogout = () => {
      localStorage.clear();
      window.location.href = "/";
  };

  const eliminarAudio = () => {
    setFile(null);
    setAudioUrl(null);
    setResultado(null);
    audioChunks.current = [];
  };

  // --- LÓGICA GRABACIÓN ---
  const startRecording = async () => {
    try {
      obtenerUbicacion();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFile(new File([audioBlob], "grabacion_usuario.webm", { type: "audio/webm" }));
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setAudioUrl(null);
      setFile(null);
    } catch (err) {
      alert("Error: Activa los permisos del micrófono.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      obtenerUbicacion();
    }
  };

  // --- ENVÍO API ---
  const enviarAApi = async () => {
    let archivoParaEnviar = file;
    if (!archivoParaEnviar && audioChunks.current.length > 0) {
       const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
       archivoParaEnviar = new File([audioBlob], "grabacion_temp.webm", { type: "audio/webm" });
    }

    if (!archivoParaEnviar) {
      alert("No hay audio para procesar.");
      return;
    }

    setLoading(true);
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
      alert("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  const obtenerListaResultados = () => resultado?.top_5_predicciones || [];
  
  const iniciarNuevoAnalisis = () => {
    setFile(null); 
    setAudioUrl(null); 
    setResultado(null); 
    setShowModal(false); 
    audioChunks.current = []; 
  };
  
  if (checkingRole) {
      return (
          <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
              <div className="spinner-border text-success" role="status" style={{width: '3rem', height: '3rem'}}></div>
          </div>
      );
  }

  return (
    <div className="wrapper">
      
      {!isAdmin && (
        <Sidebar 
          isOpen={active} 
          setIsOpen={setActive} 
          currentView={vista} 
          onNavigate={navegarA}
          isAdmin={isAdmin} 
        />
      )}

      <div id="content">
        
        {/* NAVBAR */}
        {!isAdmin && (
        <Navbar 
            toggleSidebar={toggleSidebar}
            currentView={vista}
            userName={localStorage.getItem("userName") || "Usuario"}
            userRole={isAdmin ? "Administrador" : "Investigador"}
            onLogout={() => { if(window.confirm("¿Cerrar sesión?")) handleLogout(); }}
            onNavigate={navegarA}
        />
        )}

        {/* ÁREA PRINCIPAL */}
        <div className="main-content-area h-100 p-3">
          
          {/* 1. VISTA ANALIZADOR */}
          {vista === "analizador" && (
              <div className="animate__animated animate__fadeIn">
                  <div className="encabezado-analizador d-flex flex-column align-items-center mb-4">
                      <h1>BirdIA</h1>
                      <p className="text-muted">Graba o sube un audio para identificar la especie de ave.</p>
                  </div>

                  <div className="d-flex justify-content-center">
                      <div className="audio-center">
                          <button 
                              className={`mic-button ${isRecording ? "bg-danger animate-pulse" : ""}`} 
                              onClick={isRecording ? stopRecording : startRecording}
                              disabled={!!audioUrl}
                          >
                              <img src={aveIcon} alt="Ave" className={`bird-img ${isRecording ? "singing" : ""}`} />
                          </button>
                          
                          <p className="mic-text mt-3 txtcolor">
                              {isRecording ? "Grabando..." : audioUrl ? "Audio listo para analizar" : "Toca el ave para grabar"}
                          </p>

                          {audioUrl && (
                              <div className="preview-box p-4 border rounded-4 bg-white shadow-sm mt-3" style={{width: '90%', maxWidth: '400px'}}>
                                  <audio src={audioUrl} controls className="w-100 mb-3" />
                                  <div className="d-flex gap-2">
                                      <button className="btn btn-success flex-grow-1 fw-bold rounded-pill" onClick={enviarAApi} disabled={loading}>
                                          {loading ? <> <span className="spinner-border spinner-border-sm me-2"/> Analizando... </> : "Identificar Ave"}
                                      </button>
                                      <button className="btn btn-outline-danger rounded-circle p-2" onClick={eliminarAudio}>
                                          <i className="bi bi-trash3-fill"></i>
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* CONTENEDOR DEL BOTÓN */}
                  {/* 'd-flex justify-content-center' es lo que lo centra horizontalmente */}
                  <div className="d-flex justify-content-center mt-3">
                      {!isRecording && !audioUrl && (
                          <>
                              <button className="btn btn-light border shadow-sm px-4 py-2" onClick={handleButtonClick}>
                                  <i className="bi bi-upload me-2"></i> Subir archivo (mp3/wav)
                              </button>
                              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileChange} />
                          </>
                      )}
                  </div>

                  {/* TEXTO DE ABAJO */}
                  {/* 'text-center' centra el texto */}
                  <p className="text-center text-muted mt-2 small">
                      O puedes cargar tu archivo de audio
                  </p>
                  
              </div>
          )}

          {/* 2. OTRAS VISTAS */}
          {vista === 'resumen' && <Resumen onNavigate={navegarA} />}
          {vista === 'mapas' && <Mapas />}
          {vista === 'catalogo' && <CatalogoAves />}
          {vista === 'historial' && <Historial />}
          
          {/* 3. VISTA PERFIL - ¡AQUÍ ESTABA EL PROBLEMA! */}
          {vista === 'perfil' && <Perfil/>}

          {/* 4. DASHBOARD ADMIN */}
          {isAdmin && vista === "admin_dashboard" && (
              <div className="p-5 text-center bg-white rounded-4 shadow-sm h-100">
                  <h2 className="fw-bold">Panel de Administración</h2>
                  <p>Bienvenido. Selecciona una opción del menú.</p>
                  <div className="mt-4">
                      <button className="btn btn-primary me-2" onClick={() => navegarA('analizador')}>Ir al Analizador</button>
                      <button className="btn btn-success" onClick={() => navegarA('admin_historial')}>Ver Historial Global</button>
                  </div>
              </div>
          )}

        </div>
      </div>

      {/* --- MODAL RESULTADOS --- */}
      {showModal && resultado && (
          <ModalResultados
             isOpen={showModal}
             onClose={iniciarNuevoAnalisis}
             titulo="Resultado del Análisis"
             
             // MAPEO DE DATOS PARA QUE SE VEAN NOMBRES Y FOTOS
             prediccionPrincipal={{
                 // Buscamos nombre común o formateamos el científico
                 nombre: infoAvesMap[resultado.prediccion_principal.especie]?.nombre || formatearTexto(resultado.prediccion_principal.especie),
                 
                 // Nombre científico tal cual viene de la API
                 nombre_cientifico: resultado.prediccion_principal.especie,
                 
                 probabilidad: resultado.prediccion_principal.probabilidad,
                 
                 // Prioridad: Foto del análisis > Foto del catálogo > Null
                 url_imagen: resultado.prediccion_principal.url_imagen || infoAvesMap[resultado.prediccion_principal.especie]?.url
             }}
             
             listaPredicciones={obtenerListaResultados()}
             
             botonAccion={
                 <button className="btn btn-success rounded-pill px-4 fw-bold" onClick={iniciarNuevoAnalisis}>
                    Nuevo Análisis
                 </button>
             }
          />
      )}
    </div>
  );
};