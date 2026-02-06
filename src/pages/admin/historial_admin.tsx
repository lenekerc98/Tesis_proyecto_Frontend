import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalResultados } from "../../components/ModalResultados";

// Interfaz para saber qué guardamos en el mapa
interface InfoAve {
    url: string;
    nombreComun: string;
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
                    nombreComun: ave.nombre 
                };
            });
        }
        setInfoAvesMap(mapaInfo);

        const data = Array.isArray(resHistorial.data) ? resHistorial.data : [];
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
              {registrosFiltrados.length > 0 ? (
                registrosFiltrados.map((reg) => {
                  
                  const clave = normalizar(reg.prediccion);
                  const infoAve = infoAvesMap[clave];
                  const fotoUrl = infoAve?.url;
                  const nombreMostrar = infoAve?.nombreComun || formatearTexto(reg.prediccion);

                  return (
                    <tr key={reg.log_id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          {/* FOTO CON SOLUCIÓN AL BLOQUEO */}
                          <div className="me-3 position-relative" style={{width: '45px', height: '45px'}}>
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
                              <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold" style={{width:'30px', height:'30px', fontSize:'0.8rem'}}>
                                  {(reg.usuario || "A").charAt(0).toUpperCase()}
                              </div>
                              <span className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>
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
                          <div className="opacity-75">{new Date(reg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
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
                url_imagen: infoAvesMap[normalizar(selectedItem.prediccion)]?.url
            }}
            listaPredicciones={selectedItem.top_5 || []}
          />
      )}

    </div>
  );
};