import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalResultados } from "../../components/ModalResultados";

interface InfoAve {
  url: string;
  nombreComun: string;
  audio_url?: string;
}

export const Historial_admin = () => {
  // --- ESTADOS ---
  const [registros, setRegistros] = useState<any[]>([]);
  const [infoAvesMap, setInfoAvesMap] = useState<Record<string, InfoAve>>({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- NORMALIZACIÓN ROBUSTA ---
  const normalizar = (texto: string) => {
    if (!texto) return "";
    return texto.toLowerCase().replace(/_/g, " ").trim();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [resHistorial, resAves] = await Promise.all([
          axiosClient.get("/admin/logs/historial"),
          axiosClient.get("/inferencia/listar_aves")
        ]);

        // --- MAPA DE AVES ---
        const mapaInfo: Record<string, InfoAve> = {};

        if (Array.isArray(resAves.data)) {
          resAves.data.forEach((ave: any) => {
            const clave = normalizar(ave.nombre_cientifico);
            mapaInfo[clave] = {
              url: ave.imagen_url,
              nombreComun: ave.nombre,
              audio_url: ave.audio_url
            };
          });
        }
        setInfoAvesMap(mapaInfo);

        let data = Array.isArray(resHistorial.data) ? resHistorial.data : [];

        // FILTRO VISUAL: Ocultamos "Desconocido"
        data = data.filter((item: any) => item.prediccion !== "Desconocido");

        setRegistros(data);

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTRO DE BÚSQUEDA ---
  const registrosFiltrados = registros.filter(reg => {
    const nombreCientificoNorm = normalizar(reg.prediccion);
    const infoAve = infoAvesMap[nombreCientificoNorm];
    const nombreComun = infoAve?.nombreComun || "";

    return (
      (reg.usuario || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (reg.prediccion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      nombreComun.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  const formatearTexto = (texto: string) => {
    if (!texto) return "Desconocido";
    const limpio = texto.replace(/_/g, " ");
    return limpio.replace(/\b\w/g, l => l.toUpperCase());
  };

  const abrirModal = (item: any) => { setSelectedItem(item); setShowModal(true); };
  const cerrarModal = () => { setShowModal(false); setSelectedItem(null); };

  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
  const indiceUltimo = paginaActual * registrosPorPagina;
  const indicePrimero = indiceUltimo - registrosPorPagina;
  const registrosPaginados = registrosFiltrados.slice(indicePrimero, indiceUltimo);

  const renderPaginas = () => {
    const paginas = [];
    for (let i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
        paginas.push(i);
      } else if (i === paginaActual - 2 || i === paginaActual + 2) {
        paginas.push("...");
      }
    }
    return [...new Set(paginas)];
  };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;


  return (
    <div className="p-4 animate__animated animate__fadeIn">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0">Historial Global</h3>
          <p className="text-muted m-0">Registro completo de identificaciones.</p>
        </div>
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text bg-white border-end-0 rounded-start-pill">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 rounded-end-pill"
            placeholder="Buscar usuario o ave..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 ps-4">Ave Identificada</th>
                <th className="py-3">Usuario</th>
                <th className="py-3">Confianza</th>
                <th className="py-3">Fecha</th>
                <th className="py-3 text-end pe-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {registrosPaginados.length > 0 ? (
                registrosPaginados.map((reg) => {

                  const clave = normalizar(reg.prediccion);
                  const infoAve = infoAvesMap[clave];
                  const fotoUrl = infoAve?.url;
                  const nombreMostrar = infoAve?.nombreComun || formatearTexto(reg.prediccion);

                  return (
                    <tr key={reg.log_id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          {/* FOTO CON SOLUCIÓN AL BLOQUEO */}
                          <div className="me-3 position-relative" style={{ width: '45px', height: '45px' }}>
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt="Ave"
                                className="rounded-circle border shadow-sm w-100 h-100 object-fit-cover"

                                /* --- ¡AQUÍ ESTÁ LA MAGIA! --- */
                                /* Esto evita que el navegador envíe info extra que AWS bloquea */
                                referrerPolicy="no-referrer"
                                /* ---------------------------- */

                                onError={(e) => {
                                  // Si falla la carga, ocultamos la imagen para que se vea el icono de fondo
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="bg-light rounded-circle border d-flex align-items-center justify-content-center w-100 h-100">
                                <i className="bi bi-bird text-muted"></i>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="fw-bold text-dark text-capitalize">
                              {nombreMostrar}
                            </div>
                            <small className="text-muted fst-italic">
                              {formatearTexto(reg.prediccion)}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                            {(reg.usuario || "A").charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                            {reg.usuario || "Anónimo"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${reg.confianza > 0.8 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} border rounded-pill px-3`}>
                          {(reg.confianza * 100).toFixed(1)}%
                        </span>
                      </td>

                      <td className="text-muted small">
                        <div>{new Date(reg.fecha).toLocaleDateString()}</div>
                        <div className="opacity-75">{new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => abrirModal(reg)}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINACIÓN (DISEÑO REQUERIDO) --- */}
        {totalPaginas > 1 && (
          <div className="card-footer bg-white border-top-0 py-4">
            <div className="d-flex justify-content-center align-items-center gap-2">
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
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      {selectedItem && (
        <ModalResultados
          isOpen={showModal}
          onClose={cerrarModal}
          titulo={`Historial de Predicciones - ID: ${selectedItem.log_id}`}
          prediccionPrincipal={{
            nombre: infoAvesMap[normalizar(selectedItem.prediccion)]?.nombreComun || formatearTexto(selectedItem.prediccion),
            nombre_cientifico: selectedItem.prediccion,
            probabilidad: selectedItem.confianza,
            url_imagen: infoAvesMap[normalizar(selectedItem.prediccion)]?.url,
            url_audio: infoAvesMap[normalizar(selectedItem.prediccion)]?.audio_url,
            url_audio_inferencia: selectedItem.url_grabacion,
            archivo: selectedItem.url_grabacion ? selectedItem.url_grabacion.split('/').pop() : 'Grabación'
          }}
          listaPredicciones={selectedItem.top_5 || []}
          modoHistorial={true}
          especieUsuarioGuardada={selectedItem.especie_usuario}
        />
      )}

    </div>
  );
};