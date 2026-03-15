import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 transition-all duration-300';
  const hoverClasses = hover ? 'hover:border-purple-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/70 hover:shadow-2xl' : '';
  const glowClasses = glow ? 'shadow-[0_0_20px_rgba(157,78,221,0.3)]' : '';

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;