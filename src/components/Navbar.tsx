import React, { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

interface NavbarProps {
  toggleSidebar: () => void;
  currentView: string;
  userName: string; // Recibimos el nombre real
  userRole: string; // "Administrador" o "Usuario"
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

  // Formatear título de la vista (ej: "gestion_usuarios" -> "Gestion Usuarios")
  const formattedTitle = currentView.replace("admin_", "").replace(/_/g, " ");

  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-4 py-3 sticky-top" style={{zIndex: 1020}}>
      <div className="d-flex align-items-center justify-content-between w-100">
        
        {/* IZQUIERDA: Botón Sidebar Móvil + Título */}
        <div className="d-flex align-items-center">
          <button 
            onClick={toggleSidebar} 
            className="btn btn-success px-3 me-3 d-md-none" 
            style={{background: "#798369", borderColor: "#798369"}}
          >
              <i className="bi bi-list fs-5"></i>
          </button>
          <h5 className="mb-0 fw-bold text-secondary text-capitalize">
              {formattedTitle}
          </h5>
        </div>

        {/* DERECHA: MENÚ DE PERFIL DESPLEGABLE */}
        <div className="position-relative">
            <div 
                className="d-flex align-items-center bg-light border px-3 py-2 rounded-pill shadow-sm cursor-pointer user-select-none" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{cursor: 'pointer', transition: 'background 0.2s'}}
            >
                {/* ICONO CON COLOR SEGÚN ROL */}
                <div className={`rounded-circle d-flex justify-content-center align-items-center me-2 ${userRole === 'Administrador' ? 'bg-dark' : 'bg-secondary'} text-white`} style={{width:'35px', height:'35px'}}>
                    <i className="bi bi-person-fill"></i>
                </div>
                
                {/* NOMBRE Y ROL DINÁMICOS */}
                <div className="d-none d-sm-flex flex-column me-2 text-start" style={{lineHeight: '1.2'}}>
                    <span className="fw-bold text-dark small text-truncate" style={{maxWidth: '150px'}}>
                        {userName} 
                    </span>
                    <span className="text-muted text-uppercase" style={{fontSize: '0.65rem'}}>
                        {userRole}
                    </span>
                </div>
                
                <i className={`bi bi-chevron-down text-muted small transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}></i>
            </div>

            {/* DROPDOWN MENU */}
            {showProfileMenu && (
                <>
                    {/* Overlay transparente para cerrar al hacer clic fuera */}
                    <div 
                        style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex: 1021}} 
                        onClick={() => setShowProfileMenu(false)}
                    ></div>

                    <div className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg border overflow-hidden animate__animated animate__fadeIn" style={{width: '240px', zIndex: 1022}}>
                        <div className="p-3 border-bottom bg-light">
                            <p className="mb-0 fw-bold text-dark small">Mi Cuenta</p>
                            <small className="text-muted" style={{fontSize:'0.7rem'}}>{userName}</small>
                        </div>
                        <ul className="list-unstyled m-0 p-2">
                            <li>
                                <button 
                                    className="btn btn-white w-100 text-start px-3 py-2 text-dark rounded-3 mb-1" 
                                    onClick={() => { onNavigate("perfil"); setShowProfileMenu(false); }}
                                >
                                    <i className="bi bi-person-gear me-3 text-info"></i> Mi Perfil
                                </button>
                            </li>
                            <li><hr className="dropdown-divider my-1 border-secondary border-opacity-10" /></li>
                            <li>
                                <button 
                                    className="btn btn-white w-100 text-start px-3 py-2 text-danger fw-bold rounded-3" 
                                    onClick={onLogout}
                                >
                                    <i className="bi bi-box-arrow-right me-3"></i> Cerrar Sesión
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