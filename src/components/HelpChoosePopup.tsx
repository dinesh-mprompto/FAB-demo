import { X, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

interface HelpChoosePopupProps {
  onClose: () => void;
  onThumbsUp: () => void;
}

export default function HelpChoosePopup({ onClose, onThumbsUp }: HelpChoosePopupProps) {
  const [optOut, setOptOut] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 pointer-events-none bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300">
      <div className="bg-[#3e4451] text-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in slide-in-from-bottom-8 duration-500 pointer-events-auto border border-gray-600">
        {/* Header Icons */}
        <div className="flex justify-between items-start mb-4">
          <div className="p-1 rounded-full border border-gray-400/50 text-gray-300">
            <Info size={16} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center mb-8">
          New to Submarine Pens? Let me help you choose
        </h3>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mb-8">
          <button 
            onClick={onThumbsUp}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 group-hover:bg-white group-hover:text-[#3e4451]">
              <ThumbsUp size={32} strokeWidth={1.5} />
            </div>
          </button>
          
          <button className="group flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 group-hover:bg-white group-hover:text-[#3e4451]">
              <ThumbsDown size={32} strokeWidth={1.5} />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={optOut}
              onChange={(e) => setOptOut(e.target.checked)}
              className="peer h-5 w-5 rounded border-gray-400 bg-transparent focus:ring-0 focus:ring-offset-0 checked:bg-white checked:border-white transition-all appearance-none border cursor-pointer" 
            />
            <svg className="absolute w-3.5 h-3.5 text-[#3e4451] pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="text-sm text-gray-300">Opt-out</span>
        </div>
      </div>
    </div>
  );
}
