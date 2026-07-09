import { PageTransition } from '../components/layout';
import { Card } from '../components/common';

export default function Settings() {
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
              AM
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Alex Morgan</p>
              <p className="text-xs text-text-secondary">alex@pharmacy.com</p>
              <p className="text-xs text-text-tertiary mt-0.5">Sales Representative</p>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
