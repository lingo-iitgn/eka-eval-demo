import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { benchmarkCategories } from '../../data/mockData';

// Japandi-research palette — muted, warm, sophisticated
const BRANCH_COLORS = [
  '#7a9e7e', // sage
  '#c9867c', // dusty rose
  '#c9a96e', // warm ochre
  '#6b7b8d', // slate blue
  '#a07ab8', // muted violet
  '#7ab8b0', // teal sage
  '#c97c9e', // mauve pink
  '#8d956b', // olive
];

const TreeOfKnowledge: React.FC = () => {
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  const trunkVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2, ease: 'easeInOut' },
    },
  };

  const branchVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { delay: 0.5 + i * 0.2, duration: 1.5, ease: 'easeOut' },
    }),
  };

  const leafVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      <svg width="700" height="500" viewBox="0 0 700 500" className="absolute inset-0">

        {/* Trunk */}
        <motion.path
          d="M350 450 L350 250 M330 270 L370 270 M335 290 L365 290 M340 310 L360 310"
          stroke="url(#trunkGradient)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          variants={trunkVariants}
          initial="initial"
          animate="animate"
        />

        {benchmarkCategories.map((category, index) => {
          const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
          const angle = index * 45 - 90;
          const radians = (angle * Math.PI) / 180;
          const startX = 350;
          const startY = 250;
          const branchLength = 140 + (index % 2) * 20;
          const endX = startX + Math.cos(radians) * branchLength;
          const endY = startY + Math.sin(radians) * branchLength;

          return (
            <g key={category.id}>
              <motion.path
                d={`M${startX} ${startY} L${endX} ${endY}`}
                stroke={color}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                variants={branchVariants}
                initial="initial"
                animate="animate"
                custom={index}
                style={{
                  filter: hoveredBranch === category.id ? `drop-shadow(0 0 12px ${color}aa)` : 'none',
                  opacity: hoveredBranch && hoveredBranch !== category.id ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                }}
              />

              <motion.g
                className="cursor-pointer"
                onHoverStart={() => setHoveredBranch(category.id)}
                onHoverEnd={() => setHoveredBranch(null)}
              >
                {/* Soft circle with inner dot */}
                <motion.circle
                  cx={endX}
                  cy={endY}
                  r="13"
                  fill={`${color}22`}
                  stroke={color}
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + index * 0.2 }}
                  whileHover={{ scale: 1.25 }}
                  style={{
                    filter: hoveredBranch === category.id ? `drop-shadow(0 0 16px ${color}88)` : 'none',
                  }}
                />
                <motion.circle
                  cx={endX}
                  cy={endY}
                  r="5"
                  fill={color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.2 }}
                />

                {/* Label */}
                <motion.text
                  x={endX}
                  y={endY - 22}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily='"DM Sans", sans-serif'
                  letterSpacing="0.03em"
                  className="fill-[#2c2416]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + index * 0.2 }}
                  style={{
                    filter: hoveredBranch === category.id ? `drop-shadow(0 0 8px ${color}99)` : 'none',
                  }}
                >
                  {category.name}
                </motion.text>
              </motion.g>

              {/* Sub-branches on hover */}
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
                          <motion.path
                            d={`M${endX} ${endY} L${subEndX} ${subEndY}`}
                            stroke={color}
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="4 3"
                            opacity="0.65"
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          />

                          {/* Pill label */}
                          <motion.rect
                            x={subEndX - 26}
                            y={subEndY - 11}
                            width={52}
                            height={22}
                            rx={11}
                            fill={`${color}18`}
                            stroke={color}
                            strokeWidth="1"
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          />
                          <motion.circle
                            cx={subEndX}
                            cy={subEndY}
                            r="3.5"
                            fill={color}
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          />
                          <motion.text
                            x={subEndX}
                            y={subEndY - 16}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontWeight="600"
                            fontFamily='"DM Sans", sans-serif'
                            fill={color}
                            variants={leafVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
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

        <defs>
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#7a9e7e" stopOpacity="1" />
            <stop offset="100%" stopColor="#8d956b" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Subtle ambient orbs */}
      {[...Array(20)].map((_, i) => {
        const colors = ['#7a9e7e', '#c9867c', '#c9a96e', '#6b7b8d', '#a07ab8'];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + (i % 2) * 3,
              height: 3 + (i % 2) * 3,
              left: `${12 + Math.random() * 76}%`,
              top: `${8 + Math.random() * 84}%`,
              background: colors[i % colors.length],
              opacity: 0.18,
            }}
            animate={{ y: [-10, 10], opacity: [0.1, 0.3, 0.1] }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
};

export default TreeOfKnowledge;