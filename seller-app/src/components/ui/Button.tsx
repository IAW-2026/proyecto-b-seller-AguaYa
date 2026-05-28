import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  ...props
}: ButtonProps) {
  const { style: externalStyle, ...rest } = props

  const baseStyles: React.CSSProperties = {
    padding: '12px 16px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    width: fullWidth ? '100%' : 'auto',
    transition: 'opacity 0.2s'
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#0f172a', color: 'white' },
    danger: { backgroundColor: '#ef4444', color: 'white' },
    secondary: { backgroundColor: '#e5e7eb', color: '#111827' }
  }

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant], ...externalStyle }}
      {...rest}
    >
      {children}
    </button>
  )
}
