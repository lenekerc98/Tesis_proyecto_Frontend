import React, { useState } from "react";

// Definimos la estructura de una predicción
interface Prediccion {
  nombre: string;
  nombre_cientifico: string;
  probabilidad: number;
}

// Definimos las propiedades que recibe el Modal
interface Props {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  prediccionPrincipal: Prediccion & { url_imagen?: string };
  listaPredicciones: Prediccion[];
  botonAccion?: React.ReactNode;
  onImageClick?: (url: string) => void;
}

export const ModalResultados: React.FC<Props> = ({
  isOpen,
  onClose,
  titulo,
  prediccionPrincipal,
  listaPredicciones,
  botonAccion,
}) => {
  // Estado para manejar el Zoom de la imagen
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  if (!isOpen) return null;

  const pct = (prediccionPrincipal.probabilidad * 100).toFixed(1);

  // --- RENDERIZADO DEL ZOOM (PANTALLA COMPLETA) ---
  if (imagenZoom) {
    return (
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 1060 }}
        onClick={() => setImagenZoom(null)} // Click afuera cierra el zoom
      >
        <div className="d-flex w-100 h-100 align-items-center justify-content-center position-relative">
          {/* Botón Cerrar Zoom */}
          <button
            className="btn btn-close btn-close-white position-absolute top-0 end-0 m-4"
            onClick={() => setImagenZoom(null)}
            style={{ zIndex: 1070 }}
          ></button>

          <img
            src={imagenZoom}
            alt="Zoom"
            className="img-fluid"
            style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain" }}
            referrerPolicy="no-referrer" // IMPORTANTE: Para que cargue de S3
          />
        </div>
      </div>
    );
  }

  // --- RENDERIZADO DEL MODAL NORMAL ---
  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,.5)", zIndex: 1055 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0">
          
          {/* HEADER */}
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-file-earmark-medical me-2"></i>
              {titulo}
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body bg-light">
            {/* TARJETA PRINCIPAL */}
            <div
              className="card mb-4 border-warning shadow-sm"
              style={{ backgroundColor: "#fffbf0" }}
            >
              <div className="card-body">
                <div className="row align-items-center g-3">
                  
                  {/* TEXTO */}
                  <div className="col-12 col-md-8">
                    <span className="badge bg-success mb-2 p-2">
                      🏆 Especie Identificada
                    </span>

                    <h3 className="fw-bold text-dark mb-1 text-capitalize">
                      {prediccionPrincipal.nombre || prediccionPrincipal.nombre_cientifico}
                    </h3>

                    <div className="fst-italic text-muted mb-3">
                      {prediccionPrincipal.nombre_cientifico}
                    </div>

                    <div className="d-flex align-items-center">
                      <div className="progress flex-grow-1 me-3" style={{ height: "15px" }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="fw-bold text-success fs-5">{pct}%</span>
                    </div>
                  </div>

                  {/* FOTO (Clickable para Zoom) */}
                  {prediccionPrincipal.url_imagen && (
                    <div className="col-12 col-md-4 text-center">
                      <div
                        className="position-relative d-inline-block"
                        style={{ cursor: "zoom-in" }}
                        onClick={() => setImagenZoom(prediccionPrincipal.url_imagen!)}
                      >
                        <img
                          src={prediccionPrincipal.url_imagen}
                          alt="especie"
                          className="img-fluid rounded border border-2 border-white shadow"
                          style={{ maxHeight: 140, objectFit: "cover" }}
                          
                          // --- SOLUCIÓN PARA QUE APAREZCA LA IMAGEN ---
                          referrerPolicy="no-referrer"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        <div className="position-absolute bottom-0 end-0 bg-dark bg-opacity-50 text-white p-1 rounded-start rounded-bottom small">
                          <i className="bi bi-arrows-fullscreen"></i>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TABLA TOP 5 */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold py-3">
                Top 5 Resultados:
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Nombre común</th>
                      <th className="d-none d-md-table-cell">Nombre Científico</th>
                      <th>Confianza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPredicciones.map((p, i) => {
                      const porcentaje = (p.probabilidad * 100).toFixed(1);
                      return (
                        <tr key={i}>
                          <td className="fw-bold text-muted">{i + 1}</td>
                          <td className="fw-bold text-capitalize">
                            {p.nombre || p.nombre_cientifico}
                          </td>
                          <td className="fst-italic text-muted d-none d-md-table-cell">
                            {p.nombre_cientifico}
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: "6px" }}>
                                <div
                                  className="progress-bar bg-success"
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                              <small className="fw-bold">{porcentaje}%</small>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light">
            {botonAccion && <div className="me-auto">{botonAccion}</div>}
            <button className="btn btn-secondary px-4 fw-bold" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};