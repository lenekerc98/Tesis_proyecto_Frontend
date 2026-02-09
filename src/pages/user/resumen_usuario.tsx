import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalResultados } from "../../components/ModalResultados";

interface ResumenProps {
    onNavigate: (vista: string) => void;
}

export const Resumen = ({ onNavigate }: ResumenProps) => {
  const [metricas, setMetricas] = useState({
    totalRegistros: 0,
    precisionPromedio: 0,
    aveMasComun: "Calculando...",
    registrosHoy: 0,
    totalEspecies: 0
  });
  const [registros, setRegistros] = useState<any[]>([]);
  
  // --- NUEVOS MAPAS ---
  const [imagenesMap, setImagenesMap] = useState<Record<string, string>>({});
  const [nombresMap, setNombresMap] = useState<Record<string, string>>({}); // <--- NUEVO: Para guardar nombres comunes

  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const limpiarNombre = (nombre: string) => nombre ? nombre.replace(/_/g, " ").toLowerCase().trim() : "";

  const procesarUrlImagen = (url: string | undefined | null) => {
      if (!url) return "";
      return url; 
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRole = String(localStorage.getItem("role_id")); 
        setRol(userRole);

        let urlMasFrecuente = userRole === "0"
            ? "/inferencia/predicciones_mas_frecuentes_general"
            : "/inferencia/predicciones_mas_frecuentes_usuario";

        const [resHistorial, resFrecuente, resAves] = await Promise.all([
            axiosClient.get("/inferencia/historial"),
            axiosClient.get(urlMasFrecuente),
            axiosClient.get("/inferencia/listar_aves")
        ]);

        // --- 1. PROCESAR CATÁLOGO (FOTOS Y NOMBRES) ---
        const mapaFotos: Record<string, string> = {};
        const mapaNombres: Record<string, string> = {}; // <--- NUEVO MAPA

        if (Array.isArray(resAves.data)) {
            setPreviewImages(resAves.data.slice(0, 15));

            resAves.data.forEach((ave: any) => {
                // 1. Mapa de Fotos
                if (ave.imagen_url) {
                    mapaFotos[ave.nombre_cientifico] = ave.imagen_url;
                    mapaFotos[limpiarNombre(ave.nombre_cientifico)] = ave.imagen_url;
                }
                
                // 2. Mapa de Nombres Comunes (Aquí está la magia)
                if (ave.nombre) {
                    mapaNombres[ave.nombre_cientifico] = ave.nombre;
                    mapaNombres[limpiarNombre(ave.nombre_cientifico)] = ave.nombre;
                }
            });
        }
        setImagenesMap(mapaFotos);
        setNombresMap(mapaNombres); // <--- GUARDAMOS EL MAPA

        // --- 2. PROCESAR HISTORIAL ---
        const dataHist = Array.isArray(resHistorial.data) ? resHistorial.data : [];
        setRegistros(dataHist);

        // --- 3. MÉTRICAS ---
        let total = 0, promedio = 0, hoyCount = 0;
        if (dataHist.length > 0) {
            total = dataHist.length;
            promedio = (dataHist.reduce((acc: number, curr: any) => acc + (curr.confianza || 0), 0) / total) * 100;
            const hoy = new Date().toLocaleDateString();
            hoyCount = dataHist.filter((d: any) => new Date(d.fecha).toLocaleDateString() === hoy).length;
        }

        // --- 4. AVE MÁS COMÚN ---
        let masComunNombre = "Ninguna", masComunCantidad = 0;
        const frecData = resFrecuente.data;
        
        let cientificoTop = "";
        if (Array.isArray(frecData) && frecData.length > 0) {
             cientificoTop = frecData[0].prediccion_especie;
             masComunCantidad = frecData[0].cantidad;
        } else if (frecData.predicciones && frecData.predicciones.length > 0) {
             cientificoTop = frecData.predicciones[0].prediccion_especie;
             masComunCantidad = frecData.predicciones[0].cantidad;
        }

        // Intentamos traducir el nombre del Top 1
        if (cientificoTop) {
            // Si tenemos el nombre común en el mapa recién creado, lo usamos. Si no, formateamos el científico.
            const nombreComunTop = mapaNombres[cientificoTop] || cientificoTop.replace(/_/g, " ");
            masComunNombre = `${nombreComunTop} (${masComunCantidad})`;
        }

        setMetricas({
            totalRegistros: total,
            precisionPromedio: promedio,
            aveMasComun: masComunNombre,
            registrosHoy: hoyCount,
            totalEspecies: Array.isArray(resAves.data) ? resAves.data.length : 0
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

  // --- FUNCIÓN PARA OBTENER EL NOMBRE FINAL A MOSTRAR ---
  const obtenerNombreAve = (cientifico: string) => {
      // 1. Buscamos en el mapa de nombres comunes
      if (nombresMap[cientifico]) return nombresMap[cientifico];
      // 2. Buscamos por nombre limpio
      const limpio = limpiarNombre(cientifico);
      if (nombresMap[limpio]) return nombresMap[limpio];
      // 3. Si no hay común, formateamos el científico
      return formatearNombre(cientifico);
  };

  const obtenerNombreUsuario = (reg: any) => {
    if (reg.usuario && reg.usuario.trim() !== "") return reg.usuario;
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

  const abrirImagePreview = (url: string) => { if (url) setSelectedImagePreview(url); };
  const cerrarImagePreview = () => { setSelectedImagePreview(null); };

  // --- DATOS PARA EL MODAL ---
  const datosParaModal = selectedItem ? {
      principal: {
          // AQUI USAMOS LA NUEVA LÓGICA DE NOMBRE
          nombre: obtenerNombreAve(selectedItem.prediccion), 
          nombre_cientifico: selectedItem.prediccion,
          probabilidad: selectedItem.confianza,
          url_imagen: procesarUrlImagen(selectedItem.url_imagen) || imagenesMap[selectedItem.prediccion]
      },
      lista: selectedItem.top_5 || []
  } : null;

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      
      {/* SECCIÓN 1: TARJETAS DE MÉTRICAS */}
      <h4 className="fw-bold mb-4 text-dark">Resumen de Actividad</h4>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3 mb-4">
         {/* ... (Tarjetas de métricas igual que antes) ... */}
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

      {/* SECCIÓN 2: TIRA DE IMÁGENES DEL CATÁLOGO */}
      {previewImages.length > 0 && (
        <div className="mb-5 animate__animated animate__fadeIn delay-1s">
            <div className="d-flex align-items-center justify-content-between mb-3">
                 <h5 className="fw-bold text-dark m-0">Explora el Catálogo</h5>
                 <span 
                    className="text-primary small fw-bold" 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => onNavigate('catalogo')} 
                 >
                    Ver catálogo completo <i className="bi bi-arrow-right ms-1"></i>
                 </span>
            </div>
            <div className="d-flex gap-3 py-2" style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}>
                {previewImages.map((ave, index) => {
                    const imgUrl = procesarUrlImagen(ave.imagen_url);
                    return (
                        <div key={index} className="position-relative flex-shrink-0 text-center" style={{ width: '110px' }}>
                            {imgUrl ? (
                                <img
                                    src={imgUrl}
                                    alt={ave.nombre_cientifico}
                                    className="rounded-4 shadow-sm border"
                                    style={{ width: '100%', height: '85px', objectFit: 'cover', cursor: 'pointer' }}
                                    referrerPolicy="no-referrer"
                                    onClick={() => abrirImagePreview(imgUrl)}
                                    onError={(e) => { 
                                        e.currentTarget.style.display = 'none'; 
                                        e.currentTarget.nextElementSibling?.classList.remove('d-none');
                                    }}
                                />
                            ) : null}
                            
                            <div className={`d-flex align-items-center justify-content-center bg-light rounded-4 border ${imgUrl ? 'd-none' : ''}`} style={{ width: '100%', height: '85px' }}>
                                <i className="bi bi-image text-muted opacity-25 fs-4"></i>
                            </div>

                            <small className="d-block mt-2 text-muted text-truncate fst-italic" style={{fontSize: '0.7rem'}}>
                                {/* AQUI USAMOS EL NOMBRE COMUN SI EXISTE */}
                                {ave.nombre || formatearNombre(ave.nombre_cientifico)}
                            </small>
                        </div>
                    );
                })}
                
                {metricas.totalEspecies > previewImages.length && (
                     <div 
                        className="flex-shrink-0 d-flex flex-column align-items-center justify-content-center bg-light rounded-4 border text-muted hover-effect" 
                        style={{ width: '110px', height: '85px', cursor: 'pointer' }}
                        onClick={() => onNavigate('catalogo')}
                     >
                        <span className="fw-bold fs-5">+{metricas.totalEspecies - previewImages.length}</span>
                        <small style={{fontSize: '0.7rem'}}>más</small>
                     </div>
                )}
            </div>
        </div>
      )}

      {/* SECCIÓN 3: LISTA DE HISTORIAL */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-dark m-0">Historia de Predicciones</h5>
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
            const urlRaw = reg.url_imagen || imagenesMap[reg.prediccion] || imagenesMap[limpiarNombre(reg.prediccion)];
            const imagenUrl = procesarUrlImagen(urlRaw);

            return (
              <div key={index} className="col-12 mb-2">
                <div className="card border-0 shadow-sm rounded-4 p-2 bg-white history-card border-start border-success border-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    
                    {/* INFO IZQUIERDA */}
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                      <div className="me-3 position-relative">
                        {imagenUrl ? (
                            <img 
                                src={imagenUrl} 
                                alt="Ave" 
                                className="rounded-circle border border-2 border-white shadow-sm"
                                style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', backgroundColor: '#eee' }}
                                referrerPolicy="no-referrer"
                                onClick={() => abrirImagePreview(imagenUrl)}
                                onError={(e) => { 
                                    e.currentTarget.style.display = 'none'; 
                                    e.currentTarget.nextElementSibling?.classList.remove('d-none');
                                }}
                            />
                        ) : null}
                        <div className={`bg-light rounded-circle p-3 d-flex justify-content-center align-items-center ${imagenUrl ? 'd-none' : ''}`} style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-bird text-success fs-4"></i>
                        </div>
                      </div>

                      <div>
                        {/* --- AQUÍ SE MUESTRA EL NOMBRE COMÚN (SI EXISTE) O EL CIENTIFICO --- */}
                        <h6 className="fw-bold mb-0 text-dark text-capitalize">
                          {obtenerNombreAve(reg.prediccion)}
                        </h6>
                        <small className="text-muted fst-italic d-block mb-1" style={{fontSize: '0.8rem'}}>
                            {formatearNombre(reg.prediccion)} {/* Subtítulo con nombre científico */}
                        </small>

                        <p className="mb-0 text-muted small">
                          <i className="bi bi-calendar3 me-1"></i> 
                          {new Date(reg.fecha).toLocaleDateString()} 
                          <span className="mx-1">·</span> 
                          <i className="bi bi-clock me-1"></i>
                          {new Date(reg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>

                    {/* DERECHA */}
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

      {/* MODAL DE RESULTADOS */}
      {showModal && datosParaModal && (
          <ModalResultados
              isOpen={true}
              onClose={cerrarModal}
              titulo="Detalle de Identificación"
              prediccionPrincipal={datosParaModal.principal} 
              listaPredicciones={datosParaModal.lista || []}
              onImageClick={abrirImagePreview}
          />
      )}

      {/* MODAL PREVIEW */}
      {selectedImagePreview && (
        <div 
            className="modal-overlay" 
            onClick={cerrarImagePreview} 
            style={{
                backgroundColor: 'rgba(0,0,0,0.9)', 
                zIndex: 2000, 
                display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh'
            }}
        >
          <div className="position-relative animate__animated animate__zoomIn" style={{maxWidth: '90vw', maxHeight: '90vh'}} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-close btn-close-white position-absolute" onClick={cerrarImagePreview} style={{ top: '-40px', right: '-40px', zIndex: 2010, fontSize: '1.5rem' }}></button>
            <img src={selectedImagePreview} alt="Vista previa" className="img-fluid rounded-3 shadow-lg" style={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }} referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

    </div>
  );
};