import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  highContrast?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, highContrast }) => {
  return (
    <button
      className={`font-bold py-2 px-4 ${highContrast ? 'bg-black text-white border-4 border-white rounded-none hover:bg-white hover:text-black hover:border-black' : 'bg-blue-500 hover:bg-blue-700 text-white rounded'}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
