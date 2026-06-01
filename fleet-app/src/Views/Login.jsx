import { useAuth0 } from '@auth0/auth0-react';

function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();

  console.log('Auth0 config:', {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE
 });

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '32px'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '48px', height: '48px',
          background: 'linear-gradient(135deg, var(--accent), #00b37a)',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        }} />
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--white)', textTransform: 'uppercase' }}>
            FleetCommand
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Operations Centre
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: '16px', padding: '40px 48px', width: '380px',
        display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--white)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Secure Access
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Sign in with your FleetCommand account to access the operations centre.
          </div>
        </div>

        <button
          onClick={() => loginWithRedirect()}
          disabled={isLoading}
          style={{
            width: '100%', padding: '13px',
            background: 'var(--accent)', border: 'none',
            borderRadius: '10px', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '15px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#000', opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 0.15s'
          }}
        >
          {isLoading ? 'Loading...' : 'Sign In'}
        </button>

        <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
          Access restricted to authorised personnel only
        </div>
      </div>
    </div>
  );
}

export default Login;