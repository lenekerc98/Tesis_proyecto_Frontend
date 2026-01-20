import { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

export const Historial = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos
  useEffect(() => {
    const obtenerHistorial = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/v1/inferencia/historial", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        // Tu API devuelve un array directo, así que usamos response.data
        setRegistros(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error al obtener el historial:", error);
      } finally {
        setLoading(false);
      }
    };
    obtenerHistorial();
  }, []);

  // 2. Eliminar (Usando log_id)
  const eliminarRegistro = async (id: number) => {
    if (!window.confirm("¿Eliminar este análisis?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/v1/inferencia/eliminar/${id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      // Filtramos usando 'log_id' que es lo que viene en tu API
      setRegistros(registros.filter(r => r.log_id !== id));
    } catch (e) {
      alert("No se pudo eliminar.");
    }
  };

  // Función auxiliar para limpiar el nombre (Quitar guiones bajos)
  const formatearNombre = (nombre: string) => {
    if (!nombre) return "Desconocido";
    return nombre.replace(/_/g, " "); // Convierte "Chordeiles_acutipennis" a "Chordeiles acutipennis"
  };

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark m-0">Mis Identificaciones</h4>
        <span className="badge bg-success rounded-pill px-3">{registros.length} registros</span>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted">Cargando historial...</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center mt-5 p-5 bg-white rounded-4 shadow-sm border">
          <i className="bi bi-mic-mute fs-1 text-muted"></i>
          <p className="mt-3 fw-bold">No hay registros</p>
        </div>
      ) : (
        <div className="row">
          {registros.map((reg) => (
            /* USA log_id COMO KEY */
            <div key={reg.log_id} className="col-12 mb-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white history-card border-start border-success border-4">
                <div className="d-flex justify-content-between align-items-center">
                  
                  <div className="d-flex align-items-center">
                    <div className="icon-circle-history me-3">
                      <i className="bi bi-bird text-success fs-4"></i>
                    </div>
                    <div>
                      {/* NOMBRE CIENTÍFICO (Como Título Principal) */}
                      <h6 className="fw-bold mb-0 text-dark fst-italic text-capitalize">
                        {formatearNombre(reg.prediccion)}
                      </h6>
                      
                      {/* FECHA */}
                      <p className="mb-0 text-muted small mt-1">
                        <i className="bi bi-calendar3 me-1"></i> 
                        {new Date(reg.fecha).toLocaleDateString()} 
                        {" · "} 
                        {new Date(reg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>

                  <div className="text-end">
                    {/* CONFIANZA */}
                    <div className="badge bg-success-light text-success rounded-pill px-3 py-2 mb-2">
                      {(reg.confianza * 100).toFixed(1)}%
                    </div>
                    
                    {/* BOTÓN ELIMINAR (Pasa reg.log_id) */}
                    <button 
                      className="btn btn-sm btn-outline-danger border-0 d-block w-100"
                      onClick={() => eliminarRegistro(reg.log_id)}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};