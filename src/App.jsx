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
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8">

        {/* Logo */}
        <NavLink
          to="/"
          className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#fbbf24]"
        >
          🌿 NeuroNav
        </NavLink>

        {/* Nav Links */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
          {user ? (
            <>
              <NavLink to="/" end className={({ isActive }) =>
                `cozy-nav-tab ${isActive ? 'cozy-nav-tab-active' : ''}`
              }>
                Map
              </NavLink>

              <NavLink to="/report" className={({ isActive }) =>
                `cozy-nav-tab ${isActive ? 'cozy-nav-tab-active' : ''}`
              }>
                Report
              </NavLink>

              <NavLink to="/dashboard" className={({ isActive }) =>
                `cozy-nav-tab ${isActive ? 'cozy-nav-tab-active' : ''}`
              }>
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
              <NavLink to="/login" className={({ isActive }) =>
                `cozy-nav-tab ${isActive ? 'cozy-nav-tab-active' : ''}`
              }>
                Login
              </NavLink>

              <NavLink to="/signup" className={({ isActive }) =>
                `cozy-nav-tab ${isActive ? 'cozy-nav-tab-active' : ''}`
              }>
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

        <div className="relative min-h-screen cozy-page-bg text-[#f5e6c8]">

          {/* Background effects */}
          <GlobalAmbience />
          <NeuroNavChat />

          {/* Main layout */}
          <div className="relative z-10 flex min-h-screen flex-col">

            {/* Navbar */}
            <Nav />

            {/* Pages */}
            <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route path="/" element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                } />

                <Route path="/report" element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>

          </div>
        </div>

      </BrowserRouter>
    </AuthProvider>
  )
}