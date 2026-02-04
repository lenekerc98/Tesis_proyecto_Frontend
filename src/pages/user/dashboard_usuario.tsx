import { useState, useEffect } from "react";
import axiosClient from "../../../src/api/axiosClient";
import "../../App.css";

export const Historial = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos
  useEffect(() => {
    const obtenerHistorial = async () => {
      try {
        const response = await axiosClient.get("/inferencia/historial", {
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