import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToasterContext = createContext(null);

export const useToaster = () => {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error('useToaster must be used within ToasterProvider');
  return ctx;
};

let idCounter = 0;

export const ToasterProvider = ({ children, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const value = { push, remove };

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <div className={`fixed z-50 ${position.includes('top') ? 'top-4' : 'bottom-4'} ${position.includes('right') ? 'right-4' : 'left-4'} space-y-2`}>
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg border text-sm animate-fade-in ${
            t.type === 'success' ? 'bg-green-700 border-green-500 text-white' :
            t.type === 'error' ? 'bg-red-700 border-red-500 text-white' :
            t.type === 'warning' ? 'bg-yellow-700 border-yellow-500 text-white' :
            'bg-[#1a1a1a] border border-white/20 text-white'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToasterContext.Provider>
  );
};


