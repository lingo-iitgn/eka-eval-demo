// src/pages/TeamPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import TeamMemberCard from '../components/team/TeamMemberCard';

// --- IMPORT IMAGES DIRECTLY ---
// This ensures Vite finds them and handles the paths correctly
import mayankPic from '../assets/team/mayank.png';
import samridhiPic from '../assets/team/samridhi.png';
import rajveePic from '../assets/team/rajvee.png';
import himanshuPic from '../assets/team/himanshu.png';
import abhishekPic from '../assets/team/abhishekh.png'; 

const faculty = [
  {
    imageUrl: mayankPic, // Use the imported variable
    name: 'Prof. Mayank Singh',
    role: 'Assistant Professor',
    githubUrl: 'https://github.com/mayank4490/',
    linkedinUrl: 'https://www.linkedin.com/in/mayank-singh-b591a818/',
    websiteUrl: 'https://mayank4490.github.io/'
  }
];

const founder = [
{
    imageUrl: abhishekPic,
    name: 'Abhishek Upperwal',
    role: 'Founder, Soket AI Labs | Lead, Project Eka',
    githubUrl: 'https://github.com/upperwal',
    linkedinUrl: 'https://www.linkedin.com/in/upperwal/'
  }
];

const students = [
   {
    imageUrl: samridhiPic, // Use the imported variable
    name: 'Samridhi Raj Sinha',
    role: 'SRIP Intern',
    githubUrl: 'https://github.com/sam22ridhi',
    linkedinUrl: 'https://www.linkedin.com/in/samridhi-raj-sinha-a96520217/',
    websiteUrl: 'https://sam22ridhi.github.io/'
  },
  {
    imageUrl: rajveePic, 
    name: 'Rajvee Sheth',
    role: 'Senior Research Fellow', 
    githubUrl: 'https://github.com/rajveesheth',
    linkedinUrl: 'https://www.linkedin.com/in/rajvee-sheth/',
    websiteUrl: 'https://rajveesheth.github.io/'
  },
  {
    imageUrl: himanshuPic,
    name: 'Himanshu Beniwal',
    role: 'Ph.D. Student', 
    githubUrl: 'https://github.com/himanshubeniwal/',
    linkedinUrl: 'https://www.linkedin.com/in/himanshubeniwal/',
    websiteUrl: 'https://himanshubeniwal.github.io/'
  }
];

const TeamPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen pt-24 transition-colors duration-300">
      <div className="container mx-auto px-6 py-12">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-700 dark:text-white">Meet the Team</h1>
          <p className="text-l text-gray-600 dark:text-gray-400 mt-4">
            The researchers and developers behind Eka-Eval. </p>
            <p className="text-l text-gray-300 dark:text-gray-400 mt-4">
            In collaboration with Lingo Labs @IITGN and Soket AI.</p>
<p className="text-l text-gray-200 dark:text-gray-400 mt-4">
  For <a 
    href="https://eka.soket.ai/" 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-blue-400 underline hover:text-blue-300"
  >
    Project Eka
  </a>
</p>

        </motion.div>
        
        {/* --- Faculty Section --- */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-10 border-b-2 border-purple-500/30 pb-4">
            Faculty
          </h2>
          <div className="max-w-xl mx-auto">
            {faculty.map((member, index) => (
              <TeamMemberCard key={index} {...member} />
            ))}
          </div>
        </section>

            <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-10 border-b-2 border-purple-500/30 pb-4">
            Soket AI
          </h2>
          <div className="max-w-xl mx-auto">
            {founder.map((member, index) => (
              <TeamMemberCard key={index} {...member} />
            ))}
          </div>
        </section>

        {/* --- Students/Interns Section --- */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-10 border-b-2 border-purple-500/30 pb-4">
            Students & Interns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {students.map((member, index) => (
              <TeamMemberCard key={index} {...member} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default TeamPage;