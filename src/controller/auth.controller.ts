import axios from 'axios';
import type { LoginCredentials } from '../models/auth.model';

export const authController = {
  login: async (credentials: LoginCredentials) => {
    // Aquí es donde sucede la magia con tu API
    const response = await axios.post('http://127.0.0.1:8001/v1/usuarios/login', credentials);
    return response.data;
  }
};