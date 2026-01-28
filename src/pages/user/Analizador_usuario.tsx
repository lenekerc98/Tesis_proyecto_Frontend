import { useState, useRef, useEffect } from "react";
import axios from "axios";
// Corregimos la ruta para que Vite encuentre tu CSS
import '../../App.css';

// IMPORTA TUS OTRAS PÁGINAS
import { Resumen } from "./resumen_usuario";
import { Historial } from "./historial_usuario";
// import { Dashboard } from "./dashboard_usuario"; 
import { Perfil } from "./perfil_usuario";
// Corregimos la ruta para que Vite encuentre tu imagen
import aveIcon from "../../assets/ave.png";

export const Analizador = () => {
  // --- ESTADO PARA NAVEGACIÓN ---
  const [vista, setVista] = useState("analizador"); 

  // --- ESTADOS DE LÓGICA ---
  const [active, setActive] = useState(false); 
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  //  GEOLOCALIZACIÓN
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [localizacion, setLocalizacion] = useState<string>("");

  // ⭐ OBTENER GEOLOCALIZACIÓN (Sin bloquear alertas)
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) return; // Si no soporta, simplemente no hace nada

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitud(lat);
        setLongitud(lon);
        setLocalizacion(`Lat: ${lat}, Lon: ${lon}`);
      },
      (error) => {
        console.warn("Ubicación no obtenida:", error.message);
        // No mostramos alert para no interrumpir al usuario
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // --- LÓGICA DE INACTIVIDAD (15 MINUTOS) ---
  useEffect(() => {
    const TIEMPO_LIMITE = 15 * 60 * 1000; 
    let timer: number;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        alert("Sesión cerrada por inactividad de 15 minutos.");
        localStorage.clear();
        window.location.href = "/"; 
      }, TIEMPO_LIMITE);
    };

    const eventos = ['mousemove', 'keydown', 'click', 'scroll'];
    eventos.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); 
    obtenerUbicacion(); // Intentamos obtener ubicación al cargar, silenciosamente

    return () => {
      eventos.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timer);
    };
  }, []);

  // --- REFERENCIAS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // --- FUNCIONES DE INTERFAZ ---
  const toggleSidebar = () => setActive(!active);
  
  const navegarA = (nuevaVista: string) => {
    setVista(nuevaVista);
    setActive(false); 
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const eliminarAudio = () => {
    setFile(null);
    setAudioUrl(null);
    setResultado(null);
    audioChunks.current = [];
  };

  // --- LÓGICA DE GRABACIÓN ---
  const startRecording = async () => {
    try {
      // Intentamos actualizar ubicación al grabar, pero no es obligatorio
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
        const recordedFile = new File([audioBlob], "grabacion_usuario.webm", { type: "audio/webm" });
        setFile(recordedFile);
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
      obtenerUbicacion(); // Intentamos obtener ubicación al subir archivo
    }
  };

  // --- ENVÍO A LA API (MODIFICADO PARA NO BLOQUEAR) ---
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

    // --- MODIFICACIÓN: ENVÍO CONDICIONAL ---
    // Si latitud/longitud existen, las envía. Si son null, envía 0 para que la API no falle.
    formData.append("latitud", (latitud !== null ? latitud : 0).toString());
    formData.append("longitud", (longitud !== null ? longitud : 0).toString());
    formData.append("localizacion", localizacion || "Ubicación no disponible"); // Texto por defecto

    try {
      const response = await axios.post("http://127.0.0.1:8000/v1/inferencia/procesar_inferencia", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
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

  const obtenerListaResultados = () => {
    if (!resultado) return [];
    if (resultado.top_5_predicciones && Array.isArray(resultado.top_5_predicciones)) {
        return resultado.top_5_predicciones;
    }
    return [];
  };

  const iniciarNuevoAnalisis = () => {
    setFile(null); 
    setAudioUrl(null); 
    setResultado(null); 
    setShowModal(false); 
    audioChunks.current = []; 
  };

  return (
    <div className="wrapper">
      {/* --- SIDEBAR --- */}
      <nav id="sidebar" className={active ? "active" : ""}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-25">
             <div className="logo text-success fw-bold fs-4">🦜 BirdIA</div>
             <button className="btn btn-sm btn-outline-light d-md-none" onClick={() => setActive(false)}>
                <i className="bi bi-x-lg"></i>
             </button>
        </div>

        <ul className="list-unstyled p-3">
          <li>
            <a href="#" className={vista === "analizador" ? "active" : ""} onClick={(e) => { e.preventDefault(); navegarA("analizador"); }}>
                <i className="bi bi-mic-fill"></i> Análisis de Audio
            </a>
          </li>
          <li>
            <a href="#" className={vista === "resumen" ? "active" : ""} onClick={(e) => { e.preventDefault(); navegarA("resumen"); }}>
                <i className="bi bi-house-fill"></i> Resumen
            </a>
          </li>
          <li>
            <a href="#" className={vista === "historial" ? "active" : ""} onClick={(e) => { e.preventDefault(); navegarA("historial"); }}>
                <i className="bi bi-clock-history"></i> Historial
            </a>
          </li>
          <li>
            <a href="#" className={vista === "perfil" ? "active" : ""} onClick={(e) => { e.preventDefault(); navegarA("perfil"); }}>
                <i className="bi bi-gear-fill"></i> Mi Perfil
            </a>
          </li>
        </ul>

        <div className="p-3 mt-auto">
          <button className="btn btn-outline-danger w-100 fw-bold border-2" onClick={() => { localStorage.clear(); window.location.reload(); }}>
            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div id="content">
        <nav className="navbar navbar-light bg-white shadow-sm px-4 py-3 sticky-top" style={{zIndex: 1020}}>
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              <button onClick={toggleSidebar} className="btn btn-success px-3 me-3">
                  <i className="bi bi-list fs-5"></i>
              </button>
              <h5 className="mb-0 fw-bold text-muted text-capitalize">
                  {vista === "analizador" ? "Análisis de Audio" : vista}
              </h5>
            </div>

            <div className="d-flex align-items-center bg-light border px-3 py-1 rounded-pill shadow-sm" style={{ cursor: 'pointer' }} onClick={() => navegarA("perfil")}>
               <div className="bg-success rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '30px', height: '30px' }}>
                  <i className="bi bi-person-fill text-white"></i>
               </div>
               <span className="fw-bold text-success me-1" style={{ fontSize: '0.85rem' }}>
                  {localStorage.getItem("userName") || "Investigador"}
               </span>
               <i className="bi bi-chevron-down text-muted small ms-1"></i>
            </div>
          </div>
        </nav>

        <div className="main-content-area h-100 p-3">
          {vista === "analizador" && (
              <div className="animate__animated animate__fadeIn">
                  <div className="encabezado-analizador d-flex flex-column align-items-center mb-4">
                      <h1>Lorem Ipsum</h1>
                      <p className="text-muted">Analiza grabaciones de audio para identificar aves.</p>
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
                              {isRecording ? "Grabando..." : audioUrl ? "Audio listo" : "Presiona el micrófono para grabar"}
                          </p>

                          {audioUrl && (
                              <div className="preview-box p-4 border rounded-4 bg-white shadow-sm mt-3" style={{width: '90%', maxWidth: '400px'}}>
                                  <audio src={audioUrl} controls className="w-100 mb-3" />
                                  <div className="d-flex gap-2">
                                      <button className="btn btn-success flex-grow-1 fw-bold rounded-pill" onClick={enviarAApi} disabled={loading}>
                                          {loading ? "Analizando..." : "Identificar Ave"}
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
                                  <i className="bi bi-upload me-2"></i> Cargar archivo
                              </button>
                              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileChange} />
                          </>
                      )}
                  </div>
              </div>
          )}

          {vista === "resumen" && <Resumen />}
          {vista === "historial" && <Historial />}
          {vista === "perfil" && <Perfil />}
        </div>
      </div>

      {showModal && resultado && (
        <div className="modal-overlay">
          <div className="modal-content-custom animate__animated animate__fadeIn">
            <h3 className="fw-bold text-success text-center mb-4">Resultados del Análisis</h3>

            <button className="btn-close-modal" onClick={iniciarNuevoAnalisis} aria-label="Cerrar">
              <i className="bi bi-x-lg"></i>
            </button>

            <h3 className="fw-bold text-success text-center mb-4">Resultados</h3>
            
            <div className="results-container-desktop">
              {obtenerListaResultados().map((item: any, index: number) => {
                const nombre = (item.nombre_cientifico || "Desconocido").replace(/_/g, " ");
                const porcentaje = ((item.probabilidad || 0) * 100).toFixed(1);
                const esTop1 = index === 0;

                return (
                  <div key={index} className={`result-card ${esTop1 ? 'top-1-card' : 'secondary-card'}`}>
                    {esTop1 && resultado.prediccion_principal?.url_imagen && (
                      <div className="top-1-image-container">
                        <img 
                          src={resultado.prediccion_principal.url_imagen} 
                          alt="Ave Identificada" 
                          className="img-fluid rounded-3"
                          crossOrigin="anonymous"
                        />
                        <div className="badge-identificacion">Identificación Principal</div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="text-start">
                        <span className={`fw-bold d-block ${esTop1 ? 'text-success fs-4' : 'text-muted'}`}>
                          {nombre}
                        </span>
                        <div className="progress mt-2" style={{ height: "8px", width: "150px" }}>
                          <div className={`progress-bar ${esTop1 ? 'bg-success' : 'bg-secondary'}`} style={{ width: `${porcentaje}%` }}></div>
                        </div>
                      </div>
                      <span className={`badge rounded-pill p-2 ${esTop1 ? 'bg-success' : 'bg-secondary opacity-50'}`}>
                        {porcentaje}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn btn-success mt-4 w-100 rounded-pill py-2 fw-bold" onClick={iniciarNuevoAnalisis}>
              Nuevo Análisis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};