import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axiosClient from '../api/axiosClient';

// --- ICONOS LEAFLET ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- INTERFACES ---
interface AveInfo {
    nombre_cientifico: string;
    nombre_comun: string;
    imagen_url: string;
}

interface InferenciaHistorial {
    log_id: number;
    prediccion: string;
    confianza: number;
    fecha: string;
    ubicacion: string;
    latitud: number | null;
    longitud: number | null;
    usuario: string; // Hacemos obligatorio que tenga un string (aunque sea "Anónimo")
    foto?: string;
    nombre_comun?: string;
}

const RecenterMap = ({ coords }: { coords: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.flyTo(coords, 16, { duration: 1.5 });
    }, [coords, map]);
    return null;
};

export const MapaPredicciones = () => {
    const [puntos, setPuntos] = useState<InferenciaHistorial[]>([]);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [limiteVisible, setLimiteVisible] = useState(20);

    // Coordenadas iniciales (Guayaquil/Cerro Blanco aprox)
    const centroInicial: [number, number] = [-2.1894, -79.8891];

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. CARGAMOS HISTORIAL Y AVES
                const endpointHistorial = '/admin/logs/historial';

                const [resHistorial, resAves] = await Promise.all([
                    axiosClient.get(endpointHistorial),
                    axiosClient.get('/inferencia/listar_aves')
                ]);

                // 2. MAPEO DE AVES (Para tener nombres comunes y fotos)
                const mapaAves: Record<string, AveInfo> = {};
                resAves.data.forEach((ave: any) => {
                    mapaAves[ave.nombre_cientifico] = {
                        nombre_cientifico: ave.nombre_cientifico,
                        nombre_comun: ave.nombre,
                        imagen_url: ave.imagen_url
                    };
                });

                // 3. PROCESAMIENTO DE HISTORIAL
                const historialCompleto = resHistorial.data
                    .filter((item: any) =>
                        // Filtramos solo los que tienen coordenadas válidas
                        item.latitud && item.longitud &&
                        item.latitud !== 0 && item.longitud !== 0
                    )
                    .map((item: any) => {
                        const infoExtra = mapaAves[item.prediccion];

                        // --- CORRECCIÓN IMPORTANTE AQUÍ ---
                        // Verificamos si 'item.usuario' existe y no es "Anónimo" (o string vacío)
                        // Si tu backend manda "Anónimo" cuando no sabe quién es, esto lo respeta.
                        // Si tu backend manda el nombre real, lo usamos.
                        let nombreFinal = "Observador Anónimo";
                        if (item.usuario && item.usuario.trim() !== "" && item.usuario !== "Anónimo") {
                            nombreFinal = item.usuario;
                        }

                        return {
                            ...item,
                            foto: item.url_imagen || (infoExtra ? infoExtra.imagen_url : null),
                            nombre_comun: infoExtra ? infoExtra.nombre_comun : item.prediccion,
                            usuario: nombreFinal // Asignamos el nombre procesado
                        };
                    });

                // Ordenamos por fecha (más reciente primero)
                historialCompleto.sort((a: any, b: any) =>
                    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                );

                setPuntos(historialCompleto);

            } catch (error) {
                console.error("Error cargando datos del mapa:", error);
            }
        };
        cargarDatos();
    }, []);

    const puntosFiltrados = useMemo(() => {
        return puntos.filter(p => {
            const texto = busqueda.toLowerCase();
            return (
                p.usuario.toLowerCase().includes(texto) ||
                (p.nombre_comun || "").toLowerCase().includes(texto) ||
                (p.prediccion || "").toLowerCase().includes(texto)
            );
        });
    }, [puntos, busqueda]);

    const puntosVisibles = puntosFiltrados.slice(0, limiteVisible);

    const handleItemClick = (punto: InferenciaHistorial) => {
        if (punto.latitud && punto.longitud) {
            setSelectedCoords([punto.latitud, punto.longitud]);
            setSelectedId(punto.log_id);
        }
    };

    const cargarMas = () => {
        setLimiteVisible(prev => prev + 20);
    };

    return (
        <div className="row g-3 h-100 animate__animated animate__fadeIn">

            {/* --- COLUMNA IZQUIERDA: MAPA --- */}
            <div className="col-md-8 col-lg-9 h-100">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 position-relative">

                    {/* BARRA DE BÚSQUEDA FLOTANTE SOBRE EL MAPA */}
                    <div className="position-absolute top-0 start-0 m-3 p-2 bg-white rounded-3 shadow-sm" style={{ zIndex: 1000, maxWidth: '300px', width: '100%' }}>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control border-0"
                                placeholder="Buscar usuario o ave..."
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    setLimiteVisible(20); // Reset al buscar
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ height: "600px", width: "100%" }}>
                        <MapContainer center={centroInicial} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <RecenterMap coords={selectedCoords} />

                            {puntosFiltrados.map((punto) => (
                                <Marker
                                    key={punto.log_id}
                                    position={[punto.latitud!, punto.longitud!]}
                                    opacity={selectedId === punto.log_id ? 1 : 0.8}
                                >
                                    <Popup minWidth={200}>
                                        <div className="text-center">
                                            {punto.foto && (
                                                <img
                                                    src={punto.foto}
                                                    alt="Ave"
                                                    className="rounded-3 mb-2 shadow-sm"
                                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                                />
                                            )}
                                            <h6 className="fw-bold text-success mb-0 text-capitalize">{punto.nombre_comun}</h6>

                                            {/* AQUÍ MOSTRAMOS EL USUARIO */}
                                            <div className="badge bg-primary bg-opacity-10 text-primary mt-2 mb-1 px-3 py-2 rounded-pill">
                                                <i className="bi bi-person-fill me-1"></i>
                                                {punto.usuario}
                                            </div>

                                            <div className="text-muted small mt-2 pt-2 border-top">
                                                <i className="bi bi-calendar-event me-1"></i>
                                                {new Date(punto.fecha).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </div>

            {/* --- COLUMNA DERECHA: LISTA LATERAL --- */}
            <div className="col-md-4 col-lg-3 h-100">
                <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold text-dark">
                                <i className="bi bi-globe-americas me-2"></i>Avistamientos
                            </h6>
                            <span className="badge bg-secondary rounded-pill">{puntosFiltrados.length}</span>
                        </div>
                    </div>

                    <div className="card-body p-0 overflow-auto" style={{ maxHeight: "545px" }}>
                        <div className="list-group list-group-flush">
                            {puntosVisibles.length > 0 ? (
                                puntosVisibles.map((punto) => (
                                    <button
                                        key={punto.log_id}
                                        className={`list-group-item list-group-item-action py-3 ${selectedId === punto.log_id ? 'bg-success-subtle' : ''}`}
                                        onClick={() => handleItemClick(punto)}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div className="me-3 flex-shrink-0">
                                                {punto.foto ? (
                                                    <img
                                                        src={punto.foto}
                                                        className="rounded-circle border shadow-sm"
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        alt="ave"
                                                    />
                                                ) : (
                                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{ width: '50px', height: '50px' }}>
                                                        <i className="bi bi-bird text-muted fs-4"></i>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-grow-1 overflow-hidden text-start">
                                                <h6 className="mb-0 fw-bold text-dark text-capitalize text-truncate" style={{ fontSize: '0.95rem' }}>
                                                    {punto.nombre_comun}
                                                </h6>

                                                {/* NOMBRE DE USUARIO EN LA LISTA */}
                                                <small className="d-block text-primary text-truncate mt-1" style={{ fontSize: '0.8rem' }}>
                                                    <i className="bi bi-person me-1"></i>{punto.usuario}
                                                </small>

                                                <small className="text-muted d-block fst-italic text-truncate mt-1" style={{ fontSize: '0.75rem' }}>
                                                    {punto.prediccion}
                                                </small>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-5 text-center text-muted">
                                    <i className="bi bi-geo-alt fs-1 d-block mb-3 opacity-25"></i>
                                    <p>No se encontraron resultados</p>
                                </div>
                            )}

                            {puntosVisibles.length < puntosFiltrados.length && (
                                <div className="p-2 text-center">
                                    <button
                                        className="btn btn-sm btn-outline-success rounded-pill px-4"
                                        onClick={cargarMas}
                                    >
                                        Cargar más...
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};