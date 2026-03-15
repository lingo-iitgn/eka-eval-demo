// src/components/team/TeamMemberCard.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Link as LinkIcon } from 'lucide-react';

interface TeamMemberCardProps {
  imageUrl: string;
  name: string;
  role: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  imageUrl, name, role, githubUrl, linkedinUrl, websiteUrl 
}) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-purple-500/50"
      whileHover={{ y: -5 }}
    >
      <img
        src={imageUrl}
        alt={`Photo of ${name}`}
        className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-300 dark:border-gray-600 object-cover"
      />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{name}</h3>
      <p className="text-purple-600 dark:text-purple-400 font-medium">{role}</p>
      
      <div className="flex justify-center items-center gap-4 mt-4">
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-purple-500">
            <Github size={20} />
          </a>
        )}
        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-purple-500">
            <LinkIcon size={20} />
          </a>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-purple-500">
            <Linkedin size={20} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default TeamMemberCard;