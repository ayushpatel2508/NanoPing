import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MonitorDetail from './pages/MonitorDetail';
import Settings from './pages/Settings';
import DashboardLayout from './components/DashboardLayout';
import Incidents from './pages/Incidents';
import Logs from './pages/Logs';
import History from './pages/History';
import StatusPages from './pages/StatusPages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Nested Dashboard Layout Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/incidents" element={<Incidents />} />
          <Route path="/dashboard/logs" element={<Logs />} />
          <Route path="/dashboard/history" element={<History />} />
          <Route path="/dashboard/status-pages" element={<StatusPages />} />
        </Route>

        <Route path="/dashboard/:id" element={<ProtectedRoute><MonitorDetail /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
