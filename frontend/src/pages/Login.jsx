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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-primary items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">AI Voice Agent</h1>
            <p className="text-sm text-text-secondary mt-2">Sign in to the pharmacy dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="alex@pharmacy.com"
              defaultValue="alex@pharmacy.com"
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
