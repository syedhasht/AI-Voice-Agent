import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input } from '../components/common';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #ecfeff 0%, #f0fafb 40%, #cffafe 100%)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 sm:p-10" style={{ boxShadow: '0 8px 40px rgba(8,145,178,0.15), 0 2px 8px rgba(8,145,178,0.08)' }}>
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 60%, #0e7490 100%)', boxShadow: '0 6px 20px rgba(8,145,178,0.40)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">MediVoice AI</h1>
            <p className="text-sm text-text-secondary mt-2">Sign in to the pharmacy dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="zainab@pharmacy.com"
              defaultValue="zainab@pharmacy.com"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              defaultValue="password"
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-text-tertiary mt-6">
          Demo credentials pre-filled. Click sign in to continue.
        </p>
      </motion.div>
    </div>
  );
}
