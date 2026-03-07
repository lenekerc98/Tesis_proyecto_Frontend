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

  // Paginación y Estados DB
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 10;

  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- NORMALIZACIÓN ROBUSTA ---
  const normalizar = (texto: string) => {
    if (!texto) return "";
    return texto.toLowerCase().replace(/_/g, " ").trim();
  };

  // --- CARGA DE AVES (Solo 1 vez) ---
  useEffect(() => {
    const fetchAves = async () => {
      try {
        const resAves = await axiosClient.get("/inferencia/listar_aves");
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
      } catch (error) {
        console.error("Error cargando aves:", error);
      }
    };
    fetchAves();
  }, []);

  // --- CARGA DE HISTORIAL (Paginado servidor) ---
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const resHistorial = await axiosClient.get(`/admin/logs/historial?page=${paginaActual}&limit=${registrosPorPagina}`);

        if (resHistorial.data && resHistorial.data.total !== undefined) {
          setRegistros(resHistorial.data.historial || []);
          setTotalRegistros(resHistorial.data.total);
        } else {
          let data = Array.isArray(resHistorial.data) ? resHistorial.data : [];
          setRegistros(data);
          setTotalRegistros(data.length);
        }

      } catch (error) {
        console.error("Error cargando historial admin paginado:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [paginaActual]);

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

  // --- CÁLCULO DE PAGINACIÓN ---
  // Ahora la paginación global usa el total real (si pasara del front lo limitaría, pero el backend asume todo)
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina) || 1;
  const registrosPaginados = registrosFiltrados;

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

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark m-0">Historial Global</h3>
          <p className="text-muted m-0">Registro completo de identificaciones.</p>
        </div>
        <div className="input-group w-100" style={{ maxWidth: '300px' }}>
          <span className="input-group-text bg-white border-end-0 rounded-start-pill">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 rounded-end-pill shadow-none"
            placeholder="Buscar usuario o ave..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
        {registrosPaginados.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {registrosPaginados.map((reg) => {
              const clave = normalizar(reg.prediccion);
              const infoAve = infoAvesMap[clave];
              const fotoUrl = infoAve?.url;
              const nombreMostrar = infoAve?.nombreComun || formatearTexto(reg.prediccion);

              return (
                <div key={reg.log_id} className="card border-0 shadow-sm rounded-4 p-2 bg-white history-card border-start border-success border-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                    {/* PARTE IZQUIERDA: FOTO + NOMBRE + FECHA + USUARIO */}
                    <div className="d-flex align-items-center">
                      <div className="me-3 position-relative">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt="Ave"
                            className="rounded-circle border border-2 border-white shadow-sm"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="bg-light rounded-circle p-3 d-flex justify-content-center align-items-center border" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-bird text-success fs-4"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="fw-bold text-dark text-capitalize fs-5">
                          {nombreMostrar}
                        </div>
                        <div className="text-muted small d-flex flex-wrap align-items-center gap-2 mt-1">
                          <span className="d-flex align-items-center text-primary fw-bold bg-primary bg-opacity-10 px-2 py-1 rounded">
                            <i className="bi bi-person-circle me-1"></i> {reg.usuario || "Anónimo"}
                          </span>
                          <span><i className="bi bi-calendar3 me-1"></i>{new Date(reg.fecha).toLocaleDateString()}</span>
                          <span className="d-none d-sm-inline">·</span>
                          <span><i className="bi bi-clock me-1"></i>{new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* PARTE DERECHA: CONFIANZA + BOTÓN */}
                    <div className="d-flex align-items-center gap-3 ms-auto mt-2 mt-md-0">
                      <span className="badge bg-success text-success bg-opacity-10 border border-success border-opacity-25 rounded-pill px-3 py-2 fw-bold">
                        {(reg.confianza * 100).toFixed(1)}% Confianza
                      </span>
                      <button className="btn btn-outline-success rounded-pill px-4 fw-bold shadow-sm" onClick={() => abrirModal(reg)}>
                        Ver Detalle
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron registros.
          </div>
        )}
      </div>

      {/* --- PAGINACIÓN (DISEÑO REQUERIDO) --- */}
      {totalPaginas > 1 && (
        <div className="card-footer bg-white border-top-0 py-4">
          <div className="d-flex justify-content-center align-items-center flex-wrap gap-3">
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

      {/* MODAL DETALLE */}
      {
        selectedItem && (
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
        )
      }

    </div>
  );
};