import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalResultados } from "../../components/ModalResultados";

export const Historial_admin = () => {
  // --- ESTADOS ---
  const [registros, setRegistros] = useState<any[]>([]);
  const [imagenesMap, setImagenesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Estados para el Modal de Detalle
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- FUNCIÓN PARA QUE LOS NOMBRES COINCIDAN SIEMPRE ---
  // Convierte "Ara_Macao" -> "ara_macao" (minúsculas y sin espacios extra)
  const normalizar = (texto: string) => {
      if (!texto) return "";
      return texto.toLowerCase().trim();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. PEDIMOS LAS DOS LISTAS AL MISMO TIEMPO
        console.log("Cargando historial y aves...");
        
        const [resHistorial, resAves] = await Promise.all([
            axiosClient.get("/admin/logs/historial"), // Tu endpoint de historial admin
            axiosClient.get("/inferencia/listar_aves") // Tu catálogo para sacar las fotos
        ]);

        // 2. CREAMOS EL "MAPA" DE FOTOS
        // Clave: Nombre del ave (normalizado) -> Valor: URL de la foto
        const mapaFotos: Record<string, string> = {};
        
        if (Array.isArray(resAves.data)) {
            resAves.data.forEach((ave: any) => {
                // Usamos 'nombre_cientifico' e 'imagen_url' según tu captura
                const clave = normalizar(ave.nombre_cientifico);
                mapaFotos[clave] = ave.imagen_url;
            });
        }
        console.log("Mapa de fotos creado:", Object.keys(mapaFotos).length, "aves encontradas.");
        setImagenesMap(mapaFotos);

        // 3. GUARDAMOS EL HISTORIAL
        // Aseguramos que sea un array
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
  const registrosFiltrados = registros.filter(reg => 
      (reg.usuario || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (reg.prediccion || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  // Helper para quitar guiones bajos al mostrar (Estético)
  const formatearVisual = (texto: string) => texto ? texto.replace(/_/g, " ") : "Desconocido";

  // Manejo del Modal
  const abrirModal = (item: any) => { setSelectedItem(item); setShowModal(true); };
  const cerrarModal = () => { setShowModal(false); setSelectedItem(null); };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      
      {/* CABECERA */}
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

      {/* TABLA */}
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
                  
                  // --- AQUÍ BUSCAMOS LA FOTO ---
                  const nombreNormalizado = normalizar(reg.prediccion);
                  const fotoUrl = imagenesMap[nombreNormalizado];

                  return (
                    <tr key={reg.log_id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          {/* IMAGEN CIRCULAR */}
                          <div className="me-3 position-relative" style={{width: '45px', height: '45px'}}>
                              {fotoUrl ? (
                                <img 
                                    src={fotoUrl} 
                                    alt="Ave" 
                                    className="rounded-circle border shadow-sm w-100 h-100 object-fit-cover"
                                    onError={(e) => e.currentTarget.style.display = 'none'} 
                                />
                              ) : (
                                <div className="bg-light rounded-circle border d-flex align-items-center justify-content-center w-100 h-100">
                                    <i className="bi bi-bird text-muted"></i>
                                </div>
                              )}
                          </div>
                          
                          {/* NOMBRE DEL AVE */}
                          <div>
                              <div className="fw-bold text-dark text-capitalize">
                                  {formatearVisual(reg.prediccion)}
                              </div>
                              <small className="text-muted" style={{fontSize: '0.75rem'}}>Log #{reg.log_id}</small>
                          </div>
                        </div>
                      </td>
                      
                      {/* USUARIO */}
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

                      {/* CONFIANZA */}
                      <td>
                          <span className={`badge ${reg.confianza > 0.8 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} border rounded-pill px-3`}>
                              {(reg.confianza * 100).toFixed(1)}%
                          </span>
                      </td>

                      {/* FECHA */}
                      <td className="text-muted small">
                          <div>{new Date(reg.fecha).toLocaleDateString()}</div>
                          <div className="opacity-75">{new Date(reg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                      </td>

                      {/* BOTÓN */}
                      <td className="text-end pe-4">
                          <button 
                              className="btn btn-sm btn-outline-primary rounded-pill px-3"
                              onClick={() => abrirModal(reg)}
                          >
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

      {/* MODAL DETALLE CON FOTO */}
      {selectedItem && (
          <ModalResultados
            isOpen={showModal}
            onClose={cerrarModal}
            titulo={`Detalle Log #${selectedItem.log_id}`}
            prediccionPrincipal={{
                nombre_cientifico: selectedItem.prediccion,
                probabilidad: selectedItem.confianza,
                // Pasamos la misma foto que encontramos para la tabla
                url_imagen: imagenesMap[normalizar(selectedItem.prediccion)]
            }}
            listaPredicciones={selectedItem.top_5 || []}
          />
      )}

    </div>
  );
};