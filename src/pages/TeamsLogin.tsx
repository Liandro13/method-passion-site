import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeamsLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Credenciais inválidas');
        setLoading(false);
        return;
      }

      navigate('/teams/dashboard');
    } catch {
      setError('Erro ao fazer login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-dark text-white py-4 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold">Method & Passion</h1>
          <p className="text-sm opacity-80">Portal de Equipas</p>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">👥</div>
              <h2 className="text-xl font-semibold text-dark">Acesso Equipas</h2>
              <p className="text-sm text-gray-500">Limpeza e Receção</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Este acesso é apenas para membros da equipa.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 text-center text-sm opacity-80">
        © 2026 Method & Passion
      </footer>
    </div>
  );
}
