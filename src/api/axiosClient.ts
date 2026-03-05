import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://tesis-proyecto-backend.onrender.com/v1",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Romper cache agregando un timestamp a cada petición GET
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Si la URL termina en /login o contiene login, dejamos que el componente maneje el error
      if (error.config.url && error.config.url.includes("/login")) {
        return Promise.reject(error);
      }

      console.warn("Sesión inválida o expirada. Limpiando datos...");
      localStorage.clear(); // Borramos TODO para romper cache de datos locales
      window.location.href = "/login?error=session_expired";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;