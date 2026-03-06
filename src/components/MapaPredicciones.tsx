import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axiosClient from '../api/axiosClient';
import Swal from 'sweetalert2';

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
    tiene_ubicacion?: boolean;
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
    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 10;

    // Coordenadas iniciales (Guayaquil/Cerro Blanco aprox)
    const centroInicial: [number, number] = [-2.1894, -79.8891];

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. CARGAMOS HISTORIAL Y AVES (SEGÚN ROL)
                const roleId = localStorage.getItem("role_id");
                const isAdmin = roleId === "0";

                // Si es admin ve todo, si es usuario ve solo lo suyo.
                const endpointHistorial = isAdmin ? '/admin/logs/historial' : '/inferencia/historial';

                const [resHistorial, resAves] = await Promise.all([
                    axiosClient.get(endpointHistorial),
                    axiosClient.get('/inferencia/listar_aves')
                ]);

                // Adaptamos la data porque el endpoint puede devolver total y la lista
                let rawData = [];

                if (resHistorial.data && resHistorial.data.total !== undefined) {
                    rawData = resHistorial.data.historial || [];
                } else if (Array.isArray(resHistorial.data)) {
                    rawData = resHistorial.data;
                } else if (resHistorial.data && Array.isArray(resHistorial.data.historial)) {
                    rawData = resHistorial.data.historial;
                }

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
                const historialCompleto = rawData.map((item: any) => {
                    const infoExtra = mapaAves[item.prediccion];

                    let nombreFinal = "Observador Anónimo";
                    if (item.usuario && item.usuario.trim() !== "" && item.usuario !== "Anónimo") {
                        nombreFinal = item.usuario;
                    }

                    // Verificamos si tiene coordenadas válidas para el marcador
                    const tieneCoords = item.latitud !== null && item.longitud !== null &&
                        Number(item.latitud) !== 0 && Number(item.longitud) !== 0;

                    return {
                        ...item,
                        tiene_ubicacion: tieneCoords,
                        foto: item.url_imagen || (infoExtra ? infoExtra.imagen_url : null),
                        nombre_comun: infoExtra ? infoExtra.nombre_comun : item.prediccion,
                        usuario: nombreFinal
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

    // Calculamos el total de registros filtrados para la estructura de páginas
    const totalPaginas = Math.ceil(puntosFiltrados.length / registrosPorPagina) || 1;

    // Paginación en el frontend de la barra lateral
    const indiceUltimo = paginaActual * registrosPorPagina;
    const indicePrimero = indiceUltimo - registrosPorPagina;
    const puntosVisibles = puntosFiltrados.slice(indicePrimero, indiceUltimo);

    const markerRefs = useRef<{ [key: number]: any }>({});

    const renderPaginas = () => {
        const paginas = [];
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
                paginas.push(i);
            } else if (i === paginaActual - 2 || i === paginaActual + 2) {
                paginas.push("...");
            }
        }
        return [...new Set(paginas)];
    };

    const handleItemClick = (punto: InferenciaHistorial) => {
        if (punto.latitud && punto.longitud) {
            setSelectedCoords([punto.latitud, punto.longitud]);
            setSelectedId(punto.log_id);

            // Abrir el popup del marcador automáticamente si existe
            const marker = markerRefs.current[punto.log_id];
            if (marker) {
                marker.openPopup();
            }
        } else {
            Swal.fire({
                icon: 'info',
                title: 'No hay ubicación',
                text: 'Esta predicción no tiene coordenadas adjuntas.',
                confirmButtonColor: '#198754'
            });
        }
    };



    return (
        <div className="row g-3 h-100 animate__animated animate__fadeIn">

            {/* --- COLUMNA IZQUIERDA: MAPA --- */}
            <div className="col-md-8 col-lg-9 h-100">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 position-relative">

                    <div style={{ height: "calc(100vh - 105px)", width: "100%" }}>
                        <MapContainer center={centroInicial} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <RecenterMap coords={selectedCoords} />

                            {puntosFiltrados.filter(p => p.tiene_ubicacion).map((punto) => (
                                <Marker
                                    key={punto.log_id}
                                    position={[punto.latitud!, punto.longitud!]}
                                    opacity={selectedId === punto.log_id ? 1 : 0.8}
                                    ref={(r) => { if (r) markerRefs.current[punto.log_id] = r; }}
                                >
                                    <Popup minWidth={200}>
                                        <div className="text-center">
                                            {punto.foto && (
                                                <img
                                                    src={punto.foto}
                                                    alt="Ave"
                                                    className="rounded-3 mb-2 shadow-sm"
                                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                                />
                                            )}
                                            <h6 className="fw-bold text-success mb-0 text-capitalize">{punto.nombre_comun}</h6>

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
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-bold text-dark">
                                <i className="bi bi-globe-americas me-2"></i>Avistamientos
                            </h6>
                            <span className="badge bg-secondary rounded-pill">{puntosFiltrados.length} total</span>
                        </div>
                        {/* BUSCADOR INTEGRADO EN LA LISTA */}
                        <div className="input-group input-group-sm mt-3">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control border-0 bg-light"
                                placeholder="Filtrar por ave o usuario..."
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    setPaginaActual(1);
                                }}
                                style={{ boxShadow: 'none' }}
                            />
                        </div>
                    </div>

                    <div className="card-body p-0 overflow-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
                        <div className="list-group list-group-flush">
                            {puntosVisibles.length > 0 ? (
                                puntosVisibles.map((punto) => (
                                    <button
                                        key={punto.log_id}
                                        className={`list-group-item list-group-item-action py-3 border-bottom ${selectedId === punto.log_id ? 'bg-success-subtle' : ''}`}
                                        onClick={() => handleItemClick(punto)}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div className="me-3 flex-shrink-0">
                                                {punto.foto ? (
                                                    <img
                                                        src={punto.foto}
                                                        className="rounded-circle border border-2 shadow-sm"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                        alt="ave"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{ width: '60px', height: '60px' }}>
                                                        <i className="bi bi-bird text-muted fs-4"></i>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-grow-1 overflow-hidden text-start">
                                                <h6 className="mb-0 fw-bold text-dark text-capitalize text-truncate" style={{ fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                                                    {punto.nombre_comun}
                                                </h6>

                                                <small className="d-block text-primary text-truncate mt-1 fw-medium" style={{ fontSize: '0.85rem' }}>
                                                    <i className="bi bi-person-fill me-1 opacity-75"></i>{punto.usuario}
                                                </small>

                                                <small className="text-muted d-block fst-italic text-truncate mt-1" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
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

                            {totalPaginas > 1 && (
                                <div className="p-3 d-flex justify-content-center align-items-center gap-1 border-top bg-white sticky-bottom">
                                    <button
                                        className="btn btn-sm btn-light border fw-bold text-muted"
                                        onClick={() => setPaginaActual(1)}
                                        disabled={paginaActual === 1}
                                        style={{ width: '30px', height: '30px', padding: 0 }}
                                    >
                                        &laquo;
                                    </button>

                                    <button
                                        className="btn btn-sm btn-light border fw-bold text-muted"
                                        onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                        disabled={paginaActual === 1}
                                        style={{ width: '30px', height: '30px', padding: 0 }}
                                    >
                                        &lt;
                                    </button>

                                    <div className="d-flex mx-1">
                                        {renderPaginas().map((p, i) => (
                                            p === "..." ? (
                                                <span key={i} className="text-muted mx-1 d-flex align-items-center">...</span>
                                            ) : (
                                                <button
                                                    key={i}
                                                    onClick={() => setPaginaActual(p as number)}
                                                    className={`btn btn-sm rounded-circle fw-bold mx-1 ${paginaActual === p ? 'btn-success text-white' : 'btn-light border text-muted'}`}
                                                    style={{ width: '30px', height: '30px', padding: 0 }}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button
                                        className="btn btn-sm btn-light border fw-bold text-muted"
                                        onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                        disabled={paginaActual === totalPaginas}
                                        style={{ width: '30px', height: '30px', padding: 0 }}
                                    >
                                        &gt;
                                    </button>

                                    <button
                                        className="btn btn-sm btn-light border fw-bold text-muted"
                                        onClick={() => setPaginaActual(totalPaginas)}
                                        disabled={paginaActual === totalPaginas}
                                        style={{ width: '30px', height: '30px', padding: 0 }}
                                    >
                                        &raquo;
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