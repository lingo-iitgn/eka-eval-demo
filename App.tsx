import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/navigation/Header';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import TeamPage from './pages/TeamPage'; 

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/team" element={<TeamPage />} /> {/* <-- ADD THE NEW ROUTE */}
            <Route path="/settings" element={<div className="pt-20 p-8 text-center"><h1 className="text-3xl text-gray-900 dark:text-white">Settings - Coming Soon</h1></div>} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;