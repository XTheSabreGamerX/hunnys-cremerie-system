import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Layouts & Components
import DashboardLayout from "./DashboardLayout";
import Footer from "./Footer";
import ProtectedRoute from "../components/ProtectedRoute";

// Pages
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UserManagement from "../pages/UserManagement";
import ActivityLog from "../pages/ActivityLog";
import Inventory from "../pages/Inventory";
import SupplierManagement from "../pages/SupplierManagement";
import CustomerManagement from "../pages/CustomerManagement";
import SalesManagement from "../pages/SalesManagement";
import SalesReport from "../pages/SalesReport";
import Refund from "../pages/Refund";
import PurchaseOrder from "../pages/PurchaseOrder";
import Report from "../pages/Report";
import Notifications from "../pages/Notifications";
import BackupRestore from "../pages/BackupRestore";
import Settings from "../pages/Settings";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login Route (No Sidebar) */}
        <Route
          path="/login"
          element={
            <>
              <Login />
              <Footer />
            </>
          }
        />

        {/* --- Protected Routes --- */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity-log"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ActivityLog />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Inventory />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales-management"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SalesManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales-report"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SalesReport />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/refund"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Refund />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-order"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PurchaseOrder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Report />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/supplier-management"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SupplierManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-management"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CustomerManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backuprestore"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <BackupRestore />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
