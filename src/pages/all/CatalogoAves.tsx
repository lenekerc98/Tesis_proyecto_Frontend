import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

interface Ave {
    id_ave: number;
    nombre?: string;     // Hacemos estos campos opcionales (?)
    nombre_cientifico?: string; // para evitar errores si faltan
    imagen_url?: string;
    url_imagen?: string; // Por si tu API usa este nombre
}

export const CatalogoAves = () => {
    const [aves, setAves] = useState<Ave[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAves = async () => {
            try {
                const res = await axiosClient.get("/inferencia/listar_aves"); 
                console.log("Datos recibidos:", res.data); // MIRA LA CONSOLA PARA VER QUE LLEGA
                setAves(Array.isArray(res.data) ? res.data : []); 
            } catch (error) {
                console.error("Error cargando el catálogo:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAves();
    }, []);

    // --- AQUÍ ESTABA EL POSIBLE ERROR ---
    // Usamos ( || "") para asegurar que siempre haya texto y no falle el toLowerCase()
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
                                        {/* Soportamos ambos nombres de propiedad para la imagen */}
                                        <img 
                                            src={ave.imagen_url || ave.url_imagen || "https://via.placeholder.com/300?text=No+Image"} 
                                            alt={ave.nombre || "Ave"}
                                            className="w-100 h-100 object-fit-cover"
                                            loading="lazy"
                                            onError={(e) => e.currentTarget.style.display = 'none'} // Si falla la imagen, no mostramos error roto
                                        />
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