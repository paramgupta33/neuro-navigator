import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName, dob);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account. ' + (err.message || ''));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cozy-page-bg min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbbf24]/10 text-3xl">
            🌱
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#fbbf24]">
            Join the Village
          </h1>
          <p className="mt-2 text-white/60">
            Create your NeuroNav account to start exploring
          </p>
        </div>

        <div className="cozy-card p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Full Name</label>
              <input 
                type="text" 
                required 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Gus"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gus@stardew.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Date of Birth</label>
              <input 
                type="date" 
                required 
                value={dob} 
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

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

            <button 
              type="submit" 
              disabled={loading}
              className="cozy-pixel-btn cozy-pixel-btn-wheat mt-2 w-full py-4 text-lg"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <p className="text-white/40">
              Already a villager? <Link to="/login" className="text-[#fbbf24] font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
