import { useState, useEffect } from "react";
import axios from "axios";

export const Resumen = () => {
  // --- ESTADOS ---
  const [metricas, setMetricas] = useState({
    totalRegistros: 0,
    precisionPromedio: 0,
    aveMasComun: "Calculando...",
    registrosHoy: 0,
    totalEspecies: 0
  });
  const [registros, setRegistros] = useState<any[]>([]);
  const [imagenesMap, setImagenesMap] = useState<Record<string, string>>({});
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<string | null>(null);

  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  // NUEVO ESTADO: Para la vista previa de la imagen en grande
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRole = String(localStorage.getItem("role_id")); 
        setRol(userRole);
        const headers = { "Authorization": `Bearer ${token}` };

        // 1. Determinar URL para "Más Frecuente" según el rol
        let urlMasFrecuente = userRole === "0"
            ? "http://127.0.0.1:8000/v1/inferencia/predicciones_mas_frecuentes_general"
            : "http://127.0.0.1:8000/v1/inferencia/predicciones_mas_frecuentes_usuario";

        // 2. Cargar TODO en paralelo
        const [resHistorial, resFrecuente, resAves] = await Promise.all([
            axios.get("http://127.0.0.1:8000/v1/inferencia/historial", { headers }), //
            axios.get(urlMasFrecuente, { headers }),
            axios.get("http://127.0.0.1:8000/v1/inferencia/listar_aves", { headers }) //
        ]);

        // --- PROCESAR CATÁLOGO DE AVES ---
        const mapaFotos: Record<string, string> = {};
        let conteoEspecies = 0;
        if (Array.isArray(resAves.data)) {
            conteoEspecies = resAves.data.length;
            resAves.data.forEach((ave: any) => {
                mapaFotos[ave.nombre_cientifico] = ave.imagen_url;
            });
            setPreviewImages(resAves.data.slice(0, 10)); // Para la tira de imágenes
        }
        setImagenesMap(mapaFotos);

        // --- PROCESAR HISTORIAL ---
        const dataHist = Array.isArray(resHistorial.data) ? resHistorial.data : resHistorial.data.historial || [];
        setRegistros(dataHist);

        // --- PROCESAR MÉTRICAS ---
        let total = 0, promedio = 0, hoyCount = 0;
        if (dataHist.length > 0) {
            total = dataHist.length;
            promedio = (dataHist.reduce((acc: number, curr: any) => acc + (curr.confianza || 0), 0) / total) * 100;
            const hoy = new Date().toLocaleDateString();
            hoyCount = dataHist.filter((d: any) => new Date(d.fecha).toLocaleDateString() === hoy).length;
        }

        // --- AVE MÁS COMÚN ---
        let masComunNombre = "Ninguna", masComunCantidad = 0;
        if (userRole === "0") {
            if (resFrecuente.data.length > 0) {
                masComunNombre = resFrecuente.data[0].prediccion_especie;
                masComunCantidad = resFrecuente.data[0].cantidad;
            }
        } else {
            if (resFrecuente.data.predicciones && resFrecuente.data.predicciones.length > 0) {
                masComunNombre = resFrecuente.data.predicciones[0].prediccion_especie;
                masComunCantidad = resFrecuente.data.predicciones[0].cantidad;
            }
        }

        setMetricas({
            totalRegistros: total,
            precisionPromedio: promedio,
            aveMasComun: masComunNombre !== "Ninguna" ? `${masComunNombre.replace(/_/g, " ")} (${masComunCantidad})` : "Ninguna",
            registrosHoy: hoyCount,
            totalEspecies: conteoEspecies
        });

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatearNombre = (nombre: string) => nombre ? nombre.replace(/_/g, " ") : "Desconocido";

  const obtenerNombreUsuario = (reg: any) => {
    if (reg.usuario) return reg.usuario;
    if (reg.nombre_completo) return reg.nombre_completo;
    if (reg.id_usuario) return `ID: ${reg.id_usuario}`;
    return "Anónimo";
  };

  const abrirModalDetalle = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // --- NUEVAS FUNCIONES PARA LA VISTA PREVIA DE IMAGEN ---
  const abrirImagePreview = (url: string) => {
    if (url) setSelectedImagePreview(url);
  };

  const cerrarImagePreview = () => {
    setSelectedImagePreview(null);
  };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      
      {/* --- SECCIÓN 1: TARJETAS DE MÉTRICAS --- */}
      <h4 className="fw-bold mb-4 text-dark">Resumen de Actividad</h4>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3 mb-4">
         <div className="col">
             <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center mb-2">
                    <div className="bg-success-light p-2 rounded-3 me-3 text-success"><i className="bi bi-collection-fill fs-4"></i></div>
                    <small className="fw-bold text-muted text-truncate">Mis Registros</small>
                </div>
                <h2 className="fw-bold m-0">{metricas.totalRegistros}</h2>
             </div>
         </div>
         <div className="col">
             <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center mb-2">
                    <div className="bg-info-light p-2 rounded-3 me-3 text-info"><i className="bi bi-bullseye fs-4"></i></div>
                    <small className="fw-bold text-muted text-truncate">Precisión Media</small>
                </div>
                <h2 className="fw-bold m-0">{metricas.precisionPromedio.toFixed(0)}%</h2>
             </div>
         </div>
         <div className="col">
             <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center mb-2">
                    <div className="bg-warning-light p-2 rounded-3 me-3 text-warning"><i className="bi bi-trophy-fill fs-4"></i></div>
                    <small className="fw-bold text-muted text-truncate">{rol === "0" ? "Top Global" : "Más Identificada"}</small>
                </div>
                <h6 className="fw-bold m-0 text-capitalize text-truncate" title={metricas.aveMasComun}>{metricas.aveMasComun}</h6>
             </div>
         </div>
         <div className="col">
             <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center mb-2">
                    <div className="bg-primary-light p-2 rounded-3 me-3 text-primary"><i className="bi bi-calendar-check-fill fs-4"></i></div>
                    <small className="fw-bold text-muted text-truncate">Registros Hoy</small>
                </div>
                <h2 className="fw-bold m-0">{metricas.registrosHoy}</h2>
             </div>
         </div>
         <div className="col">
             <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 position-relative overflow-hidden" style={{background: 'linear-gradient(145deg, #ffffff, #f5f0ff)'}}>
                <div className="d-flex align-items-center mb-2">
                    <div className="p-2 rounded-3 me-3 text-white" style={{backgroundColor: '#6f42c1'}}>
                        <i className="bi bi-book-half fs-4"></i>
                    </div>
                    <small className="fw-bold text-muted text-truncate">Catálogo Especies</small>
                </div>
                <h2 className="fw-bold m-0" style={{color: '#6f42c1'}}>{metricas.totalEspecies}</h2>
             </div>
         </div>
      </div>

      {/* --- SECCIÓN 2: TIRA DE IMÁGENES DEL CATÁLOGO --- */}
      {previewImages.length > 0 && (
        <div className="mb-5 animate__animated animate__fadeIn delay-1s">
            <div className="d-flex align-items-center justify-content-between mb-3">
                 <h5 className="fw-bold text-dark m-0">Explora el Catálogo</h5>
                 <small className="text-muted">Desliza para ver más <i className="bi bi-arrow-right"></i></small>
            </div>
            <div className="d-flex gap-3 py-2" style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}>
                {previewImages.map((ave, index) => (
                <div key={index} className="position-relative flex-shrink-0 text-center" style={{ width: '110px' }}>
                    <img
                        src={ave.imagen_url}
                        alt={ave.nombre_cientifico}
                        className="rounded-4 shadow-sm border"
                        style={{ width: '100%', height: '85px', objectFit: 'cover', cursor: 'pointer' }}
                        crossOrigin="anonymous"
                        onClick={() => abrirImagePreview(ave.imagen_url)}
                    />
                    <small className="d-block mt-2 text-muted text-truncate fst-italic" style={{fontSize: '0.7rem'}}>
                        {formatearNombre(ave.nombre_cientifico)}
                    </small>
                </div>
                ))}
                {metricas.totalEspecies > previewImages.length && (
                     <div className="flex-shrink-0 d-flex flex-column align-items-center justify-content-center bg-light rounded-4 border text-muted" style={{ width: '110px', height: '85px' }}>
                        <span className="fw-bold fs-5">+{metricas.totalEspecies - previewImages.length}</span>
                        <small style={{fontSize: '0.7rem'}}>más</small>
                     </div>
                )}
            </div>
        </div>
      )}

      {/* --- SECCIÓN 3: LISTA DE HISTORIAL --- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-dark m-0">Detalle de Identificaciones</h5>
        <span className={`badge ${rol === "0" ? "bg-warning text-dark" : "bg-success"} border px-3`}>
            {rol === "0" ? "Vista de Administrador" : "Mis Registros"}
        </span>
      </div>

      {registros.length === 0 ? (
        <div className="text-center p-5 bg-white rounded-4 shadow-sm border">
          <i className="bi bi-inbox fs-1 text-muted"></i>
          <p className="mt-3 fw-bold">No hay registros disponibles</p>
        </div>
      ) : (
        <div className="row">
          {registros.map((reg, index) => {
            const imagenUrl = imagenesMap[reg.prediccion];

            return (
              <div key={index} className="col-12 mb-2">
                <div className="card border-0 shadow-sm rounded-4 p-2 bg-white history-card border-start border-success border-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    
                    {/* IZQUIERDA: FOTO + INFO */}
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                      <div className="me-3 position-relative">
                        {imagenUrl ? (
                            // --- IMAGEN CON CLICK PARA VISTA PREVIA ---
                            <img 
                                src={imagenUrl} 
                                alt="Ave" 
                                className="rounded-circle border border-2 border-white shadow-sm"
                                style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                                crossOrigin="anonymous"
                                onClick={() => abrirImagePreview(imagenUrl)}
                            />
                        ) : (
                            <div className="icon-circle-history bg-light rounded-circle p-3 d-flex justify-content-center align-items-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-bird text-success fs-4"></i>
                            </div>
                        )}
                      </div>

                      <div>
                        <h6 className="fw-bold mb-0 text-dark fst-italic text-capitalize">
                          {formatearNombre(reg.prediccion)}
                        </h6>
                        <p className="mb-0 text-muted small mt-1">
                          <i className="bi bi-calendar3 me-1"></i> 
                          {new Date(reg.fecha).toLocaleDateString()} 
                          <span className="mx-1">·</span> 
                          <i className="bi bi-clock me-1"></i>
                          {new Date(reg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>

                    {/* DERECHA: BOTÓN Y DATOS */}
                    <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
                      
                      {rol === "0" && (
                          <div className="text-end border-end pe-3 me-2 d-none d-md-block">
                              <small className="d-block text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Usuario</small>
                              <span className="fw-bold text-primary small">{obtenerNombreUsuario(reg)}</span>
                          </div>
                      )}

                      <div className="text-end">
                        <span className="badge bg-success-light text-success rounded-pill px-3 py-1 mb-1 d-block">
                          {(reg.confianza * 100).toFixed(1)}% Confianza
                        </span>
                      </div>

                      <button 
                        className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => abrirModalDetalle(reg)}
                      >
                        Ver Detalle
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DE DETALLE (TOP 5) --- */}
      {showModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content-custom animate__animated animate__fadeInUp">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-success m-0">Detalle del Análisis</h4>
                <button className="btn-close" onClick={cerrarModal}></button>
            </div>

            <div className="text-center mb-4">
                {imagenesMap[selectedItem.prediccion] && (
                    <img 
                        src={imagenesMap[selectedItem.prediccion]} 
                        alt="Principal" 
                        className="img-fluid rounded-4 shadow-sm mb-3"
                        style={{ maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }}
                        crossOrigin="anonymous"
                        onClick={() => abrirImagePreview(imagenesMap[selectedItem.prediccion])}
                    />
                )}
                <h3 className="fst-italic text-capitalize fw-bold">{formatearNombre(selectedItem.prediccion)}</h3>
                <span className="badge bg-success rounded-pill fs-6 px-3">
                    Confianza: {(selectedItem.confianza * 100).toFixed(1)}%
                </span>
            </div>

            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">Otras Posibilidades (Top 5)</h6>
            
            <div className="results-container-desktop" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {selectedItem.top_5 && selectedItem.top_5.map((pred: any, idx: number) => (
                    <div key={idx} className="result-item d-flex justify-content-between align-items-center p-2 mb-2 rounded bg-light border">
                        <span className="fw-bold text-secondary fst-italic text-capitalize">
                            {idx + 1}. {formatearNombre(pred.nombre_cientifico)}
                        </span>
                        <span className="badge bg-secondary opacity-75 rounded-pill">
                            {(pred.probabilidad * 100).toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-end">
                <button className="btn btn-secondary rounded-pill px-4" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- NUEVO: MODAL DE VISTA PREVIA DE IMAGEN EN GRANDE --- */}
      {selectedImagePreview && (
        // CAMBIO AQUÍ: Aumentamos el z-index de 1060 a 2000
        <div 
            className="modal-overlay" 
            onClick={cerrarImagePreview} 
            style={{
                backgroundColor: 'rgba(0,0,0,0.9)', // Un poco más oscuro para mejor contraste
                zIndex: 2000, // ¡ESTE ES EL FIX! Un valor alto asegura que quede encima de todo
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh'
            }}
        >
          <div 
              className="position-relative animate__animated animate__zoomIn" 
              style={{maxWidth: '90vw', maxHeight: '90vh'}} 
              onClick={(e) => e.stopPropagation()} // Evita cerrar si das click en la imagen misma
          >
            {/* Botón de cerrar (X) más visible */}
            <button
              className="btn btn-close btn-close-white position-absolute"
              onClick={cerrarImagePreview}
              style={{ 
                  top: '-40px', 
                  right: '-40px', 
                  zIndex: 2010,
                  filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.5))',
                  fontSize: '1.5rem'
              }}
            ></button>

            <img
              src={selectedImagePreview}
              alt="Vista previa"
              className="img-fluid rounded-3 shadow-lg"
              style={{ 
                  maxHeight: '85vh', 
                  maxWidth: '85vw',
                  objectFit: 'contain',
                  border: '3px solid rgba(255,255,255,0.2)'
              }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      )}

    </div>
  );
};