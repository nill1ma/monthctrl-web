"use client"

import './styles.css'

type CardItemProps = {
  label: string;
  value: string | number;
  className?: string;
  areaTextClassName?: string;
  children?: React.ReactNode;
}

export default function CardItem({ label, value, className, children, areaTextClassName }: CardItemProps) {
  return (
    <div className={`card-item border-b ${className || ''}`}>
      <div
        className={areaTextClassName || ''}
        title={`${label}: ${value}`}
      >
        <label className="label">{label}:</label>
      </div>
      <div className='flex gap-1'>
        <span>{value}</span>
        {children}
      </div>
    </div>
  )
}
