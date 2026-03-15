import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Settings, Home } from 'lucide-react';
import { Users } from "lucide-react";
import ThemeToggle from '../ui/ThemeToggle';

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Evaluate', icon: Activity },
    { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { path: '/team', label: 'Team', icon: Users },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
              Eka-Eval
            </h1>
          </Link>

          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group"
                >
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-teal-500 rounded-full"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;