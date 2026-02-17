import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:transform active:scale-95",
    secondary: "bg-yellow-500 hover:bg-yellow-600 text-indigo-900 shadow-md",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const disabledStyle = (disabled || isLoading) ? "opacity-50 cursor-not-allowed transform-none" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${disabledStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
      ) : null}
      {children}
    </button>
  );
};