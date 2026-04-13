import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { GlobalAmbience } from './components/GlobalAmbience'
import { NeuroNavChat } from './components/NeuroNavChat'
import DashboardPage from './pages/DashboardPage'
import MapPage from './pages/MapPage'
import ReportPage from './pages/ReportPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-[2000] border-b border-white/5 bg-[#0f0a06]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <NavLink
          to="/"
          className="font-heading text-xl font-bold tracking-tight text-[#fbbf24] transition-all duration-200 hover:opacity-80"
        >
          🌿 NeuroNav
        </NavLink>
        <div className="flex items-center gap-1 md:gap-2">
          {user ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `cozy-nav-tab${isActive ? ' cozy-nav-tab-active' : ''}`
                }
              >
                Map
              </NavLink>
              <NavLink
                to="/report"
                className={({ isActive }) =>
                  `cozy-nav-tab${isActive ? ' cozy-nav-tab-active' : ''}`
                }
              >
                Report
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `cozy-nav-tab${isActive ? ' cozy-nav-tab-active' : ''}`
                }
              >
                Dashboard
              </NavLink>
              <button
                onClick={logout}
                className="cozy-nav-tab text-white/60 hover:text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `cozy-nav-tab${isActive ? ' cozy-nav-tab-active' : ''}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `cozy-nav-tab${isActive ? ' cozy-nav-tab-active' : ''}`
                }
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative flex min-h-screen flex-col cozy-page-bg text-[#f5e6c8]">
          <GlobalAmbience />
          <NeuroNavChat />
          <div className="relative z-10 flex min-h-screen flex-1 flex-col">
          <Nav />
          <main className="relative z-10 flex-1">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            </Routes>
          </main>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
