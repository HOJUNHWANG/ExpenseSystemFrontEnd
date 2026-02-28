import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../AuthContext';

function getEmailFromRole(role: string): string | null {
  const entry = DEMO_USERS[role];
  return entry?.email ?? null;
}

export default function E2ELoginPage() {
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Logging in…');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const email = params.get('email');
      const role = params.get('role');
      const next = params.get('next') || '/dashboard';

      const resolvedEmail = email || (role ? getEmailFromRole(role) : null);
      if (!resolvedEmail) {
        setStatus('Missing email/role query param.');
        return;
      }

      try {
        await loginWithEmail(resolvedEmail);
        setStatus('Logged in. Redirecting…');
        navigate(next, { replace: true });
      } catch (e: unknown) {
        setStatus(e instanceof Error ? e.message : 'Login failed');
      }
    };

    void run();
  }, [location.search, loginWithEmail, navigate]);

  return (
    <div className="rounded-2xl bg-card border shadow-sm p-6">
      <h1 className="text-xl font-semibold text-foreground">E2E Login</h1>
      <p className="mt-2 text-sm text-muted-foreground">{status}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        (This page is used by automated Playwright tests to set a deterministic auth state.)
      </p>
    </div>
  );
}
