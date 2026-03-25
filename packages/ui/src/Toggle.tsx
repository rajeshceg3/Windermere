import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  highContrast?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, highContrast }) => {
  return (
    <label className="flex items-center cursor-pointer space-x-3 select-none">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-10 h-6 transition-colors ${highContrast ? (checked ? 'bg-black border-2 border-white' : 'bg-white border-2 border-black rounded-none') : (checked ? 'bg-blue-500 rounded-full' : 'bg-gray-400 rounded-full')}`}></div>
        <div className={`dot absolute left-1 top-1 w-4 h-4 transition-transform ${highContrast ? (checked ? 'bg-white' : 'bg-black') : 'bg-white rounded-full'} ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
      <div className={`font-medium text-sm ${highContrast ? 'text-black bg-white px-1 border border-black' : 'text-white drop-shadow-md'}`}>
        {label}
      </div>
    </label>
  );
};
