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
            alPausar();
        } else {
            iniciarReproduccion();
        }
    };

    const iniciarReproduccion = () => {
        if (!audioRef.current) {
            setCargando(true);
            const audio = new Audio(url);
            audio.onended = () => alPausar();
            audio.oncanplaythrough = () => {
                setCargando(false);
                alReproducir();
                audio.play();
            };
            audio.onerror = () => {
                setCargando(false);
                alert("Error al cargar audio");
            };
            audioRef.current = audio;
            audioRef.current.volume = 0.5;
        } else {
            alReproducir();
            audioRef.current.play();
        }
    };

    return (
        <button
            onClick={toggleAudio}
            disabled={cargando}
            className={`btn position-absolute bottom-0 end-0 m-2 rounded-circle shadow d-flex align-items-center justify-content-center ${activo ? "btn-danger" : "btn-light text-success"
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
    const [idAudioActivo, setIdAudioActivo] = useState<number | null>(null);

    // Función para normalizar texto (quitar acentos, guiones y pasar a minúsculas)
    const normalizar = (t: string) =>
        t.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/_/g, " ");

    useEffect(() => {
        const fetchAves = async () => {
            try {
                const res = await axiosClient.get("/inferencia/listar_aves");
                const datos = Array.isArray(res.data) ? res.data : [];

                // DEDUPLICACIÓN: Usamos un mapa por nombre científico para evitar repetidos
                const mapaUnico = new Map();
                datos.forEach(a => {
                    if (!mapaUnico.has(a.nombre_cientifico)) {
                        mapaUnico.set(a.nombre_cientifico, a);
                    }
                });

                setAves(Array.from(mapaUnico.values()));
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAves();
    }, []);

    const avesFiltradas = aves.filter(ave => {
        const busq = normalizar(busqueda);
        if (!busq) return true;

        const nombre = normalizar(ave.nombre || "");
        const cientifico = normalizar(ave.nombre_cientifico || "");

        return nombre.includes(busq) || cientifico.includes(busq);
    });

    return (
        <div className="animate__animated animate__fadeIn p-2" style={{ minHeight: '60vh' }}>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-success m-0">Catálogo de Especies</h2>
                    <p className="text-muted m-0">Explora la biodiversidad registrada.</p>
                </div>
                <div className="input-group" style={{ maxWidth: '350px' }}>
                    <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted shadow-sm">
                        <i className="bi bi-search"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control border-start-0 rounded-end-pill shadow-sm"
                        placeholder="Buscar ave..."
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
                        avesFiltradas.map((ave) => (
                            <div key={ave.id_ave} className="col-6 col-md-4 col-lg-3 col-xl-2">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-effect bg-white">
                                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#f8f9fa' }}>
                                        <img
                                            src={ave.imagen_url || ave.url_imagen || "https://cdn-icons-png.flaticon.com/512/821/821260.png"}
                                            alt={ave.nombre}
                                            className="w-100 h-100 object-fit-cover"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/821/821260.png";
                                                e.currentTarget.style.opacity = '0.5';
                                            }}
                                        />

                                        {ave.audio_url && (
                                            <ReproductorAudio
                                                url={ave.audio_url}
                                                activo={idAudioActivo === ave.id_ave}
                                                alReproducir={() => setIdAudioActivo(ave.id_ave)}
                                                alPausar={() => setIdAudioActivo(null)}
                                            />
                                        )}
                                    </div>

                                    <div className="card-body text-center p-3">
                                        <h6 className="fw-bold text-dark text-truncate mb-1" title={ave.nombre}>
                                            {ave.nombre || "Sin nombre común"}
                                        </h6>
                                        <small className="text-muted fst-italic text-truncate d-block">
                                            {ave.nombre_cientifico?.replace(/_/g, " ") || "Sin nombre científico"}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5 text-muted animate__animated animate__fadeIn">
                            <i className="bi bi-search fs-1 mb-3 d-block opacity-25"></i>
                            <p className="fs-5">No se encontraron resultados para "<strong>{busqueda}</strong>"</p>
                            <button className="btn btn-link text-success p-0" onClick={() => setBusqueda("")}>Limpiar búsqueda</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
