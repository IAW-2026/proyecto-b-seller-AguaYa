import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary'
  fullWidth?: boolean
}

const variantClasses: Record<string, string> = {
  primary: 'bg-slate-900 text-white hover:opacity-90 dark:bg-slate-700',
  danger: 'bg-red-500 text-white hover:opacity-90',
  secondary: 'bg-gray-200 text-gray-900 hover:opacity-90 dark:bg-slate-700 dark:text-slate-200',
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-3 text-sm font-medium transition-opacity duration-200 cursor-pointer ${fullWidth ? 'w-full' : 'w-auto'} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
