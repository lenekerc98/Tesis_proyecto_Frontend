import client from '../api/axiosClient'; // <--- Importamos TU configuración, no el axios genérico
import type { LoginCredentials } from '../interfaces/auth.model';

export const authController = {
  login: async (credentials: LoginCredentials) => {
    // AQUI LA MAGIA:
    // Ya no pones "http://...", solo la ruta del endpoint.
    // El 'client' le agrega automáticamente el '/api' o la URL del servidor.
    const response = await client.post('/v1/usuarios/login', credentials);
    return response.data;
  }
};