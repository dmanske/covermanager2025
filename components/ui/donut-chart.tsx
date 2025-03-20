"use client"

import React from "react"

interface DonutChartProps {
  percentage: number
  size?: number
  strokeWidth?: number
  primaryColor?: string
  secondaryColor?: string
  showText?: boolean
  className?: string
}

export function DonutChart({
  percentage,
  size = 80,
  strokeWidth = 8,
  primaryColor = "#3B82F6",
  secondaryColor = "#EFF6FF",
  showText = true,
  className = "",
}: DonutChartProps) {
  // Calcular raio e circunferência
  const radius = (size / 2) - (strokeWidth / 2)
  const circumference = 2 * Math.PI * radius
  const dash = (percentage / 100) * circumference
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Círculo de fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Arco preenchido */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
} 