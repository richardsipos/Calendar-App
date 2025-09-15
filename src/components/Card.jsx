import React from 'react';

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl border border-[#E0DED9] bg-white shadow ${className}`}>{children}</div>;
}

export function CardContent({ className = '', children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
