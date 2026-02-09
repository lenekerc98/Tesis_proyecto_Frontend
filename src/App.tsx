import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../src/pages/login"; // Tu página de Login
import { Analizador } from './pages/all/Analizador_usuario'; 
import { DashboardAdmin } from "../src/pages/admin/dashboard_admin"; // Asegúrate que el nombre del archivo coincida (mayúsculas/minúsculas)

// 1. COMPONENTE "ROOT" (El portero)
// Este decide a dónde vas cuando escribes solo "localhost:5173"
const RootRedirect = () => {
    const token = localStorage.getItem("token");
    const roleId = localStorage.getItem("role_id");

    // Si NO hay token, te manda al login sin preguntar
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si SÍ hay token, te manda a tu sitio según tu rol
    if (roleId === "0") {
        return <Navigate to="/admin" replace />;
    } else {
        return <Navigate to="/analizador" replace />;
    }
};

// 2. GUARDIÁN DE RUTAS PRIVADAS
// Protege /admin y /analizador para que nadie entre sin token
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- RUTA RAÍZ (localhost:5173) --- */}
        {/* Usamos el componente RootRedirect para decidir */}
        <Route path="/" element={<RootRedirect />} />

        {/* --- LOGIN --- */}
        <Route path="/login" element={<Login />} />

        {/* --- RUTAS DEL ADMINISTRADOR --- */}
        <Route 
            path="/admin" 
            element={
                <ProtectedRoute>
                    <DashboardAdmin />
                </ProtectedRoute>
            } 
        />

        {/* --- RUTAS DEL USUARIO --- */}
        <Route 
            path="/analizador" 
            element={
                <ProtectedRoute>
                    <Analizador />
                </ProtectedRoute>
            } 
        />

        {/* --- CUALQUIER OTRA COSA -> AL LOGIN --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;