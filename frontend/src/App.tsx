import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Dashboard from './Dashboard';
import SimulationPanel from './SimulationPanel';
import CowList from './CowList';
import CowDetail from './CowDetail';
import VetPortal from './VetPortal';
import ModelEvaluation from './ModelEvaluation';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import LoadingScreen from './components/LoadingScreen';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <LoadingProvider>
      <LoadingScreen />
      <AuthProvider>
        <Router>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cows"
                element={
                  <ProtectedRoute>
                    <CowList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cows/:id"
                element={
                  <ProtectedRoute>
                    <CowDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulation"
                element={
                  <ProtectedRoute>
                    <SimulationPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vet"
                element={
                  <ProtectedRoute>
                    <VetPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/metrics"
                element={
                  <ProtectedRoute>
                    <ModelEvaluation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
