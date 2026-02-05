import axios from "axios";

const axiosClient = axios.create({
  // CORRECCIÓN: Quitamos las comillas y el texto extra.
  // Ahora sí leerá la variable o usará el localhost:8000 si falla.
  baseURL: import.meta.env.VITE_API_URL || "https://tesis-proyecto-backend.onrender.com/",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;