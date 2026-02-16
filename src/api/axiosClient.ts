import axios from "axios";

const axiosClient = axios.create({
  // CORRECCIÓN: Quitamos las comillas y el texto extra.
  // Ahora sí leerá la variable o usará el localhost:8000 si falla.
  baseURL: import.meta.env.VITE_API_URL || "https://tesis-proyecto-backend.onrender.com/v1",
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

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role_id");
      localStorage.removeItem("user_data");
      localStorage.removeItem("userName");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;