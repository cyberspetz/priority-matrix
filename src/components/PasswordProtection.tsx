import { createContext, useContext, useState, useEffect } from 'react';

interface PasswordProtectionContextValue {
  logout: () => void;
}

const PasswordProtectionContext = createContext<PasswordProtectionContextValue | undefined>(undefined);

export const usePasswordProtection = () => {
  const ctx = useContext(PasswordProtectionContext);
  if (!ctx) {
    throw new Error('usePasswordProtection must be used within PasswordProtection');
  }
  return ctx;
};

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Skip password protection in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Check if already authenticated on mount
  useEffect(() => {
    if (isDevelopment) {
      setIsAuthenticated(true);
      return;
    }

    const auth = localStorage.getItem('taskapp_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, [isDevelopment]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Set your password here
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || 'demo-password';

    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('taskapp_authenticated', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('taskapp_authenticated');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Priority Matrix</h1>
            <p className="text-gray-600">Enter password to access your tasks</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Access Tasks
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <PasswordProtectionContext.Provider value={{ logout: handleLogout }}>
      {children}
    </PasswordProtectionContext.Provider>
  );
}
