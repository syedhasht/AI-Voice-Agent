import { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout';
import { Card, Input, Button } from '../components/common';
import { Globe, Plus, X, Check } from 'lucide-react';

export default function Settings() {
  const [allowedHosts, setAllowedHosts] = useState(() => {
    const saved = localStorage.getItem('allowed_hosts');
    return saved ? JSON.parse(saved) : ['localhost:5173', 'localhost:4173'];
  });
  const [newHost, setNewHost] = useState('');
  const [hostError, setHostError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('allowed_hosts', JSON.stringify(allowedHosts));
  }, [allowedHosts]);

  // Hostname validation
  const validateHost = (value) => {
    if (!value) {
      return '';
    }
    // Check if it starts with protocol or contains ://
    if (/^[a-zA-Z]+:\/\//.test(value) || value.includes('://')) {
      return 'Hostname should not contain the protocol (http://, https://, etc.)';
    }
    return '';
  };

  const handleHostChange = (e) => {
    const val = e.target.value;
    setNewHost(val);
    setHostError(validateHost(val));
  };

  const handleAddHost = (e) => {
    e.preventDefault();
    const trimmed = newHost.trim();
    if (!trimmed) return;

    const error = validateHost(trimmed);
    if (error) {
      setHostError(error);
      return;
    }

    if (allowedHosts.includes(trimmed)) {
      setHostError('Hostname is already in the allowlist.');
      return;
    }

    setAllowedHosts([...allowedHosts, trimmed]);
    setNewHost('');
    setHostError('');
    showSuccess('Host added to allowlist successfully.');
  };

  const handleRemoveHost = (hostToRemove) => {
    setAllowedHosts(allowedHosts.filter(h => h !== hostToRemove));
    showSuccess('Host removed from allowlist.');
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
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
              AM
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Alex Morgan</p>
              <p className="text-xs text-text-secondary">alex@pharmacy.com</p>
              <p className="text-xs text-text-tertiary mt-0.5">Sales Representative</p>
            </div>
          </div>
        </Card>

        {/* Allowlist Card */}
        <Card>
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Globe size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-text-primary">Allowlist</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Specify the hosts that will be allowed to connect to this agent.
          </p>

          {/* Current allowed hosts list */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Allowed Hostnames
            </h4>
            {allowedHosts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-sm text-text-tertiary">
                No hosts added yet. All hosts are blocked.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allowedHosts.map((host) => (
                  <div
                    key={host}
                    className="flex items-center gap-2 bg-surface-secondary border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary shadow-sm hover:border-text-tertiary transition-colors"
                  >
                    <span className="font-mono">{host}</span>
                    <button
                      onClick={() => handleRemoveHost(host)}
                      className="text-text-tertiary hover:text-red-accent transition-colors cursor-pointer"
                      title={`Remove ${host}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add host form */}
          <form onSubmit={handleAddHost} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-grow w-full">
                <Input
                  label="Add host"
                  value={newHost}
                  onChange={handleHostChange}
                  placeholder="e.g. localhost:5173"
                  error={hostError}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!!hostError || !newHost.trim()}
                icon={Plus}
                className="w-full sm:w-auto shrink-0 py-2.5 h-[42px]"
              >
                Add host
              </Button>
            </div>
          </form>

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-emerald-dark text-sm flex items-center gap-2">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
