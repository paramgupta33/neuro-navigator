import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Check your email and password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions.');
    } catch (err) {
      setError('Failed to reset password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cozy-page-bg min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbbf24]/10 text-3xl">
            {isResetMode ? '🔑' : '🏡'}
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#fbbf24]">
            {isResetMode ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-white/60">
            {isResetMode ? 'Enter your email to receive a reset link' : 'Sign in to your NeuroNav account'}
          </p>
        </div>

        <div className="cozy-card p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              {message}
            </div>
          )}

          <form onSubmit={isResetMode ? handleReset : handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="villager@mumbai.in"
              />
            </div>

            {!isResetMode && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="cozy-pixel-btn cozy-pixel-btn-wheat mt-2 w-full py-4 text-lg"
            >
              {loading ? 'Processing...' : (isResetMode ? 'Send Reset Link' : 'Sign In')}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4 text-center text-sm">
            <button 
              onClick={() => setIsResetMode(!isResetMode)}
              className="text-[#fbbf24] hover:underline"
            >
              {isResetMode ? 'Back to Login' : 'Forgot Password?'}
            </button>
            {!isResetMode && (
              <p className="text-white/40">
                New villager? <Link to="/signup" className="text-[#fbbf24] font-semibold hover:underline">Create an account</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
