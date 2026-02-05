import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";

interface Ave {
    id_ave: number;
    nombre?: string;
    nombre_cientifico?: string;
    imagen_url?: string;
    url_imagen?: string;
    audio_url?: string;
}

// --- PROPS DEL REPRODUCTOR ---
interface ReproductorProps {
    url: string;
    activo: boolean;           // ¿Tengo permiso para sonar?
    alReproducir: () => void;  // Avisar al jefe que empecé
    alPausar: () => void;      // Avisar al jefe que paré
}

const ReproductorAudio = ({ url, activo, alReproducir, alPausar }: ReproductorProps) => {
    const [cargando, setCargando] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 1. EFECTO: Obedecer al padre
    // Si el padre dice "activo={false}" (porque otro empezó a sonar), nos pausamos.
    useEffect(() => {
        if (!activo && audioRef.current) {
            audioRef.current.pause();
        }
    }, [activo]);

    // 2. EFECTO DE LIMPIEZA
    useEffect(() => {
        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const toggleAudio = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (activo) {
            // Si ya estoy sonando y me clickean -> PAUSA
            alPausar(); // Le digo al padre que ya no quiero sonar
        } else {
            // Si estoy en silencio y me clickean -> PLAY
            iniciarReproduccion();
        }
    };

    const iniciarReproduccion = () => {
        // Lógica de Lazy Loading (igual que antes)
        if (!audioRef.current) {
            setCargando(true);
            const audio = new Audio(url);
            
            audio.onended = () => alPausar(); // Cuando termine, avisamos que paramos
            
            audio.oncanplaythrough = () => {
                setCargando(false);
                alReproducir(); // ¡IMPORTANTE! Aquí avisamos al padre "Soy el nuevo activo"
                audio.play();
            };

            audio.onerror = () => {
                setCargando(false);
                alert("Error al cargar audio");
            };

            audioRef.current = audio;
            audioRef.current.volume = 0.5;
        } else {
            // Si ya existía, solo damos play y avisamos
            alReproducir();
            audioRef.current.play();
        }
    };

    return (
        <button 
            onClick={toggleAudio}
            disabled={cargando}
            className={`btn position-absolute bottom-0 end-0 m-2 rounded-circle shadow d-flex align-items-center justify-content-center ${
                activo ? "btn-danger" : "btn-light text-success"
            }`}
            style={{ width: "45px", height: "45px", zIndex: 10, transition: "all 0.2s ease" }}
            title={activo ? "Pausar" : "Escuchar canto"}
        >
            {cargando ? (
                <div className="spinner-border spinner-border-sm text-success" role="status"></div>
            ) : activo ? (
                <i className="bi bi-pause-fill fs-4"></i>
            ) : (
                <i className="bi bi-play-fill fs-4 ms-1"></i>
            )}
        </button>
    );
};

export const CatalogoAves = () => {
    const [aves, setAves] = useState<Ave[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);

    // --- ESTADO DEL JEFE: ¿QUIÉN ESTÁ SONANDO? ---
    const [idAudioActivo, setIdAudioActivo] = useState<number | null>(null);

    useEffect(() => {
        const fetchAves = async () => {
            try {
                const res = await axiosClient.get("/inferencia/listar_aves");
                setAves(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAves();
    }, []);

    const avesFiltradas = aves.filter(ave => {
        const nombre = (ave.nombre || ave.nombre_cientifico || "Desconocido").toLowerCase();
        const cientifico = (ave.nombre_cientifico || "").toLowerCase();
        const textoBusqueda = busqueda.toLowerCase();
        return nombre.includes(textoBusqueda) || cientifico.includes(textoBusqueda);
    });

    return (
        <div className="animate__animated animate__fadeIn p-2">
            
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-success m-0">Catálogo de Especies</h2>
                    <p className="text-muted m-0">Explora la biodiversidad registrada.</p>
                </div>
                <div className="input-group" style={{ maxWidth: '350px' }}>
                    <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                        <i className="bi bi-search"></i>
                    </span>
                    <input 
                        type="text" 
                        className="form-control border-start-0 rounded-end-pill" 
                        placeholder="Buscar..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5"><div className="spinner-border text-success"></div></div>
            ) : (
                <div className="row g-4">
                    {avesFiltradas.length > 0 ? (
                        avesFiltradas.map((ave, index) => (
                            <div key={ave.id_ave || index} className="col-6 col-md-4 col-lg-3 col-xl-2">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-effect">
                                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                        <img 
                                            src={ave.imagen_url || ave.url_imagen || "https://via.placeholder.com/300?text=No+Image"} 
                                            alt={ave.nombre}
                                            className="w-100 h-100 object-fit-cover"
                                            loading="lazy"
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                        />

                                        {/* REPRODUCTOR INTELIGENTE */}
                                        {ave.audio_url && (
                                            <ReproductorAudio 
                                                url={ave.audio_url}
                                                // 1. ¿Estoy activo? Solo si mi ID coincide con el del Jefe
                                                activo={idAudioActivo === ave.id_ave}
                                                
                                                // 2. Si doy play, le digo al Jefe: "¡Yo (este ID) estoy sonando!"
                                                // Esto automáticamente pone activo={false} a los demás.
                                                alReproducir={() => setIdAudioActivo(ave.id_ave)}
                                                
                                                // 3. Si doy pausa, le digo al Jefe: "Ya nadie está sonando"
                                                alPausar={() => setIdAudioActivo(null)}
                                            />
                                        )}
                                    </div>

                                    <div className="card-body text-center p-3">
                                        <h6 className="fw-bold text-dark text-truncate mb-1" title={ave.nombre}>
                                            {ave.nombre || "Sin nombre común"}
                                        </h6>
                                        <small className="text-muted fst-italic text-truncate d-block">
                                            {ave.nombre_cientifico || "Sin nombre científico"}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5 text-muted">
                            <i className="bi bi-search fs-1 mb-3 d-block"></i>
                            No se encontraron resultados.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};