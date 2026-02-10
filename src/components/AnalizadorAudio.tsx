import React, { useState, useRef, useEffect } from 'react';
import aveIcon from "../assets/ave.png"; 
import "./../App.css"; 

interface AnalizadorAudioProps {
  onAnalizar: (file: File | null, audioBlob: Blob | null) => void;
  loading: boolean;
  onClear: () => void;
}

export const AnalizadorAudio: React.FC<AnalizadorAudioProps> = ({ onAnalizar, loading, onClear }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 1. NUEVO: Referencia para guardar el formato que eligió el navegador (mp4 o webm)
  const mimeTypeRef = useRef<string>("");

  useEffect(() => {
    return () => { 
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
         mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      // ------------------------------------------------------
      // PASO A: DETECTAR EL MEJOR FORMATO (IOS vs ANDROID/PC)
      // ------------------------------------------------------
      let selectedMimeType = "";
      
      // El orden importa: Primero verificamos MP4 para Safari/iOS
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        selectedMimeType = "audio/mp4"; 
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        selectedMimeType = "audio/webm;codecs=opus"; 
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        selectedMimeType = "audio/webm"; 
      } else {
        selectedMimeType = ""; // Dejar vacío para que use el default
      }

      console.log("Formato de grabación seleccionado:", selectedMimeType || "Default");
      mimeTypeRef.current = selectedMimeType; // Guardamos la elección

      // ------------------------------------------------------
      // PASO B: CONFIGURACIÓN DE ALTA CALIDAD (SIN FILTROS)
      // ------------------------------------------------------
      const constraints = {
        audio: {
          echoCancellation: false,  // IMPORTANTE: No borrar el eco natural
          autoGainControl: false,   // IMPORTANTE: No subir/bajar volumen solo
          noiseSuppression: false,  // CRUCIAL: Evita que el celular borre los pájaros pensando que son ruido
          channelCount: 1           // Mono es más estable
          // Nota: No forzamos sampleRate para evitar errores en iOS
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // ------------------------------------------------------
      // PASO C: CONFIGURAR EL GRABADOR (BITRATE)
      // ------------------------------------------------------
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 128000 // 128 kbps (Calidad superior a llamada)
      };

      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }

      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        // ------------------------------------------------------
        // PASO D: CREAR EL ARCHIVO FINAL CORRECTAMENTE
        // ------------------------------------------------------
        // Usamos el tipo exacto que detectamos al inicio.
        // Si no, el iPhone intenta leer un webm como mp4 y falla.
        const finalType = mimeTypeRef.current || "audio/webm";
        const extension = finalType.includes("mp4") ? "mp4" : "webm";

        const audioBlob = new Blob(audioChunks.current, { type: finalType });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioUrl(url);
        // Creamos el archivo File con la extensión correcta para el backend
        setFile(new File([audioBlob], `grabacion_usuario.${extension}`, { type: finalType }));
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setAudioUrl(null);
      setFile(null);

    } catch (err) {
      console.error(err);
      alert("Error: No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop(); 
      setIsRecording(false);
      // Apagar el micrófono del navegador
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
    }
  };

  const eliminarAudio = () => {
    setFile(null);
    setAudioUrl(null);
    audioChunks.current = [];
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  const handleEnviar = () => {
    let blobToSend: Blob | null = null;
    
    // Si no hay archivo subido manualmente, usamos lo grabado
    if (!file && audioChunks.current.length > 0) {
        const finalType = mimeTypeRef.current || "audio/webm";
        blobToSend = new Blob(audioChunks.current, { type: finalType });
    }
    
    onAnalizar(file, blobToSend);
  };

  return (
    <div className="d-flex flex-column justify-content-between align-items-center w-100 h-100 animate__animated animate__fadeIn" style={{ overflow: 'hidden' }}>
      
      {/* 1. CABECERA */}
      <div className="text-center w-100 mt-4 flex-shrink-0">
        <h1 className="fw-bold m-0" style={{color: "#b0bba2", fontSize: "2.5rem"}}>BirdIA</h1>
        <p className="text-muted px-3 m-0">
            Graba o sube un audio para identificar la especie de ave.
        </p>
      </div>

      {/* 2. CENTRO */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center w-100">
        
        <button 
          className={`btn rounded-circle d-flex justify-content-center align-items-center ${isRecording ? "shazam-effect" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!!audioUrl}
          style={{ 
            width: "200px", 
            height: "200px", 
            backgroundColor: isRecording ? "#dc3545" : "#2cba93", 
            border: "none",
            transition: "all 0.3s ease",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            zIndex: 2, 
            position: 'relative'
          }}
        >
          <img 
            src={aveIcon} 
            alt="Grabar" 
            style={{ 
                width: "90px", 
                filter: "brightness(0) invert(1)",
                opacity: audioUrl ? 0.5 : 1,
                pointerEvents: "none"
            }} 
          />
        </button>

        <p className="text-muted text-center mt-4 mb-0 fw-normal" style={{ fontSize: '1rem', zIndex: 2 }}>
            {isRecording ? "Grabando (Alta Calidad)..." : !audioUrl ? "Toca el ave para grabar" : "Audio listo para analizar."}
        </p>

      </div>

      {/* 3. PIE DE PÁGINA */}
      <div className="w-100 d-flex justify-content-center align-items-start flex-shrink-0 pb-4" style={{ minHeight: '200px' }}>
        
        {/* REPRODUCTOR */}
        {audioUrl && (
          <div className="bg-white p-3 rounded-4 shadow-sm w-100 border animate__animated animate__fadeInUp" 
               style={{maxWidth: '350px', zIndex: 10, borderRadius: '10px'}}>
             <audio src={audioUrl} controls className="w-100 mb-3" />
             <div className="d-flex gap-2">
                <button 
                    className="btn btn-success flex-grow-1 fw-bold" 
                    onClick={handleEnviar} 
                    disabled={loading}
                    style={{ borderRadius: '10px', backgroundColor: '#798369' }} 
                    >
                    {loading ? "Analizando..." : "Identificar Ave"}
                </button>
                <button className="btn btn-outline-danger rounded-circle" onClick={eliminarAudio}>
                  <i className="bi bi-trash"></i>
                </button>
             </div>
          </div>
        )}

        {/* BOTÓN SUBIR */}
        {!isRecording && !audioUrl && (
          <div className="text-center animate__animated animate__fadeIn" style={{ paddingTop: '10px' }}>
            <button 
              className="btn bg-white border shadow-sm px-4 py-3 d-flex align-items-center gap-2" 
              onClick={handleButtonClick}
              style={{ borderRadius: '10px', minWidth: '250px', justifyContent: 'center' , backgroundColor: '#f8f9fa' }}
            >
              <i className="bi bi-upload text-secondary"></i> 
              <span className="text-secondary fw-semibold">Subir archivo (mp3/wav)</span>
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileChange} />
            <p className="text-muted mt-3 small">
               O puedes cargar tu archivo de audio
            </p>
          </div>
        )}

      </div>

    </div>
  );
};