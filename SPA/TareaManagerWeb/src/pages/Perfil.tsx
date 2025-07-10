import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";

// Funciones para actualizar perfil y cambiar contraseña (a implementar en authApi)
import { updateProfile, changePassword } from "../api/authApi";

const Perfil = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({ nombre: "", apellido: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Cambiar contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarNuevaPassword, setConfirmarNuevaPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getCurrentUser();
        setProfile({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          email: data.email || ""
        });
      } catch (err) {
        console.log('Error al cargar perfil:', err);
        setError("No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setMessage("");
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await updateProfile(profile);
      setMessage("Perfil actualizado correctamente");
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage("");
    setPwError("");
    if (nuevaPassword !== confirmarNuevaPassword) {
      setPwError("Las contraseñas no coinciden");
      return;
    }
    try {
      await changePassword({ passwordActual, nuevaPassword, confirmarNuevaPassword });
      setPwMessage("Contraseña cambiada correctamente");
      setPasswordActual("");
      setNuevaPassword("");
      setConfirmarNuevaPassword("");
    } catch (err: any) {
      setPwError(err.message || "Error al cambiar contraseña");
    }
  };

  if (loading) return <div className="p-8">Cargando perfil...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {message && <div className="text-green-600 mb-2">{message}</div>}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={profile.nombre}
            onChange={e => setProfile({ ...profile, nombre: e.target.value })}
            disabled={!editMode}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Apellido</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={profile.apellido}
            onChange={e => setProfile({ ...profile, apellido: e.target.value })}
            disabled={!editMode}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={profile.email}
            onChange={e => setProfile({ ...profile, email: e.target.value })}
            disabled={!editMode}
            required
          />
        </div>
        <div className="flex gap-2 mt-4">
          {!editMode ? (
            <button type="button" className="btn-primary" onClick={handleEdit}>Editar perfil</button>
          ) : (
            <>
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancelar</button>
            </>
          )}
        </div>
      </form>

      <hr className="my-6" />

      <h3 className="text-lg font-semibold mb-2">Cambiar contraseña</h3>
      {pwError && <div className="text-red-600 mb-2">{pwError}</div>}
      {pwMessage && <div className="text-green-600 mb-2">{pwMessage}</div>}
      <form onSubmit={handleChangePassword} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Contraseña actual</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={passwordActual}
            onChange={e => setPasswordActual(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nueva contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={nuevaPassword}
            onChange={e => setNuevaPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Confirmar nueva contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={confirmarNuevaPassword}
            onChange={e => setConfirmarNuevaPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">Cambiar contraseña</button>
      </form>

      <hr className="my-6" />
      <button onClick={handleLogout} className="w-full mt-2 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors">Cerrar sesión</button>
    </div>
  );
};

export default Perfil; 