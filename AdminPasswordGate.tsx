import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

const AdminPasswordGate: React.FC<AdminPasswordGateProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);

  const ADMIN_PASSWORD = 'B1MERTICS';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Access Required</h2>
          <p className="text-blue-100 mt-2">Please enter the administrative password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full px-4 py-3 rounded-xl border ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                autoFocus
              />
              {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-600 font-medium">Incorrect password. Please try again.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 group"
          >
            <span>Unlock Admin Panel</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Secure Administrative Zone</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordGate;
