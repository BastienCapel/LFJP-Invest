
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

const PasswordModal: React.FC<Props> = ({ isOpen, onClose, onUnlock }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === "admin") {
        onUnlock();
    } else {
        setPasswordError(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Déverrouillage</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg mb-4 border border-amber-200">
          Vous êtes sur le point de déverrouiller le mode édition. Toutes les modifications seront enregistrées.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe administrateur</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${passwordError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
              placeholder="••••••"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-xs mt-1 font-medium">Mot de passe incorrect</p>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200"
            >
              Déverrouiller
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
