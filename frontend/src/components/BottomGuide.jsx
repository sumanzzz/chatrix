import React, { useState } from 'react';

const BottomGuide = ({ message = 'No rooms? Create one — quick and anonymous.', onAction, actionLabel = 'Create Room' }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40">
      <div className="px-4 py-3 rounded-xl shadow-2xl border border-white/15 bg-[#121212] text-white flex items-center gap-3 animate-fade-in">
        <span className="text-sm opacity-90">{message}</span>
        {onAction && (
          <button className="chatrix-button px-3 py-1" onClick={onAction}>{actionLabel}</button>
        )}
        <button className="chatrix-button-secondary px-2 py-1 text-xs" onClick={() => setDismissed(true)}>Dismiss</button>
      </div>
    </div>
  );
};

export default BottomGuide;


