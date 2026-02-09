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
    if (mediaRecorder.current) {
      mediaRecorder.current.stop(); 
      setIsRecording(false);
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
    if (!file && audioChunks.current.length > 0) {
        blobToSend = new Blob(audioChunks.current, { type: "audio/webm" });
    }
    onAnalizar(file, blobToSend);
  };

  return (
    // CONTENEDOR PRINCIPAL: h-100 para ocupar todo el alto disponible
    <div className="d-flex flex-column justify-content-between align-items-center w-100 h-100 animate__animated animate__fadeIn" style={{ overflow: 'hidden' }}>
      
      {/* 1. CABECERA (Fija arriba) */}
      <div className="text-center w-100 mt-4 flex-shrink-0">
        <h1 className="fw-bold m-0" style={{color: "#b0bba2", fontSize: "2.5rem"}}>BirdIA</h1>
        <p className="text-muted px-3 m-0">
            Graba o sube un audio para identificar la especie de ave.
        </p>
      </div>

      {/* 2. CENTRO (Micrófono + Texto) */}
      {/* flex-grow-1: Ocupa todo el espacio central */}
      {/* justify-content-center: Centra el bloque (botón+texto) verticalmente */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center w-100">
        
        {/* El Botón */}
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
            zIndex: 2, // Asegura que esté por encima de todo
            position: 'relative' // Necesario para el z-index
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

        {/* El Texto (Justo debajo, flujo natural) */}
        {/* mt-4: Margen superior para separarlo del botón */}
        <p className="text-muted text-center mt-4 mb-0 fw-normal" style={{ fontSize: '1rem', zIndex: 2 }}>
            {isRecording ? "Grabando..." : !audioUrl ? "Toca el ave para grabar" : "Audio listo para analizar."}
        </p>

      </div>

      {/* 3. PIE DE PÁGINA (Espacio Reservado Fijo) */}
      {/* minHeight: 200px reserva el espacio para que el centro no baile */}
      <div className="w-100 d-flex justify-content-center align-items-start flex-shrink-0 pb-4" style={{ minHeight: '200px' }}>
        
        {/* A. REPRODUCTOR */}
        {audioUrl && (
          <div className="bg-white p-3 rounded-4 shadow-sm w-100 border animate__animated animate__fadeInUp" 
               style={{maxWidth: '350px', zIndex: 10, borderRadius: '10px'}}>
             <audio src={audioUrl} controls className="w-100 mb-3" />
             <div className="d-flex gap-2">
                <button 
                    // Quitamos 'rounded-pill'
                    className="btn btn-success flex-grow-1 fw-bold" 
                    onClick={handleEnviar} 
                    disabled={loading}
                    // Agregamos el estilo manual
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

        {/* B. BOTÓN SUBIR */}
        {!isRecording && !audioUrl && (
          <div className="text-center animate__animated animate__fadeIn" style={{ paddingTop: '10px' }}>
            <button 
              className="btn bg-white border shadow-sm px-4 py-3 d-flex align-items-center gap-2" 
              onClick={handleButtonClick}
              // 👇 AQUÍ ESTÁ EL CAMBIO: borderRadius: '10px'
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