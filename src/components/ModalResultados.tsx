import React from "react";

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
  // Combinamos Prediccion con un campo opcional url_imagen
  prediccionPrincipal: Prediccion & { url_imagen?: string };
  listaPredicciones: Prediccion[];
  botonAccion?: React.ReactNode; // El botón opcional (Nuevo Análisis)
  onImageClick?: (url: string) => void;
}

export const ModalResultados: React.FC<Props> = ({
  isOpen,
  onClose,
  titulo,
  prediccionPrincipal,
  listaPredicciones,
  onImageClick,
  botonAccion,
}) => {
  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  const pct = (prediccionPrincipal.probabilidad * 100).toFixed(1);

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,.5)", zIndex: 1055 }}
      // Al hacer click fuera (en el fondo oscuro), cerramos el modal
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        // Evitamos que el click dentro del modal lo cierre
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0">
          
          {/* HEADER */}
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-file-earmark-medical me-2"></i>
              {/* Usamos el título que viene por props */}
              {titulo}
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body bg-light">
            {/* TARJETA PRINCIPAL: ESPECIE IDENTIFICADA */}
            <div
              className="card mb-4 border-warning shadow-sm"
              style={{ backgroundColor: "#fffbf0" }}
            >
              <div className="card-body">
                <div className="row align-items-center g-3">
                  
                  {/* TEXTO DE LA PREDICCIÓN */}
                  <div className="col-12 col-md-8">
                    <span className="badge bg-success mb-2 p-2">
                      🏆 Especie Identificada
                    </span>

                    <h3 className="fw-bold text-dark mb-1 text-capitalize">
                      {prediccionPrincipal.nombre ||
                        prediccionPrincipal.nombre_cientifico}
                    </h3>

                    <div className="fst-italic text-muted mb-3">
                      {prediccionPrincipal.nombre_cientifico}
                    </div>

                    <div className="d-flex align-items-center">
                      <div
                        className="progress flex-grow-1 me-3"
                        style={{ height: "15px" }}
                      >
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="fw-bold text-success fs-5">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* FOTO DE LA PREDICCIÓN (Clickable) */}
                  {prediccionPrincipal.url_imagen && (
                    <div className="col-12 col-md-4 text-center">
                      <div
                        className="position-relative d-inline-block"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          onImageClick &&
                          onImageClick(prediccionPrincipal.url_imagen!)
                        }
                      >
                        <img
                          src={prediccionPrincipal.url_imagen}
                          alt="especie"
                          className="img-fluid rounded border border-2 border-white shadow"
                          style={{ maxHeight: 140, objectFit: "cover" }}
                          crossOrigin="anonymous"
                        />
                        <div className="position-absolute bottom-0 end-0 bg-dark bg-opacity-50 text-white p-1 rounded-start rounded-bottom small">
                          <i className="bi bi-zoom-in"></i>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TABLA TOP 5 RESULTADOS */}
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
                      <th className="d-none d-md-table-cell">
                        Nombre Científico
                      </th>
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
                              <div
                                className="progress flex-grow-1 me-2"
                                style={{ height: "6px" }}
                              >
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

          {/* FOOTER - AQUÍ ESTABA EL CAMBIO NECESARIO */}
          <div className="modal-footer bg-light">
            {/* 1. Si existe el botón de acción (Nuevo Análisis), lo mostramos primero */}
            {botonAccion && <div className="me-auto">{botonAccion}</div>}
            
            {/* 2. Botón de Cerrar siempre presente */}
            <button className="btn btn-secondary px-4 fw-bold" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};