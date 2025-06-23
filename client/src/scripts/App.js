import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import DashboardHeader from './DashboardHeader';
import ProtectedRoute from '../components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route //Login Route
          path="/login"
          element={
            <>
              <Header />
              <Login />
              <Footer />
            </>
          }
        />

        <Route //Dashboard route
          path="/dashboard"
          element={
            <>
              <ProtectedRoute>                
                <DashboardHeader />
                <Dashboard />
              </ProtectedRoute>
            </>
          }
        />
      </Routes>
    </Router>
  );
}
export default App;
