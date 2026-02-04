import { useEffect, useState } from 'react';
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
    nombre_comun: string; // Asegúrate que tu API /listar_aves devuelva esto
    imagen_url: string;   // O url_imagen, según tu API
}

interface InferenciaHistorial {
    log_id: number;
    prediccion: string; // Nombre científico que viene del historial
    confianza: number;
    fecha: string;
    ubicacion: string;
    latitud: number | null;
    longitud: number | null;
    // Campos que agregaremos manualmente en el frontend:
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
    
    // Coordenadas iniciales (ajústalas según tu necesidad)
    const centroInicial: [number, number] = [-2.1894, -79.8891]; 

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. LLAMAMOS A LAS DOS APIS AL MISMO TIEMPO
                const [resHistorial, resAves] = await Promise.all([
                    axiosClient.get('/inferencia/historial'),
                    axiosClient.get('/inferencia/listar_aves')
                ]);

                // 2. CREAMOS UN DICCIONARIO DE AVES PARA BÚSQUEDA RÁPIDA
                // Clave: Nombre Científico -> Valor: Objeto con foto y nombre común
                const mapaAves: Record<string, AveInfo> = {};
                resAves.data.forEach((ave: any) => {
                    // Ajusta 'ave.url_imagen' o 'ave.imagen_url' según tu respuesta real
                    mapaAves[ave.nombre_cientifico] = {
                        nombre_cientifico: ave.nombre_cientifico,
                        nombre_comun: ave.nombre_comun || ave.nombre_cientifico, // Fallback si no hay común
                        imagen_url: ave.imagen_url || ave.url_imagen // Fallback de nombres
                    };
                });

                // 3. CRUZAMOS LOS DATOS
                const historialCompleto = resHistorial.data
                    .filter((item: any) => item.latitud && item.longitud && item.latitud !== 0)
                    .map((item: any) => {
                        // Buscamos el ave en nuestro diccionario
                        const infoExtra = mapaAves[item.prediccion];
                        
                        return {
                            ...item,
                            foto: infoExtra ? infoExtra.imagen_url : null,
                            nombre_comun: infoExtra ? infoExtra.nombre_comun : item.prediccion
                        };
                    });

                setPuntos(historialCompleto);

            } catch (error) {
                console.error("Error cargando datos del mapa:", error);
            }
        };
        cargarDatos();
    }, []);

    const handleItemClick = (punto: InferenciaHistorial) => {
        if (punto.latitud && punto.longitud) {
            setSelectedCoords([punto.latitud, punto.longitud]);
            setSelectedId(punto.log_id);
        }
    };

    return (
        <div className="row g-3 h-100">
            {/* --- MAPA --- */}
            <div className="col-md-8 col-lg-9 h-100">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                    <div style={{ height: "600px", width: "100%" }}>
                        <MapContainer center={centroInicial} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <RecenterMap coords={selectedCoords} />

                            {puntos.map((punto) => (
                                <Marker 
                                    key={punto.log_id} 
                                    position={[punto.latitud!, punto.longitud!]}
                                    opacity={selectedId === punto.log_id ? 1 : 0.8}
                                >
                                    <Popup minWidth={200}>
                                        <div className="text-center">
                                            {/* FOTO EN EL POPUP */}
                                            {punto.foto ? (
                                                <img 
                                                    src={punto.foto} 
                                                    alt="Ave" 
                                                    className="rounded-3 mb-2 shadow-sm"
                                                    style={{width: '100%', height: '120px', objectFit: 'cover'}}
                                                    onError={(e) => e.currentTarget.style.display = 'none'} // Si falla, oculta
                                                />
                                            ) : (
                                                <div className="bg-light rounded-3 mb-2 d-flex align-items-center justify-content-center" style={{height: '80px'}}>
                                                    <i className="bi bi-image text-muted"></i>
                                                </div>
                                            )}

                                            <h6 className="fw-bold text-success mb-0 text-capitalize">
                                                {punto.nombre_comun}
                                            </h6>
                                            <small className="text-muted fst-italic d-block mb-2">
                                                {punto.prediccion}
                                            </small>

                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                                {(punto.confianza * 100).toFixed(1)}% Confianza
                                            </span>
                                            
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

            {/* --- LISTA LATERAL --- */}
            <div className="col-md-4 col-lg-3 h-100">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold text-dark">
                            <i className="bi bi-list-ul me-2"></i>Avistamientos ({puntos.length})
                        </h6>
                    </div>
                    <div className="card-body p-0 overflow-auto" style={{ maxHeight: "545px" }}>
                        <div className="list-group list-group-flush">
                            {puntos.map((punto) => (
                                <button
                                    key={punto.log_id}
                                    className={`list-group-item list-group-item-action py-3 ${selectedId === punto.log_id ? 'bg-success-subtle' : ''}`}
                                    onClick={() => handleItemClick(punto)}
                                >
                                    <div className="d-flex align-items-center">
                                        {/* FOTO EN LA LISTA */}
                                        <div className="me-3 flex-shrink-0">
                                            {punto.foto ? (
                                                <img 
                                                    src={punto.foto} 
                                                    className="rounded-circle border" 
                                                    style={{width: '45px', height: '45px', objectFit: 'cover'}} 
                                                    alt="ave"
                                                />
                                            ) : (
                                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{width: '45px', height: '45px'}}>
                                                    <i className="bi bi-bird text-muted"></i>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h6 className="mb-0 fw-bold text-dark text-capitalize text-truncate" style={{fontSize: '0.9rem'}}>
                                                {punto.nombre_comun}
                                            </h6>
                                            <small className="text-muted d-block fst-italic text-truncate" style={{fontSize: '0.75rem'}}>
                                                {punto.prediccion}
                                            </small>
                                            <div className="d-flex justify-content-between mt-1">
                                                <span className="badge bg-light text-secondary border" style={{fontSize: '0.65rem'}}>
                                                    {(punto.confianza * 100).toFixed(0)}%
                                                </span>
                                                <small className="text-muted" style={{fontSize: '0.65rem'}}>
                                                    {new Date(punto.fecha).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};