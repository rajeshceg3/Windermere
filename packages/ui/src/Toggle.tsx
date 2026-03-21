import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center cursor-pointer space-x-3 select-none">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors hc-toggle-track ${checked ? 'bg-blue-500 hc-toggle-track-checked' : 'bg-gray-400 hc-toggle-track-unchecked'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
      <div className="text-white font-medium text-sm drop-shadow-md hc-text">
        {label}
      </div>
    </label>
  );
};
