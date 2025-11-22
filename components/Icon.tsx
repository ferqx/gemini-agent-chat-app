import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className = "" }) => {
  // @ts-ignore - Dynamic access to lucide icons
  const LucideIcon = LucideIcons[name] || LucideIcons.HelpCircle;
  return <LucideIcon size={size} className={className} />;
};