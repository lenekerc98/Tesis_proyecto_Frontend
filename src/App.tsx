import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analizador } from './pages/all/Analizador_usuario'; 
import { DashboardAdmin } from "./pages/admin/dashboard_admin"; 
import { Login } from "./pages/login"; // <--- Importamos el componente que creamos en el Paso 1
import type { JSX } from "react";

// --- 1. GUARDIÁN DE RUTAS PRIVADAS ---
// Si NO hay token, te manda al Login.
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// --- 2. GUARDIÁN DE RUTAS PÚBLICAS ---
// Si YA tienes token, no te deja ver el Login, te manda a la Home.
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem("token");
    if (token) {
        return <Navigate to="/" replace />;
    }
    return children;
};

// --- 3. DISPATCHER (CONTROLADOR DE TRÁFICO) ---
// Decide si vas al Admin o al Usuario según tu rol
const RoleDispatcher = () => {
    const roleId = localStorage.getItem("role_id");
    
    // Si role_id es "0" (string) mostramos el Dashboard Admin
    if (roleId === "0") {
        return <DashboardAdmin />;
    } 
    
    // Si no, mostramos el Analizador (Usuario normal)
    return <Analizador />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* RUTA LOGIN (Pública) */}
        <Route 
            path="/login" 
            element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } 
        />

        {/* RUTA PRINCIPAL (Privada) */}
        {/* Aquí atrapamos la raíz "/" y cualquier sub-ruta */}
        <Route 
            path="/*" 
            element={
                <ProtectedRoute>
                    <RoleDispatcher />
                </ProtectedRoute>
            } 
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;