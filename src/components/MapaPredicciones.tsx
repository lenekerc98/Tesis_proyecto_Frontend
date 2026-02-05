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
    usuario?: string; // IMPORTANTE: Campo usuario para el admin
    foto?: string;
    nombre_comun?: string;
}

// Componente para animación de vuelo
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
    
    // --- NUEVOS ESTADOS ---
    const [busqueda, setBusqueda] = useState("");
    const [limiteVisible, setLimiteVisible] = useState(20); // Empezamos mostrando solo 20
    const [isAdmin, setIsAdmin] = useState(false);

    // Coordenadas iniciales (Centro aproximado)
    const centroInicial: [number, number] = [-2.1894, -79.8891]; 

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. DETERMINAR ROL (Admin es '0')
                const roleId = localStorage.getItem("role_id");
                const esAdmin = roleId === "0";
                setIsAdmin(esAdmin);

                // 2. SELECCIONAR ENDPOINT SEGÚN ROL
                // Si es admin, trae TODO el historial. Si no, solo el personal.
                const endpointHistorial = esAdmin 
                    ? '/admin/logs/historial' 
                    : '/inferencia/historial';

                const [resHistorial, resAves] = await Promise.all([
                    axiosClient.get(endpointHistorial), 
                    axiosClient.get('/inferencia/listar_aves')
                ]);

                // 3. MAPEO DE AVES
                const mapaAves: Record<string, AveInfo> = {};
                resAves.data.forEach((ave: any) => {
                    mapaAves[ave.nombre_cientifico] = {
                        nombre_cientifico: ave.nombre_cientifico,
                        nombre_comun: ave.nombre,
                        imagen_url: ave.imagen_url
                    };
                });

                // 4. PROCESAR HISTORIAL
                // Nota: Tu API de admin devuelve "usuario", la de usuario no siempre lo trae, 
                // pero si eres usuario normal, eres tú mismo.
                const historialCompleto = resHistorial.data
                    .filter((item: any) => 
                        item.latitud && item.longitud && 
                        item.latitud !== 0 && item.longitud !== 0
                    )
                    .map((item: any) => {
                        const infoExtra = mapaAves[item.prediccion];
                            // LÓGICA CORREGIDA DE USUARIO
                            let nombreUsuarioMostrar = item.usuario; // 1. Prioridad: Lo que diga la API
                            if (!nombreUsuarioMostrar) {
                                if (esAdmin) {
                                    // 2. Si soy Admin y no viene nombre, es un desconocido (NO SOY YO)
                                    nombreUsuarioMostrar = "Usuario Desconocido"; 
                                } else {
                                    // 3. Si soy usuario normal viendo mi historial, asumo que soy Yo
                                    nombreUsuarioMostrar = localStorage.getItem("userName") || "Yo";
                                }
                            }

                            return {
                                ...item,
                                foto: item.url_imagen || (infoExtra ? infoExtra.imagen_url : null),
                                nombre_comun: infoExtra ? infoExtra.nombre_comun : item.prediccion,
                                
                                // Asignamos la variable corregida
                                usuario: nombreUsuarioMostrar
                            };
                    });
                
                // Ordenar por fecha (más reciente primero)
                historialCompleto.sort((a: any, b: any) => 
                    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                );

                setPuntos(historialCompleto);

            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        cargarDatos();
    }, []);

    // --- FILTRADO INTELIGENTE ---
    const puntosFiltrados = useMemo(() => {
        return puntos.filter(p => {
            const texto = busqueda.toLowerCase();
            return (
                (p.usuario || "").toLowerCase().includes(texto) ||
                (p.nombre_comun || "").toLowerCase().includes(texto) ||
                (p.prediccion || "").toLowerCase().includes(texto)
            );
        });
    }, [puntos, busqueda]);

    // --- PAGINACIÓN (Recortamos la lista para no saturar) ---
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
            
            {/* --- MAPA (IZQUIERDA) --- */}
            <div className="col-md-8 col-lg-9 h-100">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 position-relative">
                    
                    {/* BUSCADOR FLOTANTE SOBRE EL MAPA (Opcional, estilo Google Maps) */}
                    <div className="position-absolute top-0 start-0 m-3 p-2 bg-white rounded-3 shadow-sm" style={{zIndex: 1000, maxWidth: '300px', width: '100%'}}>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted"></i></span>
                            <input 
                                type="text" 
                                className="form-control border-0" 
                                placeholder={isAdmin ? "Buscar usuario o ave..." : "Buscar mis aves..."}
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    setLimiteVisible(20); // Resetear paginación al buscar
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

                            {/* Renderizamos SOLO los puntos visibles para no congelar el navegador */}
                            {puntosVisibles.map((punto) => (
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
                                                    style={{width: '100%', height: '120px', objectFit: 'cover'}}
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                                />
                                            )}
                                            <h6 className="fw-bold text-success mb-0 text-capitalize">{punto.nombre_comun}</h6>
                                            
                                            {/* Si es Admin, mostramos quién lo subió */}
                                            {isAdmin && (
                                                <div className="badge bg-primary bg-opacity-10 text-primary mt-1 mb-1">
                                                    <i className="bi bi-person-fill me-1"></i>
                                                    {punto.usuario}
                                                </div>
                                            )}
                                            
                                            <div className="text-muted small mt-2 pt-2 border-top">
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

            {/* --- LISTA LATERAL (DERECHA) --- */}
            <div className="col-md-4 col-lg-3 h-100">
                <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold text-dark">
                                <i className="bi bi-list-ul me-2"></i>Resultados
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
                                                        className="rounded-circle border" 
                                                        style={{width: '45px', height: '45px', objectFit: 'cover'}} 
                                                        alt="ave"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{width: '45px', height: '45px'}}>
                                                        <i className="bi bi-bird text-muted"></i>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-grow-1 overflow-hidden text-start">
                                                <h6 className="mb-0 fw-bold text-dark text-capitalize text-truncate" style={{fontSize: '0.9rem'}}>
                                                    {punto.nombre_comun}
                                                </h6>
                                                
                                                {/* Mostrar usuario en la lista si es Admin */}
                                                {isAdmin && (
                                                    <small className="d-block text-primary text-truncate" style={{fontSize: '0.75rem'}}>
                                                        <i className="bi bi-person me-1"></i>{punto.usuario}
                                                    </small>
                                                )}

                                                <small className="text-muted d-block fst-italic text-truncate" style={{fontSize: '0.75rem'}}>
                                                    {punto.prediccion}
                                                </small>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-muted">
                                    No se encontraron resultados para "{busqueda}"
                                </div>
                            )}

                            {/* BOTÓN CARGAR MÁS */}
                            {puntosVisibles.length < puntosFiltrados.length && (
                                <button 
                                    className="btn btn-link text-decoration-none py-3 text-success fw-bold"
                                    onClick={cargarMas}
                                >
                                    Cargar más resultados...
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};