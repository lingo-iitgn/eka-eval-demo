import React from 'react';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 transition-colors duration-300">
      <div className="container mx-auto px-6 py-8">
        <LeaderboardTable />
      </div>
    </div>
  );
};

export default LeaderboardPage;