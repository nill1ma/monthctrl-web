"use client"

import { Tooltip } from '@mui/material';
import './styles.css'
import {Fragment} from 'react'
type CardItemProps = {
  label: string;
  value: string | number;
  className?: string;
  areaTextClassName?: string;
  children?: React.ReactNode;
}


export default function CardItem({label, value, className, children, areaTextClassName}: CardItemProps) {
    return (
        <div className={`card-item border-b ${className || ''}`}>
            <Tooltip title={`${label}: ${value}`}>
                    <div className={areaTextClassName || ''}>
                        <label className="label">{label}:</label>
                    </div>
            </Tooltip>
            <div className='flex gap-1'>
                <span>{value}</span>
                {children}
            </div>
        </div>
    )
}