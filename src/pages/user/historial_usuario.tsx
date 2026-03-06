import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalResultados } from "../../components/ModalResultados";

export const Historial = () => {
  // --- ESTADOS ---
  const [registros, setRegistros] = useState<any[]>([]);
  const [imagenesMap, setImagenesMap] = useState<Record<string, { url: string; audio_url?: string }>>({});
  const [loading, setLoading] = useState(true);

  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // --- PAGINACIÓN Y ESTADOS ---
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 10;

  // --- CARGA DE DATOS ---
  // Cargar lista de aves solo la primera vez
  useEffect(() => {
    const fetchAves = async () => {
      try {
        const resAves = await axiosClient.get("/inferencia/listar_aves");
        const mapaFotos: Record<string, { url: string; audio_url?: string }> = {};
        if (Array.isArray(resAves.data)) {
          resAves.data.forEach((ave: any) => {
            mapaFotos[ave.nombre_cientifico] = {
              url: ave.imagen_url,
              audio_url: ave.audio_url
            };
          });
        }
        setImagenesMap(mapaFotos);
      } catch (error) {
        console.error("Error cargando aves:", error);
      }
    };
    fetchAves();
  }, []);

  // Cargar historial con paginación desde el servidor
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const resHistorial = await axiosClient.get(`/inferencia/historial?page=${paginaActual}&limit=${registrosPorPagina}`);

        if (resHistorial.data && resHistorial.data.total !== undefined) {
          setRegistros(resHistorial.data.historial || []);
          setTotalRegistros(resHistorial.data.total);
        } else {
          let dataHist = Array.isArray(resHistorial.data) ? resHistorial.data : resHistorial.data.historial || [];
          setRegistros(dataHist);
          setTotalRegistros(dataHist.length);
        }

      } catch (error) {
        console.error("Error cargando historial paginado:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [paginaActual]);

  // --- HELPERS ---
  const formatearNombre = (nombre: string) => nombre ? nombre.replace(/_/g, " ") : "Desconocido";

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

  // --- ADAPTADOR DE DATOS PARA EL MODAL ---
  const datosParaModal = selectedItem ? {
    principal: {
      nombre: formatearNombre(selectedItem.prediccion),
      nombre_cientifico: selectedItem.prediccion,
      probabilidad: selectedItem.confianza,
      url_imagen: imagenesMap[selectedItem.prediccion]?.url,
      url_audio: imagenesMap[selectedItem.prediccion]?.audio_url,
      url_audio_inferencia: selectedItem.url_grabacion,
      archivo: selectedItem.url_grabacion ? selectedItem.url_grabacion.split('/').pop() : 'Grabación',
      log_id: selectedItem.log_id
    },
    lista: selectedItem.top_5 || [],
    especieUsuarioGuardada: selectedItem.especie_usuario
  } : null;

  // --- CÁLCULO DE PAGINACIÓN ---
  // Ahora la paginación es del lado del servidor, ya no recortamos el array
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
  const registrosPaginados = registros;

  // Generar números de página a mostrar (ej: 1 2 3 ... 6)
  const renderPaginas = () => {
    const paginas = [];

    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 ||
        i === totalPaginas ||
        (i >= paginaActual - 1 && i <= paginaActual + 1)
      ) {
        paginas.push(i);
      } else if (i === paginaActual - 2 || i === paginaActual + 2) {
        paginas.push("...");
      }
    }
    // Eliminar duplicados de "..."
    return [...new Set(paginas)];
  };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="p-4 animate__animated animate__fadeIn">

      {/* CABECERA IDÉNTICA A LA IMAGEN */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark m-0">Historia de Predicciones</h4>
        <span className="badge bg-success border px-3 py-2 rounded-pill">
          Mis Registros
        </span>
      </div>

      {/* LISTA DE REGISTROS */}
      {registros.length === 0 ? (
        <div className="text-center p-5 bg-white rounded-4 shadow-sm border">
          <i className="bi bi-inbox fs-1 text-muted"></i>
          <p className="mt-3 fw-bold">No hay registros disponibles</p>
        </div>
      ) : (
        <>
          <div className="d-flex flex-column gap-3">
            {registrosPaginados.map((reg, index) => {
              const imagenUrl = imagenesMap[reg.prediccion]?.url;

              return (
                <div key={index} className="card border-0 shadow-sm rounded-4 p-2 bg-white history-card border-start border-success border-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                    {/* PARTE IZQUIERDA: FOTO + NOMBRE + FECHA */}
                    <div className="d-flex align-items-center">
                      {/* Foto del Ave */}
                      <div className="me-3 position-relative">
                        {imagenUrl ? (
                          <img
                            src={imagenUrl}
                            alt="Ave"
                            className="rounded-circle border border-2 border-white shadow-sm"
                            style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => abrirImagePreview(imagenUrl)}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="bg-light rounded-circle p-3 d-flex justify-content-center align-items-center border" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-bird text-success fs-4"></i>
                          </div>
                        )}
                      </div>

                      {/* Texto */}
                      <div>
                        <h6 className="fw-bold mb-1 text-dark fst-italic text-capitalize fs-5">
                          {formatearNombre(reg.prediccion)}
                        </h6>
                        <div className="text-muted small d-flex align-items-center gap-2">
                          <span>
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(reg.fecha).toLocaleDateString()}
                          </span>
                          <span>·</span>
                          <span>
                            <i className="bi bi-clock me-1"></i>
                            {new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PARTE DERECHA: CONFIANZA + BOTÓN */}
                    <div className="d-flex align-items-center gap-3 ms-auto">

                      <span className="badge bg-success-light text-success rounded-pill px-3 py-2 fw-bold bg-opacity-10 border border-success border-opacity-25">
                        {(reg.confianza * 100).toFixed(1)}% Confianza
                      </span>

                      <button
                        className="btn btn-outline-success rounded-pill px-4 fw-bold"
                        onClick={() => abrirModalDetalle(reg)}
                      >
                        Ver Detalle
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* --- PAGINACIÓN (DISEÑO REQUERIDO) --- */}
          {totalPaginas > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-5 gap-2 pb-4">
              <button
                className="btn btn-link text-decoration-underline fw-bold text-primary p-0"
                onClick={() => setPaginaActual(1)}
                disabled={paginaActual === 1}
              >
                Primero
              </button>

              <div className="mx-3 d-flex align-items-center gap-2">
                {renderPaginas().map((p, i) => (
                  p === "..." ? (
                    <span key={i} className="text-muted mx-1">...</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPaginaActual(p as number)}
                      className={`d-flex align-items-center justify-content-center rounded-circle border fw-bold`}
                      style={{
                        width: '35px',
                        height: '35px',
                        fontSize: '0.9rem',
                        backgroundColor: paginaActual === p ? 'transparent' : 'white',
                        borderColor: paginaActual === p ? '#dc3545' : '#e9ecef', // Rojo si es activo
                        color: paginaActual === p ? '#dc3545' : '#6c757d',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button
                className="btn btn-link text-dark p-0 text-decoration-none fw-bold"
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
              >
                &gt;
              </button>

              <button
                className="btn btn-link text-decoration-underline fw-bold text-primary p-0 ms-2"
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaActual === totalPaginas}
              >
                Último
              </button>
            </div>
          )}
        </>
      )}

      {/* --- MODALES (IGUAL QUE EN EL RESUMEN) --- */}

      {/* Modal Detalle */}

      {showModal && datosParaModal && (
        <ModalResultados
          isOpen={true}
          onClose={cerrarModal}
          titulo="Detalle de Identificación"
          // Al poner la condición arriba, quitamos el '?' y el error desaparece
          prediccionPrincipal={datosParaModal.principal}
          listaPredicciones={datosParaModal.lista || []}
          onImageClick={abrirImagePreview}
          modoHistorial={true}
          especieUsuarioGuardada={datosParaModal.especieUsuarioGuardada}
          infoAvesMap={imagenesMap as any} // pasamos vacio o mapeado si se necesita (aunque modo historial no lo usa para deshabilitados) // Mejor pasamos el mapa si está disponible
        />
      )}

      {/* Modal Foto Fullscreen */}
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
          <div className="position-relative animate__animated animate__zoomIn" style={{ maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-close btn-close-white position-absolute" onClick={cerrarImagePreview} style={{ top: '-40px', right: '-40px', zIndex: 2010, fontSize: '1.5rem' }}></button>
            <img src={selectedImagePreview} alt="Vista previa" className="img-fluid rounded-3 shadow-lg" style={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }} crossOrigin="anonymous" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

    </div>
  );
};