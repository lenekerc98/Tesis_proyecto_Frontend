import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

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
  prediccionPrincipal: Prediccion & { url_imagen?: string, url_audio?: string, url_audio_inferencia?: string, log_id?: number, archivo?: string };
  listaPredicciones: Prediccion[];
  botonAccion?: React.ReactNode;
  onImageClick?: (url: string) => void;
  infoAvesMap?: Record<string, { nombre: string; url: string }>;

  // Nuevas props para la lógica de confirmar especie y modo historial
  modoHistorial?: boolean;
  especieUsuarioGuardada?: string | null;
  onGuardarEspecie?: (logId: number, especieConfirmada: string, esCorrecta: boolean) => void;
}

export const ModalResultados: React.FC<Props> = ({
  isOpen,
  onClose,
  titulo,
  prediccionPrincipal,
  listaPredicciones,
  botonAccion,
  modoHistorial = false,
  especieUsuarioGuardada = null,
  onGuardarEspecie,
  infoAvesMap,
}) => {
  // Estado para manejar el Zoom de la imagen
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  // Estados para validación del ave detectada por el usuario
  const [esAveCorrecta, setEsAveCorrecta] = useState(true);
  const [aveSeleccionada, setAveSeleccionada] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fueGuardado, setFueGuardado] = useState(false);

  // Estado para la lista consumida directo del catálogo
  const [listaNombresAves, setListaNombresAves] = useState<string[]>([]);

  useEffect(() => {
    // Si la lista de aves no ha sido cargada, la traemos directo de la API
    const obtenerCatalogo = async () => {
      try {
        const res = await axiosClient.get("/inferencia/listar_aves");
        if (Array.isArray(res.data)) {
          const nombresLimpios = res.data
            .map((a: any) => a.nombre)
            .filter(Boolean); // filtra vacíos
          setListaNombresAves(Array.from(new Set(nombresLimpios)).sort() as string[]);
        }
      } catch (error) {
        console.error("Error al obtener catálogo de aves:", error);
      }
    };
    obtenerCatalogo();
  }, []);

  useEffect(() => {
    if (modoHistorial) {
      // Si estamos viendo el historial, inicializamos con el dato real de base de datos
      const aveInferencia = prediccionPrincipal?.nombre || prediccionPrincipal?.nombre_cientifico || "";

      // Si el usuario guardó un ave diferente
      if (especieUsuarioGuardada && especieUsuarioGuardada !== aveInferencia) {
        setEsAveCorrecta(false);
        setAveSeleccionada(especieUsuarioGuardada);
      } else {
        setEsAveCorrecta(true);
        setAveSeleccionada(aveInferencia);
      }
    } else {
      // Modo Analizador
      setEsAveCorrecta(true);
      setAveSeleccionada(prediccionPrincipal?.nombre || prediccionPrincipal?.nombre_cientifico || "");
    }
  }, [prediccionPrincipal, modoHistorial, especieUsuarioGuardada]);

  const handleGuardar = async () => {
    if (onGuardarEspecie) {
      setGuardando(true);
      const nombreParaGuardar = esAveCorrecta ? (prediccionPrincipal.nombre || prediccionPrincipal.nombre_cientifico) : aveSeleccionada;
      try {
        await onGuardarEspecie(prediccionPrincipal.log_id || 0, nombreParaGuardar, esAveCorrecta);
        setFueGuardado(true);
      } catch (error) {
        console.error("Error al guardar en el componente:", error);
      } finally {
        setGuardando(false);
      }
    }
  };

  if (!isOpen) return null;

  const pct = (prediccionPrincipal.probabilidad * 100).toFixed(1);

  // --- IMAGEN DINÁMICA ---
  let imagenAMostrar = prediccionPrincipal.url_imagen;

  // Mostramos temporalmente la foto del ave que está seleccionando el usuario,
  // y cuando guarda, devolvemos a la foto original de la IA.
  if (!esAveCorrecta && !fueGuardado && aveSeleccionada && infoAvesMap) {
    const claveAves = Object.keys(infoAvesMap);
    const claveCientifica = claveAves.find(k => infoAvesMap[k].nombre === aveSeleccionada || k === aveSeleccionada);

    if (claveCientifica && infoAvesMap[claveCientifica].url) {
      imagenAMostrar = infoAvesMap[claveCientifica].url;
    }
  }

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
                      🐦 Ave Identificada
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
                  {imagenAMostrar && (
                    <div className="col-12 col-md-4 text-center">
                      <div
                        className="position-relative d-inline-block"
                        style={{ cursor: "zoom-in" }}
                        onClick={() => setImagenZoom(imagenAMostrar!)}
                      >
                        <img
                          src={imagenAMostrar}
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

                  {/* NUEVA SECCIÓN: CONFIRMACIÓN DE AVE Y REPRODUCTOR */}
                  <div className="col-12 mt-3 pt-4 border-top border-warning-subtle">
                    <div className="row align-items-stretch">

                      {/* COLUMNA IZQUIERDA: REPRODUCTOR */}
                      <div className="col-12 col-md-6 mb-3 mb-md-0 d-flex flex-column">
                        {prediccionPrincipal.url_audio_inferencia && (
                          <div className="bg-white p-3 rounded border shadow-sm w-100 h-100 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-mic-fill text-primary fs-5 me-2"></i>
                              <span className="fw-bold text-dark">{modoHistorial ? "Grabación Original" : "Audio Analizado"}</span>
                            </div>
                            <audio src={prediccionPrincipal.url_audio_inferencia} controls className="w-100 mt-1" style={{ height: '35px', outline: 'none' }} />
                          </div>
                        )}
                      </div>

                      {/* COLUMNA DERECHA: FORMULARIO Y BOTÓN GUARDAR */}
                      <div className="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div className="form-check form-switch mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkAveCorrecta"
                            checked={esAveCorrecta}
                            onChange={(e) => setEsAveCorrecta(e.target.checked)}
                            disabled={modoHistorial || fueGuardado}
                          />
                          <label
                            className="form-check-label fw-bold text-dark"
                            htmlFor="checkAveCorrecta"
                            style={(modoHistorial || fueGuardado) ? { cursor: "not-allowed", opacity: 0.8 } : { cursor: "pointer" }}
                          >
                            {modoHistorial
                              ? (esAveCorrecta ? "Marcado como Correcta" : "Marcado como Incorrecta")
                              : "¿Es correcta? (Desmarca si no lo es)"}
                          </label>
                        </div>

                        <div className="mb-2">
                          <label className="form-label text-muted small fw-bold mb-1">
                            {modoHistorial ? "Ave seleccionada por el usuario:" : "Si es incorrecta, selecciona el ave real:"}
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={aveSeleccionada}
                            onChange={(e) => setAveSeleccionada(e.target.value)}
                            disabled={esAveCorrecta || modoHistorial || fueGuardado}
                          >
                            <option value={prediccionPrincipal.nombre || prediccionPrincipal.nombre_cientifico} className="fw-bold">
                              {prediccionPrincipal.nombre || prediccionPrincipal.nombre_cientifico} (Detectada)
                            </option>
                            {listaNombresAves.map((nombre, i) => {
                              const nombreDetectado = prediccionPrincipal.nombre || prediccionPrincipal.nombre_cientifico;
                              if (nombre !== nombreDetectado) {
                                return <option key={i} value={nombre}>{nombre}</option>;
                              }
                              return null;
                            })}
                          </select>
                        </div>

                        {/* BOTÓN DE GUARDADO POSICIONADO JUSTO AQUÍ, ALINEADO A LA DERECHA */}
                        {!modoHistorial && onGuardarEspecie && (
                          <div className="d-flex justify-content-end mt-1">
                            <button
                              className={`btn btn-sm ${fueGuardado ? 'btn-success' : 'btn-primary'} text-white fw-bold px-4 rounded shadow-sm`}
                              style={!fueGuardado ? { backgroundColor: '#5f754a', borderColor: '#5f754a' } : {}}
                              onClick={handleGuardar}
                              disabled={guardando || fueGuardado}
                            >
                              {guardando ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                              ) : fueGuardado ? (
                                <><i className="bi bi-check-circle me-2"></i>Guardado</>
                              ) : (
                                <>Guardar</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

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

          <div className="modal-footer bg-light d-flex flex-wrap justify-content-between">
            {botonAccion && <div>{botonAccion}</div>}

            <div className="d-flex gap-2 ms-auto">
              <button className="btn btn-secondary px-4 fw-bold" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};