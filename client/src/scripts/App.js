import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UserManagement from "../pages/UserManagement";
import ActivityLog from "../pages/ActivityLog";
import Inventory from "../pages/Inventory";
import DashboardHeader from "./DashboardHeader";
import ProtectedRoute from "../components/ProtectedRoute";
import SupplierManagement from "../pages/SupplierManagement";
import CustomerManagement from "../pages/CustomerManagement";
import SalesManagement from "../pages/SalesManagement";
import SalesReport from "../pages/SalesReport";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

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

        <Route //User Management route
          path="/user-management"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <UserManagement />
              </ProtectedRoute>
            </>
          }
        />

        <Route //User Management route
          path="/activity-log"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <ActivityLog />
              </ProtectedRoute>
            </>
          }
        />

        <Route //Inventory route
          path="/inventory"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <Inventory />
              </ProtectedRoute>
            </>
          }
        />

        <Route //Sales Management route
          path="/sales-management"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <SalesManagement />
              </ProtectedRoute>
            </>
          }
        />

        <Route //Sales Report route
          path="/sales-report"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <SalesReport />
              </ProtectedRoute>
            </>
          }
        />

        <Route //Supplier Management route
          path="/supplier-management"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <SupplierManagement />
              </ProtectedRoute>
            </>
          }
        />

        <Route //Customer Management route
          path="/customer-management"
          element={
            <>
              <ProtectedRoute>
                <DashboardHeader />
                <CustomerManagement />
              </ProtectedRoute>
            </>
          }
        />
      </Routes>
    </Router>
  );
}
export default App;
