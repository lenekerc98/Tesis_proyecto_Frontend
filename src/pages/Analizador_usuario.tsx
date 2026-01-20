import { useState, useRef } from "react";
import axios from "axios";
import '../App.css';

// IMPORTA TUS OTRAS PÁGINAS
import { Resumen } from "./resumen_usuario";
import { Historial } from "./historial_usuario";
// import { Dashboard } from "./dashboard_usuario"; 
import { Perfil } from "./perfil_usuario";

export const Analizador = () => {
  // --- ESTADO PARA NAVEGACIÓN ---
  const [vista, setVista] = useState("analizador"); 

  // --- ESTADOS DE LÓGICA ---
  const [active, setActive] = useState(false); // Controla si el sidebar se ve (móvil)
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // --- REFERENCIAS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // --- FUNCIONES DE INTERFAZ ---
  const toggleSidebar = () => setActive(!active);
  
  // Función helper para navegar y cerrar el menú en móvil automáticamente
  const navegarA = (nuevaVista: string) => {
    setVista(nuevaVista);
    setActive(false); // Cierra el menú al elegir opción
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

  // --- LÓGICA DE GRABACIÓN (MP3) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/mpeg" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        const recordedFile = new File([audioBlob], "grabacion_usuario.mp3", { type: "audio/mpeg" });
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
    }
  };

  // --- ENVÍO A LA API ---
  const enviarAApi = async () => {
    let archivoParaEnviar = file;
    if (!archivoParaEnviar && audioChunks.current.length > 0) {
       const audioBlob = new Blob(audioChunks.current, { type: "audio/mpeg" });
       archivoParaEnviar = new File([audioBlob], "grabacion_temp.mp3", { type: "audio/mpeg" });
    }

    if (!archivoParaEnviar) {
      alert("No hay audio para procesar. Por favor graba o carga un archivo.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", archivoParaEnviar);

    try {
      const response = await axios.post("http://127.0.0.1:8000/v1/inferencia/procesar_inferencia", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      console.log("Respuesta API:", response.data); // Para depuración
      setResultado(response.data);
      setShowModal(true);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  // --- PROCESAR RESULTADOS (CORREGIDO PARA TU API) ---
  const obtenerListaResultados = () => {
    if (!resultado) return [];
    
    // 1. Si es un ARRAY (tu API devuelve [{ top_5: ... }])
    if (Array.isArray(resultado)) {
        // Verificamos si el primer elemento tiene la lista 'top_5'
        if (resultado.length > 0 && resultado[0].top_5 && Array.isArray(resultado[0].top_5)) {
            return resultado[0].top_5;
        }
        // Si no, devolvemos el array tal cual
        return resultado;
    }

    // 2. Si es un OBJETO directo ({ top_5: ... })
    if (resultado.top_5 && Array.isArray(resultado.top_5)) {
        return resultado.top_5;
    }
    
    // Fallback
    return [resultado];
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
            <a href="#" className={vista === "dashboard" ? "active" : ""} onClick={(e) => { e.preventDefault(); navegarA("dashboard"); }}>
                <i className="bi bi-bar-chart-fill"></i> Mi Dashboard
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
          <div className="d-flex align-items-center w-100">
            <button onClick={toggleSidebar} className="btn btn-success px-3 me-3">
                <i className="bi bi-list fs-5"></i>
            </button>
            <h5 className="mb-0 fw-bold text-muted text-capitalize">
                {vista === "analizador" ? "Análisis de Audio" : vista}
            </h5>
          </div>
        </nav>

        <div className="main-content-area h-100 p-3">
            
            {/* VISTA 1: ANALIZADOR */}
            {vista === "analizador" && (
                <div className="audio-center animate__animated animate__fadeIn">
                    <button 
                        className={`mic-button ${isRecording ? "bg-danger animate-pulse" : ""}`} 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!!audioUrl}
                    >
                        <i className={`bi ${isRecording ? "bi-stop-fill" : "bi-mic-fill"}`}></i>
                    </button>

                    <p className="mic-text mt-3">
                        {isRecording ? "Grabando..." : audioUrl ? "Audio listo para procesar" : "Presiona el micrófono para grabar"}
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

                    {!isRecording && !audioUrl && (
                        <div className="mt-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept="audio/*" 
                                onChange={handleFileChange} 
                            />
                            <button className="upload-btn" onClick={handleButtonClick}>
                                <i className="bi bi-upload me-2"></i>
                                Cargar archivo de audio
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* OTRAS VISTAS */}
            {vista === "resumen" && <Resumen />}
            {vista === "historial" && <Historial />}
            {/* {vista === "dashboard" && <Dashboard />} */}
            {vista === "perfil" && <Perfil />}

        </div>
      </div>

      {/* MODAL DE RESULTADOS */}
      {showModal && resultado && (
        <div className="modal-overlay">
          <div className="modal-content-custom">
            <h3 className="fw-bold text-success text-center mb-4">Resultados</h3>
            <div className="results-list">
              {obtenerListaResultados().map((item: any, index: number) => {
                const rawName = item.nombre_cientifico || item.prediccion || item.label || "Desconocido";
                const nombreCientifico = rawName.replace(/_/g, " ");
                const valorConfianza = item.probabilidad || item.confianza || item.score || 0;
                const porcentaje = (valorConfianza * 100).toFixed(1);

                return (
                  <div key={index} className="result-item p-3 mb-2 border rounded-4 d-flex justify-content-between align-items-center bg-light">
                    <div className="text-start">
                      <small className="text-muted d-block mb-1" style={{fontSize: '0.75rem'}}>
                         {index === 0 ? "Resultado Principal" : "Posible confusión"}
                      </small>
                      <span className="fw-bold d-block text-dark fst-italic text-capitalize" style={{fontSize: '1rem'}}>
                        {nombreCientifico}
                      </span>
                      <div className="progress mt-2" style={{ height: "6px", width: "120px" }}>
                        <div className="progress-bar bg-success" style={{ width: `${porcentaje}%` }}></div>
                      </div>
                    </div>
                    <span className="badge rounded-pill bg-success px-3 py-2" style={{fontSize: '0.9rem'}}>
                      {porcentaje}%
                    </span>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-success mt-4 w-100 rounded-pill py-2 fw-bold" onClick={() => setShowModal(false)}>
              Nueva Captura
            </button>
          </div>
        </div>
      )}
    </div>
  );
};