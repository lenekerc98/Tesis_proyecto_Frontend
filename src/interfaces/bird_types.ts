export interface Prediccion {
    nombre: string;
    probabilidad: number;
    url_imagen?: string; // El ? es por si la imagen es opcional
    // Agrega aquí otras propiedades que necesites
}