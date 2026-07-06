import { PageTransition } from '../components/layout';
import { Card } from '../components/common';
import { Settings as SettingsIcon, Bell, Shield, Palette, Download } from 'lucide-react';

const sections = [
  { icon: Bell, label: 'Notifications', desc: 'Configure email and in-app notifications' },
  { icon: Shield, label: 'Security', desc: 'Manage your account security preferences' },
  { icon: Palette, label: 'Appearance', desc: 'Customize the dashboard appearance' },
  { icon: Download, label: 'Export', desc: 'Export orders and reports' },
];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map((section) => (
            <Card key={section.label} hover className="flex items-start gap-4 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center text-text-secondary shrink-0">
                <section.icon size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{section.label}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{section.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
