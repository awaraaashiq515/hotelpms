import React from 'react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const SearchInput: React.FC<SearchInputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type="text"
        className={`w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 ${icon ? 'pl-10' : ''} text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/10 focus:border-pos-primary transition-all placeholder:text-gray-400 font-medium`}
        {...props}
      />
    </div>
  );
};
