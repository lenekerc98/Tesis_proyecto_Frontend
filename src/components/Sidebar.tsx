import React, { useState, useEffect } from 'react';
import aveIcon from "../assets/ave.png";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (state: boolean) => void;
    currentView: string;
    onNavigate: (view: string) => void;
    isAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, onNavigate, isAdmin }) => {

    // Detectar móvil
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleNavigation = (view: string) => {
        // 1. Cambiamos la vista
        onNavigate(view);

        // 2. ¡AQUÍ ESTÁ LA MAGIA!
        // Solo cerramos el menú si estamos en un celular (isMobile es true).
        // Si estamos en PC, esto no se ejecuta y el menú sigue abierto.
        if (isMobile) {
            setIsOpen(false);
        }
    };

    const sidebarStyle: React.CSSProperties = isMobile
        ? {
            position: 'fixed', left: 0, top: 0,
            width: isOpen ? '260px' : '0px',
            height: '100vh', zIndex: 1050,
            backgroundColor: "#798369",
            transition: 'width 0.3s ease',
            overflowX: 'hidden', whiteSpace: "nowrap",
            boxShadow: isOpen ? "4px 0 15px rgba(0,0,0,0.3)" : "none"
        }
        : {
            position: 'sticky', top: 0,
            width: isOpen ? '260px' : '80px',
            height: '100vh', zIndex: 1040,
            backgroundColor: "#798369",
            transition: 'width 0.3s ease',
            overflowX: 'hidden', whiteSpace: "nowrap"
        };

    const getIcon = (view: string) => {
        const map: any = {
            analizador: "mic-fill", resumen: "speedometer2", mapas: "map-fill",
            historial: "clock-history", catalogo: "images", gestion_usuarios: "people-fill",
            admin_errores: "bug-fill", admin_sesiones: "shield-lock", admin_dashboard: "speedometer2",
            admin_historial: "clock-history"
        };
        return map[view] || "circle";
    };

    const formatName = (name: string) => name.replace("admin_", "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    return (
        <>
            {isMobile && isOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1049 }} onClick={() => setIsOpen(false)}></div>
            )}

            <nav className="d-flex flex-column flex-shrink-0 text-white" style={sidebarStyle}>

                <div className={`d-flex align-items-center p-3 ${isOpen ? "justify-content-between" : "justify-content-center"}`} style={{ minHeight: '70px' }}>
                    <div className="d-flex align-items-center gap-2 overflow-hidden fade-in" style={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0, transition: 'opacity 0.2s' }}>
                        <img src={aveIcon} alt="Logo" style={{ height: '35px' }} />
                        <span className="fs-4 fw-bold">BirdIA</span>
                    </div>
                    <button className="btn btn-link text-white p-0 border-0" onClick={() => setIsOpen(!isOpen)} style={{ fontSize: "1.5rem", minWidth: '40px' }}>
                        {isMobile && isOpen ? <i className="bi bi-x-lg"></i> : <i className="bi bi-list"></i>}
                    </button>
                </div>

                <hr className="text-white opacity-25 my-1 mx-3" />

                <div className="flex-grow-1 overflow-auto px-2 py-3">
                    <ul className="nav nav-pills flex-column mb-auto gap-2">
                        {isAdmin && (
                            <>
                                {isOpen && <li className="px-3 mt-2 mb-1 text-uppercase text-white-50 fw-bold" style={{ fontSize: '0.75rem' }}>Admin</li>}
                                {["admin_dashboard", "analizador", "gestion_usuarios", "mapas", "admin_sesiones", "admin_errores", "admin_historial", "catalogo"].map((view) => (
                                    <MenuLink key={view} view={view} currentView={currentView} isOpen={isOpen} onClick={() => handleNavigation(view)} icon={getIcon(view)} label={view === "analizador" ? "Análisis Audio" : formatName(view)} />
                                ))}
                            </>
                        )}
                        {!isAdmin && (
                            <>
                                {isOpen && <li className="px-3 mt-2 mb-1 text-uppercase text-white-50 fw-bold" style={{ fontSize: '0.75rem' }}>Investigación</li>}
                                {["analizador", "resumen", "mapas", "catalogo", "historial"].map((view) => (
                                    <MenuLink key={view} view={view} currentView={currentView} isOpen={isOpen} onClick={() => handleNavigation(view)} icon={getIcon(view)} label={view === "analizador" ? "Análisis Audio" : formatName(view)} />
                                ))}
                            </>
                        )}
                    </ul>
                </div>
            </nav>
        </>
    );
};

const MenuLink = ({ view, currentView, isOpen, onClick, icon, label }: any) => (
    <li className="nav-item">
        <div onClick={onClick} className={`nav-link text-white d-flex align-items-center ${currentView === view ? "active bg-success shadow-sm" : ""}`} style={{ cursor: "pointer", justifyContent: isOpen ? "flex-start" : "center", padding: "12px", borderRadius: "10px", transition: "all 0.2s" }}>
            <i className={`bi bi-${icon} fs-5`} style={{ minWidth: "25px", textAlign: "center" }}></i>
            {isOpen && <span className="ms-3 fade-in" style={{ fontSize: '0.95rem' }}>{label}</span>}
        </div>
    </li>
);