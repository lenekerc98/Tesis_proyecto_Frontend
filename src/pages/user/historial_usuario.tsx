import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalResultados } from "../../components/ModalResultados";

export const Historial = () => {
  // --- ESTADOS ---
  const [registros, setRegistros] = useState<any[]>([]);
  const [imagenesMap, setImagenesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. LLAMAMOS A LAS APIS NECESARIAS
        // Solo necesitamos el historial del usuario y las fotos de referencia
        const [resHistorial, resAves] = await Promise.all([
          axiosClient.get("/inferencia/historial"),
          axiosClient.get("/inferencia/listar_aves")
        ]);

        // 2. PROCESAR MAPA DE FOTOS (Para mostrar la foto bonita del ave)
        const mapaFotos: Record<string, string> = {};
        if (Array.isArray(resAves.data)) {
          resAves.data.forEach((ave: any) => {
            mapaFotos[ave.nombre_cientifico] = ave.imagen_url;
          });
        }
        setImagenesMap(mapaFotos);

        // 3. PROCESAR HISTORIAL
        // Aseguramos que sea un array, dependiendo de cómo responda tu API
        let dataHist = Array.isArray(resHistorial.data) ? resHistorial.data : resHistorial.data.historial || [];

        // FILTRO VISUAL: Ocultamos "Desconocido"
        dataHist = dataHist.filter((item: any) => item.prediccion !== "Desconocido");

        setRegistros(dataHist);

      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      url_imagen: imagenesMap[selectedItem.prediccion]
    },
    lista: selectedItem.top_5 || []
  } : null;

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
        <div className="d-flex flex-column gap-3">
          {registros.map((reg, index) => {
            const imagenUrl = imagenesMap[reg.prediccion];

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
            <img src={selectedImagePreview} alt="Vista previa" className="img-fluid rounded-3 shadow-lg" style={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }} crossOrigin="anonymous" />
          </div>
        </div>
      )}

    </div>
  );
};