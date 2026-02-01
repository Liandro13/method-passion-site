import { useState, useEffect, useCallback } from 'react';
import { ACCOMMODATIONS } from '../constants';

interface TeamUser {
  id: number;
  username: string;
  name: string;
  allowed_accommodations: string;
  created_at: string;
}

export default function TeamsPanel() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  
  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formAccommodations, setFormAccommodations] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/team-users', { credentials: 'include' });
      const result = await response.json();
      if (result.users) setUsers(result.users);
    } catch (error) {
      console.error('Error loading team users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setFormName('');
    setFormAccommodations([]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user: TeamUser) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormPassword('');
    setFormName(user.name);
    setFormAccommodations(JSON.parse(user.allowed_accommodations || '[]'));
    setError('');
    setShowModal(true);
  };

  const toggleAccommodation = (id: number) => {
    if (formAccommodations.includes(id)) {
      setFormAccommodations(formAccommodations.filter(a => a !== id));
    } else {
      setFormAccommodations([...formAccommodations, id]);
    }
  };

  const handleSave = async () => {
    if (!formUsername || !formName) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!editingUser && !formPassword) {
      setError('Password é obrigatória para novos utilizadores');
      return;
    }

    if (formAccommodations.length === 0) {
      setError('Selecione pelo menos um alojamento');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editingUser 
        ? `/api/team-users/${editingUser.id}`
        : '/api/team-users';
      
      const body: Record<string, unknown> = {
        name: formName,
        allowed_accommodations: formAccommodations
      };

      if (!editingUser) {
        body.username = formUsername;
        body.password = formPassword;
      } else if (formPassword) {
        body.password = formPassword;
      }

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao guardar');
        return;
      }

      await loadUsers();
      setShowModal(false);
    } catch (err) {
      setError('Erro ao guardar utilizador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: TeamUser) => {
    if (!confirm(`Tem certeza que deseja eliminar "${user.name}"?`)) return;

    try {
      await fetch(`/api/team-users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getAccommodationNames = (user: TeamUser) => {
    const ids = JSON.parse(user.allowed_accommodations || '[]') as number[];
    return ids.map(id => {
      const acc = ACCOMMODATIONS.find(a => a.id === id);
      return acc ? acc.name : `ID: ${id}`;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-dark">Gestão de Equipas</h2>
          <p className="text-sm text-gray-500">Gerir utilizadores do portal de equipas (limpeza, receção)</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span>Novo Utilizador</span>
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-dark mb-2">Sem utilizadores de equipa</h3>
          <p className="text-gray-500 mb-4">Crie utilizadores para a equipa de limpeza ou receção.</p>
          <button onClick={openCreateModal} className="btn-primary">
            Criar Primeiro Utilizador
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Alojamentos</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-dark">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-dark">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getAccommodationNames(user)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-dark">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Alojamentos:</span> {getAccommodationNames(user)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-dark">
                {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark mb-1">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="Nome da pessoa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1">Username *</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="input-field"
                  placeholder="username"
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">Username não pode ser alterado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Password {editingUser ? '(deixe vazio para manter)' : '*'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">Alojamentos Permitidos *</label>
                <div className="space-y-2">
                  {ACCOMMODATIONS.map((acc) => (
                    <label key={acc.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formAccommodations.includes(acc.id)}
                        onChange={() => toggleAccommodation(acc.id)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm text-dark">{acc.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
