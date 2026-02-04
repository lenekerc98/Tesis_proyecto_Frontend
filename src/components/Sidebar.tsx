import React from 'react';
import aveIcon from "../assets/ave.png";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  isAdmin: boolean; 
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, onNavigate, isAdmin }) => {

  const handleNavigation = (e: React.MouseEvent, view: string) => {
    e.preventDefault();
    onNavigate(view);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <nav id="sidebar" className={`d-flex flex-column h-100 ${isOpen ? "active" : ""}`}>
      
      {/* --- CABECERA (LOGO) --- */}
      <div className="d-flex justify-content-center align-items-center p-3 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2">
            <img 
                src={aveIcon} 
                alt="Logo BirdIA" 
                style={{ height: '35px', width: 'auto' }} 
            />
            <span className="text-white fw-bold fs-4">
                BirdIA
            </span>
        </div>
        <button className="btn btn-sm btn-outline-light d-md-none" onClick={() => setIsOpen(false)}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* --- LISTA DE MENÚ (Con scroll si es necesario) --- */}
      <div className="flex-grow-1 overflow-auto">
          <ul className="list-unstyled p-3">
            
            {/* ================================================= */}
            {/* 1. OPCIONES DE ADMINISTRADOR                      */}
            {/* ================================================= */}
            {isAdmin && (
                <>
                    <li className="mb-2">
                        <small className="text-uppercase text-muted fw-bold ms-2" style={{fontSize: '0.7rem'}}>Panel de Control</small>
                    </li>
                    <li>
                        <a href="#" className={currentView === "admin_dashboard" ? "active" : ""} onClick={(e) => handleNavigation(e, "admin_dashboard")}>
                            <i className="bi bi-speedometer2"></i> Resumen
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "analizador" ? "active" : ""} onClick={(e) => handleNavigation(e, "analizador")}>
                            <i className="bi bi-mic-fill"></i> Análisis de Audio
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "gestion_usuarios" ? "active" : ""} onClick={(e) => handleNavigation(e, "gestion_usuarios")}>
                            <i className="bi bi-people-fill"></i> Usuarios
                        </a>
                    </li>              
                    <li>
                        <a href="#" className={currentView === "mapas" ? "active" : ""} onClick={(e) => handleNavigation(e, "mapas")}>
                            <i className="bi bi-map-fill"></i> Mapas Globales
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "admin_sesiones" ? "active" : ""} onClick={(e) => handleNavigation(e, "admin_sesiones")}>
                            <i className="bi bi-shield-lock"></i> Auditoría Sesiones
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "admin_errores" ? "active" : ""} onClick={(e) => handleNavigation(e, "admin_errores")}>
                            <i className="bi bi-bug-fill"></i> Logs de Errores
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "admin_historial" ? "active" : ""} onClick={(e) => handleNavigation(e, "admin_historial")}>
                            <i className="bi bi-clock-history"></i> Historial Global
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "catalogo" ? "active" : ""} onClick={(e) => handleNavigation(e, "catalogo")}>
                            <i className="bi bi-images"></i> Catálogo de Aves
                        </a>
                    </li>
                </>
            )}

            {/* ================================================= */}
            {/* 2. OPCIONES DE USUARIO NORMAL                     */}
            {/* ================================================= */}
            {!isAdmin && (
                <>
                    <li className="mb-2">
                        <small className="text-uppercase text-muted fw-bold ms-2" style={{fontSize: '0.7rem'}}>Investigación</small>
                    </li>
                    <li>
                        <a href="#" className={currentView === "analizador" ? "active" : ""} onClick={(e) => handleNavigation(e, "analizador")}>
                            <i className="bi bi-mic-fill"></i> Análisis de Audio
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "resumen" ? "active" : ""} onClick={(e) => handleNavigation(e, "resumen")}>
                            <i className="bi bi-house-fill"></i> Resumen
                        </a>
                    </li>
                    
                    {/* AGREGADO: MAPAS PARA USUARIO */}
                    <li>
                        <a href="#" className={currentView === "mapas" ? "active" : ""} onClick={(e) => handleNavigation(e, "mapas")}>
                            <i className="bi bi-map-fill"></i> Mis Mapas
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "catalogo" ? "active" : ""} onClick={(e) => handleNavigation(e, "catalogo")}>
                            <i className="bi bi-images"></i> Catálogo de Aves
                        </a>
                    </li>
                    <li>
                        <a href="#" className={currentView === "historial" ? "active" : ""} onClick={(e) => handleNavigation(e, "historial")}>
                            <i className="bi bi-clock-history"></i> Historial
                        </a>
                    </li>
                </>
            )}
          </ul>
      </div>
    </nav>
  );
};