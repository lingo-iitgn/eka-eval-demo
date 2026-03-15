import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { benchmarkCategories } from '../../data/mockData';

const TreeOfKnowledge: React.FC = () => {
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  const trunkVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { duration: 2, ease: "easeInOut" }
    }
  };

  const branchVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { 
        delay: 0.5 + i * 0.2,
        duration: 1.5,
        ease: "easeOut"
      }
    })
  };

  const leafVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      <svg
        width="700"
        height="500"
        viewBox="0 0 700 500"
        className="absolute inset-0"
      >
        {/* Enhanced circuit-pattern trunk */}
        <motion.path
          d="M350 450 L350 250 M330 270 L370 270 M335 290 L365 290 M340 310 L360 310"
          stroke="url(#trunkGradient)"
          strokeWidth="10"
          fill="none"
          variants={trunkVariants}
          initial="initial"
          animate="animate"
        />
        
        {/* Enhanced main branches for 8 categories */}
        {benchmarkCategories.map((category, index) => {
          const angle = (index * 45) - 90; // 360/8 = 45 degrees apart
          const radians = (angle * Math.PI) / 180;
          const startX = 350;
          const startY = 250;
          const branchLength = 140 + (index % 2) * 20; // Vary branch lengths
          const endX = startX + Math.cos(radians) * branchLength;
          const endY = startY + Math.sin(radians) * branchLength;
          
          return (
            <g key={category.id}>
              {/* Main branch with enhanced styling */}
              <motion.path
                d={`M${startX} ${startY} L${endX} ${endY}`}
                stroke={category.color}
                strokeWidth="5"
                fill="none"
                variants={branchVariants}
                initial="initial"
                animate="animate"
                custom={index}
                style={{
                  filter: hoveredBranch === category.id ? `drop-shadow(0 0 15px ${category.color})` : 'none',
                  opacity: hoveredBranch && hoveredBranch !== category.id ? 0.4 : 1
                }}
              />
              
              {/* Enhanced branch nodes and labels */}
              <motion.g
                className="cursor-pointer"
                onHoverStart={() => setHoveredBranch(category.id)}
                onHoverEnd={() => setHoveredBranch(null)}
              >
                <motion.circle
                  cx={endX}
                  cy={endY}
                  r="10"
                  fill={category.color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + index * 0.2 }}
                  whileHover={{ scale: 1.3 }}
                  style={{
                    filter: hoveredBranch === category.id ? `drop-shadow(0 0 20px ${category.color})` : 'none'
                  }}
                />
                
                {/* Category name with better positioning */}
                <motion.text
                  x={endX}
                  y={endY - 18}
                  textAnchor="middle"
                  className="fill-gray-900 dark:fill-white text-xs font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + index * 0.2 }}
                  style={{
                    filter: hoveredBranch === category.id ? `drop-shadow(0 0 10px ${category.color})` : 'none'
                  }}
                >
                  {category.name}
                </motion.text>
              </motion.g>
              
              {/* Enhanced sub-branches (benchmarks) */}
              <AnimatePresence>
                {hoveredBranch === category.id && (
                  <g>
                    {category.benchmarks.map((benchmark, bIndex) => {
                      const subAngle = angle + (bIndex - (category.benchmarks.length - 1) / 2) * 15;
                      const subRadians = (subAngle * Math.PI) / 180;
                      const subEndX = endX + Math.cos(subRadians) * 80;
                      const subEndY = endY + Math.sin(subRadians) * 80;
                      
                      return (
                        <g key={benchmark.id}>
                          {/* Sub-branch line */}
                          <motion.path
                            d={`M${endX} ${endY} L${subEndX} ${subEndY}`}
                            stroke={category.color}
                            strokeWidth="3"
                            fill="none"
                            opacity="0.7"
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{
                              filter: `drop-shadow(0 0 5px ${category.color})`
                            }}
                          />
                          
                          {/* Benchmark node */}
                          <motion.circle
                            cx={subEndX}
                            cy={subEndY}
                            r="6"
                            fill={category.color}
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{
                              filter: `drop-shadow(0 0 8px ${category.color})`
                            }}
                          />
                          
                          {/* Benchmark label */}
                          <motion.text
                            x={subEndX}
                            y={subEndY - 12}
                            textAnchor="middle"
                            className="fill-gray-700 dark:fill-gray-300 text-xs font-medium"
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{
                              filter: `drop-shadow(0 0 5px ${category.color})`
                            }}
                          >
                            {benchmark.name}
                          </motion.text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </AnimatePresence>
            </g>
          );
        })}
        
        {/* Enhanced gradients */}
        <defs>
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9D4EDD', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#00C9A7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9D4EDD', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Enhanced floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-400 dark:bg-cyan-400 rounded-full"
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%'
          }}
          animate={{
            y: [-15, 15],
            x: [-10, 10],
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
};

export default TreeOfKnowledge;