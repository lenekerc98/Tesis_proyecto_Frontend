import React, { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./../App.css"; 

interface NavbarProps {
  toggleSidebar: () => void;
  currentView: string;
  userName: string;
  userRole: string;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  toggleSidebar, 
  currentView, 
  userName, 
  userRole, 
  onLogout,
  onNavigate 
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const formattedTitle = currentView.replace("admin_", "").replace(/_/g, " ");

  return (
    <nav
        className="navbar navbar-light bg-white shadow-sm px-4 py-2 sticky-top custom-navbar"
        onClick={(e) => e.stopPropagation()}
    >
      <div className="d-flex align-items-center justify-content-between w-100">
        
        {/* IZQUIERDA */}
        <div className="d-flex align-items-center">
          <button 
            onClick={toggleSidebar} 
            className="btn btn-success px-3 me-3 d-md-none btn-sidebar-toggle"
          >
              <i className="bi bi-list fs-5"></i>
          </button>
          <h5 className="mb-0 fw-bold text-secondary text-capitalize">
              {formattedTitle}
          </h5>
        </div>

        {/* DERECHA: PERFIL + DROPDOWN */}
        <div className="position-relative">
            {/* TRIGGER (Lo que se hace clic) */}
            <div 
                className="profile-trigger d-flex align-items-center gap-2 p-1 rounded-pill pe-3 shadow-sm border bg-white user-select-none" 
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
                {/* Avatar */}
                <div className={`avatar-circle d-flex justify-content-center align-items-center text-white rounded-circle ${userRole === 'Administrador' ? 'bg-dark' : 'bg-secondary'}`} 
                     style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-person-fill fs-5"></i>
                </div>
                
                {/* Texto (Oculto en móviles muy pequeños) */}
                <div className="d-none d-sm-flex flex-column text-start" style={{ lineHeight: '1.2' }}>
                    <span className="fw-bold text-dark small text-truncate" style={{ maxWidth: '120px' }}>
                        {userName} 
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {userRole}
                    </span>
                </div>
                
                {/* Flecha */}
                <i className={`bi bi-chevron-down text-muted small ms-2 transition-icon ${showProfileMenu ? 'rotate-180' : ''}`}></i>
            </div>

            {/* MENÚ FLOTANTE */}
            {showProfileMenu && (
                <>
                    {/* TELÓN INVISIBLE (Para cerrar al hacer clic fuera) */}
                    <div
                        className="overlay-backdrop"
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 998 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileMenu(false);
                        }}
                    ></div>

                    {/* LA VENTANA DEL MENÚ */}
                    <div className="position-absolute end-0 mt-3 bg-white rounded-4 shadow-lg border overflow-hidden profile-dropdown-menu animate__animated animate__fadeIn" 
                         style={{ minWidth: '260px', zIndex: 999 }}>
                        
                        {/* Cabecera del menú */}
                        <div className="p-3 border-bottom bg-light">
                            <p className="mb-0 fw-bold text-dark">Mi Cuenta</p>
                            <small className="text-muted text-truncate d-block">{userName}</small>
                        </div>

                        {/* Opciones */}
                        <ul className="list-unstyled m-0 p-2">
                            <li>
                                <button 
                                    className="btn btn-white w-100 text-start px-3 py-2 text-dark rounded-3 mb-1 border-0 hover-bg-light d-flex align-items-center" 
                                    onClick={() => { onNavigate("perfil"); setShowProfileMenu(false); }}
                                >
                                    <i className="bi bi-person-gear me-3 text-primary fs-5"></i> 
                                    <span>Mi Perfil</span>
                                </button>
                            </li>
                            <li><hr className="dropdown-divider my-1 border-secondary border-opacity-10" /></li>
                            <li>
                                <button 
                                    className="btn btn-white w-100 text-start px-3 py-2 text-danger fw-bold rounded-3 border-0 hover-bg-light d-flex align-items-center" 
                                    onClick={onLogout}
                                >
                                    <i className="bi bi-box-arrow-right me-3 fs-5"></i> 
                                    <span>Cerrar Sesión</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </>
            )}
        </div>

      </div>
    </nav>
  );
};