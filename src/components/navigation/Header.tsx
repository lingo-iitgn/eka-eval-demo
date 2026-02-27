import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Home, Users } from 'lucide-react';

/*
  Palette:
  --cream:    #f5f0e8
  --ink:      #2c2416
  --sage:     #7a9e7e
  --sage-lt:  #d4e8d6
  --rose:     #c9867c
  --rose-lt:  #f5dbd8
  --ochre:    #c9a96e
  --ochre-lt: #f5e8cc
  --slate:    #6b7b8d
  --muted:    #9a9285
*/

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Evaluate', icon: Activity },
    { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { path: '/team', label: 'Team', icon: Users },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(245, 240, 232, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e0d8cc',
        fontFamily: '"DM Sans", "Outfit", sans-serif',
      }}
    >
      <div className="container mx-auto px-10 py-5">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ background: '#d4e5f2', border: '1.5px solid #a8c5de' }}
            >
              {/* tiny leaf mark */}
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M9 15 C9 15 3 11 3 6 C3 3.8 5.8 2 9 2 C12.2 2 15 3.8 15 6 C15 11 9 15 9 15Z" fill="#6b9ab8" opacity="0.7"/>
                <path d="M9 15 L9 8" stroke="#4a7a9e" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div
                className="leading-none text-xl font-semibold tracking-tight"
                style={{ color: '#2c2416', fontFamily: '"Fraunces", Georgia, serif', fontVariationSettings: '"SOFT" 0, "WONK" 1' }}
              >
                Eka-Eval
              </div>
              <div
                className="text-[10px] uppercase tracking-[0.18em] leading-none mt-0.5"
                style={{ color: '#9a9285' }}
              >
                Evaluation Framework
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[15px] transition-all duration-200"
                    style={{
                      fontWeight: 500,
                      background: isActive ? '#d4e5f2' : 'transparent',
                      color: isActive ? '#2d5a78' : '#6b6258',
                      border: `1px solid ${isActive ? '#a8c5de' : 'transparent'}`,
                    }}
                    whileHover={{
                      background: '#ede8e0',
                      color: '#2c2416',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.6} />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;