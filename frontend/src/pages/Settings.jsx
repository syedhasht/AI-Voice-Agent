import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/layout';
import { Card } from '../components/common';

export default function Settings() {
  const { user } = useAuth();
  
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your account and preferences</p>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Account</h3>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-lg font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">{user.email}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{user.role}</p>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
