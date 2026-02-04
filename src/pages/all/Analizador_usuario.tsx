import { useState, useRef, useEffect } from "react";
import axiosClient from "../../api/axiosClient"; 
import '../../App.css';

// COMPONENTES IMPORTS
import { Sidebar } from "../../components/Sidebar"; 
import { Navbar } from "../../components/Navbar"; // <--- 1. IMPORTAMOS NAVBAR
import { Resumen } from "../user/resumen_usuario";
import { Historial } from "../user/historial_usuario";
import { ModalResultados } from "../../components/ModalResultados"; 
import aveIcon from "../../assets/ave.png";
import { CatalogoAves } from "./CatalogoAves";
import { Mapas } from "./mapas";

// Si tienes los componentes de admin importados, mantenlos, 
// aunque idealmente deberían estar separados en DashboardAdmin.tsx
// Para este ejemplo, asumo que quieres mantener la lógica híbrida que me pasaste:

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

  // --- GEOLOCALIZACIÓN ---
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [localizacion, setLocalizacion] = useState<string>("");

  // --- 1. VERIFICAR ROL ---
  useEffect(() => {
    const verificarSesion = async () => {
        try {
            const response = await axiosClient.get("/usuarios/me");
            const userData = response.data;
            const esAdminReal = userData.role_id === 0; 
            
            setIsAdmin(esAdminReal);
            localStorage.setItem("role_id", userData.role_id.toString());
            localStorage.setItem("userName", userData.nombre_completo);

            setVista("analizador");
        } catch (error) {
            console.error("Error de sesión:", error);
            localStorage.clear();
            window.location.href = "/";
        } finally {
            setCheckingRole(false);
        }
    };
    verificarSesion();
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

  // --- 3. TEMPORIZADOR INACTIVIDAD ---
  useEffect(() => {
    const TIEMPO_LIMITE = 15 * 60 * 1000;
    let timer: number;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        alert("Sesión cerrada por inactividad.");
        handleLogout(); // Usamos la función helper
      }, TIEMPO_LIMITE);
    };

    const eventos = ['mousemove', 'keydown', 'click', 'scroll'];
    eventos.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); 
    obtenerUbicacion();

    return () => {
      eventos.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timer);
    };
  }, []);

  // --- REFERENCIAS Y HANDLERS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const toggleSidebar = () => setActive(!active);
  const navegarA = (nuevaVista: string) => { setVista(nuevaVista); setActive(false); };
  const handleButtonClick = () => fileInputRef.current?.click();

  // --- 2. NUEVA FUNCIÓN LOGOUT PARA EL NAVBAR ---
  const handleLogout = () => {
      if(window.confirm("¿Deseas cerrar sesión?")) {
          localStorage.clear();
          window.location.href = "/";
      }
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
  
  const abrirVistaPrevia = (url: string) => window.open(url, '_blank');

  if (checkingRole) {
      return (
          <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
              <div className="spinner-border text-success" role="status" style={{width: '3rem', height: '3rem'}}></div>
          </div>
      );
  }

  return (
    <div className="wrapper">
      
      {/* SOLO MOSTRAR SIDEBAR SI NO ES ADMIN */}
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
        
        {/* --- 3. REEMPLAZO DEL NAVBAR MANUAL POR EL COMPONENTE --- */}
        {!isAdmin && (
        <Navbar 
            toggleSidebar={toggleSidebar}
            currentView={vista}
            // Obtenemos el nombre del localStorage (guardado en el useEffect inicial)
            userName={localStorage.getItem("userName") || "Usuario"}
            // Determinamos el rol visual
            userRole={isAdmin ? "Administrador" : "Investigador"}
            onLogout={handleLogout}
            onNavigate={navegarA}
        />
        )}

        {/* ÁREA DE CONTENIDO */}
        <div className="main-content-area h-100 p-3">
          
          {/* VISTA ANALIZADOR (Usuario) */}
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

                  <div className="pie-analizador mt-5 text-center">
                      {!isRecording && !audioUrl && (
                          <>
                              <button className="upload-btn" onClick={handleButtonClick}>
                                  <i className="bi bi-upload me-2"></i> Subir archivo (mp3/wav)
                              </button>
                              
                              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileChange} />
                          </>
                          
                      )}
                      
                  </div>
                  <p className="text-muted mt-2 pie-analizador"> O puedes cargar tu archivo de audio</p>
              </div>
          )}

          {vista === 'resumen' && <Resumen onNavigate={navegarA} />}
          {vista === 'mapas' && <Mapas />}
          {vista === 'catalogo' && <CatalogoAves />}
          {vista === 'historial' && <Historial />}
          {/* VISTAS ADMIN */}
          {isAdmin && vista === "admin_dashboard" && (
              <div className="p-5 text-center bg-white rounded-4 shadow-sm h-100">
                  <h2 className="fw-bold">Panel de Administración</h2>
                  <p>Bienvenido. Selecciona una opción del menú.</p>
                  
                  {/* Botones temporales para probar navegación */}
                  <div className="mt-4">
                      <button className="btn btn-primary me-2" onClick={() => navegarA('analizador')}>
                          Ir al Analizador
                      </button>
                      <button className="btn btn-success" onClick={() => navegarA('admin_historial')}>
                          Ver Historial Global
                      </button>
                  </div>
              </div>
          )}

        </div>
      </div>

      {/* MODAL RESULTADOS */}
      {showModal && resultado && (
          <ModalResultados
             isOpen={showModal}
             onClose={iniciarNuevoAnalisis}
             titulo="Resultado del Análisis"
             prediccionPrincipal={resultado.prediccion_principal}
             listaPredicciones={obtenerListaResultados()}
             onImageClick={abrirVistaPrevia}
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