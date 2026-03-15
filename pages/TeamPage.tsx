// src/pages/TeamPage.tsx

import React from 'react';
import { motion } from 'framer-motion';
import TeamMemberCard from '../components/team/TeamMemberCard'; // Import the new component

// --- Data for your team members ---
// You can move this to a separate data file later if you want

const faculty = [
  {
    imageUrl: '/mayank.png', // Replace with a direct link if possible
    name: 'Prof. Mayank Singh',
    role: 'Assistant Professor',
    githubUrl: 'https://github.com/mayank-singh',
    linkedinUrl: 'https://www.linkedin.com/in/mayank-singh-b591a818/',
    websiteUrl: 'https://www.iitgn.ac.in/faculty/cse/mayank-singh'
  }
];

const students = [
   {
    imageUrl: '/public/samridhi.png', // Replace with Samridhi's photo
    name: 'Samridhi Raj Sinha',
    role: 'SRIP Intern',
    githubUrl: 'https://github.com/Samridhiraj',
    linkedinUrl: 'https://www.linkedin.com/in/samridhi-raj-sinha-a96520217/',
    websiteUrl: 'https://samridhiraj.github.io/'
  },
  {
    imageUrl: '/public/rajvee.png', 
    name: 'Rajvee Sheth',
    role: 'Senior Research Fellow', 
    linkedinUrl: 'https://www.linkedin.com/in/rajvee-sheth/'
  },
  {
    imageUrl: '/public/himanshu.png',
    name: 'Himanshu Beniwal',
    role: 'Ph.D. Student', // Example role
    linkedinUrl: 'https://www.linkedin.com/in/himanshubeniwal/'
  }
];
// NOTE: Make sure to place the image files (like rajvee-sheth.jpg) in your 'public' directory

const TeamPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen pt-24 transition-colors duration-300">
      <div className="container mx-auto px-6 py-12">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Meet the Team</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">
            The researchers and developers behind Eka-Eval.
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