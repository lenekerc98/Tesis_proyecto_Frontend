import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ModalEditarUsuario } from "../../components/ModalEditarUsuario";

interface Usuario {
  id_usuario: number;
  "Nombre completo": string;
  email: string;
  rol: string;
  usuario_activo: boolean;
}

export const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const cargarUsuarios = async () => {
    try {
      const res = await axiosClient.get("/admin/logs/listar_usuarios");
      setUsuarios(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  // 1. ABRIR MODAL
  const handleEditClick = (usuario: Usuario) => {
    setEditingUser(usuario); // Guardamos el usuario
    setShowModal(true);      // Mostramos el modal
  };

  // 2. CERRAR MODAL (Esta es la función que estaba fallando)
  const handleCloseModal = () => {
    setShowModal(false);     // Ocultamos
    setEditingUser(null);    // Limpiamos el usuario seleccionado
  };

  const handleSaveData = async (id: number, data: any) => {
    try {
      await axiosClient.put(`/admin/logs/usuarios/${id}/editar`, data);
      alert("Actualización exitosa");
      handleCloseModal(); // Cerramos al guardar
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar");
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn mx-auto" style={{ width: "fit-content" }}>
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">Gestión de Usuarios</h5>
        <button className="btn btn-sm btn-outline-primary" onClick={cargarUsuarios}><i className="bi bi-arrow-clockwise"></i></button>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="py-2" style={{ width: '50px' }}>ID</th>
              <th className="py-2" style={{ minWidth: '300px' }}>Usuario</th>
              <th className="py-2 text-center" style={{ width: '100px' }}>Rol</th>
              <th className="py-2 text-center" style={{ width: '100px' }}>Estado</th>
              <th className="text-end pe-4 py-2" style={{ width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario}>
                <td className="py-1 fw-bold text-muted fw-bold" style={{ fontSize: '0.9rem' }}>#{u.id_usuario}</td>
                <td className="py-1">
                  <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{u["Nombre completo"]}</div>
                  <small className="text-muted" style={{ fontSize: '0.8rem' }}>{u.email}</small>
                </td>
                <td className="py-1 text-center">
                  <span className={`badge ${u.rol === "admin" ? "bg-danger" : "bg-primary"} bg-opacity-75`} style={{ minWidth: '70px', fontSize: '0.75rem' }}>{u.rol}</span>
                </td>
                <td className="py-1 text-center">
                  {u.usuario_activo ?
                    <span className="badge bg-success bg-opacity-75" style={{ minWidth: '60px', fontSize: '0.75rem' }}>Activo</span> :
                    <span className="badge bg-secondary" style={{ minWidth: '60px', fontSize: '0.75rem' }}>Inactivo</span>
                  }
                </td>
                <td className="text-end pe-4 py-1">
                  <button className="btn btn-sm btn-outline-primary rounded-pill px-3 py-0 border-0 fw-bold" style={{ fontSize: '0.75rem', backgroundColor: '#f0f2f5' }} onClick={() => handleEditClick(u)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. AQUÍ ESTÁ EL TRUCO: Usamos 'key' para forzar reinicio si cambia el usuario */}
      {showModal && editingUser && (
        <ModalEditarUsuario
          isOpen={showModal}
          onClose={handleCloseModal} // Pasamos la función de cerrar
          user={editingUser}
          onSave={handleSaveData}
          key={editingUser.id_usuario} // <--- ESTO EVITA QUE SE BLOQUEE
        />
      )}
    </div>
  );
};