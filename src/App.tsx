import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Login } from "../src/pages/login"; // Tu página de Login
import { Analizador } from './pages/all/Analizador_usuario';
import { DashboardAdmin } from "../src/pages/admin/dashboard_admin"; // Asegúrate que el nombre del archivo coincida (mayúsculas/minúsculas)
import axiosClient from "../src/api/axiosClient";
import type { JSX } from "react";

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

const APP_VERSION = "1.0.2"; // Cambia esto para forzar limpieza total en todos los usuarios

function App() {
    /**
     * EFECTO PARA ROMPER CACHE Y VERIFICAR SESIÓN
     */
    useEffect(() => {
        // 1. ROMPER CACHE DE LOCALSTORAGE (VERSIONAMIENTO)
        const savedVersion = localStorage.getItem("app_version");
        if (savedVersion !== APP_VERSION) {
            console.log("Nueva versión detectada. Limpiando cache local...");
            localStorage.clear();
            localStorage.setItem("app_version", APP_VERSION);
            // Si estaba logueado, lo mandamos al login para asegurar sincronía con el back
            if (window.location.pathname !== "/login") {
                window.location.href = "/login?cache=cleared";
            }
        }

        // 2. VERIFICAR SI LA SESIÓN ES REAL EN EL BACKEND
        const checkSession = async () => {
            const token = localStorage.getItem("token");
            if (token && window.location.pathname !== "/login") {
                try {
                    // Si el back se reinició y perdió la sesión (o el token es inválido)
                    // esto disparará el interceptor 401 que ya configuramos.
                    await axiosClient.get("/usuarios/me");
                } catch (e) {
                    // Interceptor hará el trabajo por nosotros
                }
            }
        };
        checkSession();

        // 3. TIMER DE INACTIVIDAD (10 MINUTOS)
        let timer: ReturnType<typeof setTimeout>;

        const logout = async () => {
            console.log("Sesión cerrada por inactividad.");
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    await axiosClient.post("/usuarios/logout");
                }
            } catch (error) { }
            localStorage.clear();
            window.location.href = "/login?reason=inactivity";
        };

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(logout, 600000);
        };

        const events = ["mousedown", "keypress", "scroll", "mousemove", "touchstart"];
        resetTimer();
        events.forEach(event => document.addEventListener(event, resetTimer));

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, []);

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