import { MapaPredicciones } from "../../components/MapaPredicciones";

export const Mapas = () => {
  return (
    <div className="animate__animated animate__fadeIn">
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Mis Avistamientos</h2>
        <p className="text-muted">
          Visualiza geográficamente dónde has realizado tus grabaciones e identificaciones.
        </p>
      </div>

      {/* Renderizamos el componente del mapa */}
      <MapaPredicciones />
      
    </div>
  );
};