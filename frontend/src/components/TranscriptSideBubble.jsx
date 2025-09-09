import React from 'react';

const TranscriptSideBubble = ({ item }) => {
  return (
    <div className="rounded-lg p-3 mb-2 border border-white/15 bg-[#111]">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">{item.from}</div>
        <div className="text-xs opacity-70">{new Date(item.timestamp).toLocaleTimeString()}</div>
      </div>
      <div className="text-xs opacity-80 mb-1">
        {item.detectedLang ? `${item.detectedLang}` : 'Unknown'}
      </div>
      <div className="text-sm">{item.transcript}</div>
      {item.translated && (
        <div className="text-xs mt-2 opacity-90">
          <span className="opacity-70 mr-1">EN:</span>{item.translated}
        </div>
      )}
    </div>
  );
};

export default TranscriptSideBubble;


