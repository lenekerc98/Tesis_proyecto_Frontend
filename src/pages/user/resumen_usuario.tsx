import { useState, useEffect } from "react";
import axios from "axios";

export const Resumen = () => {
  const [metricas, setMetricas] = useState({
    totalAves: 0,
    precisionPromedio: 0,
    aveMasComun: "Ninguna",
    registrosHoy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/v1/inferencia/historial", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = Array.isArray(response.data) ? response.data : response.data.historial || [];
        
        if (data.length > 0) {
          // Lógica para calcular métricas desde el historial
          const total = data.length;
          const promedio = (data.reduce((acc: number, curr: any) => acc + (curr.confianza || 0), 0) / total) * 100;
          
          // Calcular ave más frecuente
          const conteo = data.reduce((acc: any, curr: any) => {
            const nombre = curr.especie || curr.label;
            acc[nombre] = (acc[nombre] || 0) + 1;
            return acc;
          }, {});
          const masComun = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);

          // Filtrar registros de hoy
          const hoy = new Date().toLocaleDateString();
          const hoyCount = data.filter((d: any) => new Date(d.fecha).toLocaleDateString() === hoy).length;

          setMetricas({
            totalAves: total,
            precisionPromedio: promedio,
            aveMasComun: masComun,
            registrosHoy: hoyCount
          });
        }
      } catch (e) {
        console.error("Error cargando resumen", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResumen();
  }, []);

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="p-4 animate__animated animate__fadeIn">
      <h4 className="fw-bold mb-4">Resumen de Actividad</h4>
      
      <div className="row g-3">
        {/* Card 1: Total */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-success-light p-2 rounded-3 me-3 text-success">
                <i className="bi bi-collection-fill fs-4"></i>
              </div>
              <small className="fw-bold text-muted">Total Aves</small>
            </div>
            <h2 className="fw-bold m-0">{metricas.totalAves}</h2>
          </div>
        </div>

        {/* Card 2: Precisión */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-info-light p-2 rounded-3 me-3 text-info">
                <i className="bi bi-bullseye fs-4"></i>
              </div>
              <small className="fw-bold text-muted">Precisión Media</small>
            </div>
            <h2 className="fw-bold m-0">{metricas.precisionPromedio.toFixed(0)}%</h2>
          </div>
        </div>

        {/* Card 3: Ave Frecuente */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-warning-light p-2 rounded-3 me-3 text-warning">
                <i className="bi bi-trophy-fill fs-4"></i>
              </div>
              <small className="fw-bold text-muted">Más Identificada</small>
            </div>
            <h6 className="fw-bold m-0 text-truncate">{metricas.aveMasComun}</h6>
          </div>
        </div>

        {/* Card 4: Hoy */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-primary-light p-2 rounded-3 me-3 text-primary">
                <i className="bi bi-calendar-check-fill fs-4"></i>
              </div>
              <small className="fw-bold text-muted">Hoy</small>
            </div>
            <h2 className="fw-bold m-0">{metricas.registrosHoy}</h2>
          </div>
        </div>
      </div>

      {/* Gráfico Visual Simple */}
      <div className="mt-4 p-4 bg-white rounded-4 shadow-sm">
        <h6 className="fw-bold mb-3">Progreso de Identificación</h6>
        <div className="progress" style={{height: '10px'}}>
          <div className="progress-bar bg-success" style={{width: '75%'}}></div>
        </div>
        <p className="small text-muted mt-3 mb-0">
          Has completado el 75% de tu meta semanal de avistamientos. ¡Sigue así!
        </p>
      </div>
    </div>
  );
};