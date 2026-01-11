'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/auth';
import { validators } from '../../lib/utils';
import { logger } from '../../lib/logger';
import { toast } from '../../lib/toast';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e?.preventDefault();

    console.log('[Login] Starting login process...');

    // Validate inputs
    if (!validators.isRequired(email)) {
      toast.error('Email is required');
      return;
    }

    if (!validators.isEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!validators.isRequired(password)) {
      toast.error('Password is required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Attempting to sign in...');
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('[Login] User authenticated:', user.id);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('[Login] User role:', roleData?.role || 'user');

      // Store authentication data
      const session = await supabase.auth.getSession();
      console.log('[Login] Session access_token:', session.data.session?.access_token ? 'Found' : 'Not found');

      auth.setAuth(
        session.data.session?.access_token,
        user,
        roleData?.role || 'user'
      );

      console.log('[Login] Auth data stored in localStorage');

      // Verify it was stored
      const storedToken = localStorage.getItem('erp_auth_token');
      const storedRole = localStorage.getItem('erp_role');
      console.log('[Login] Verification - Token in storage:', storedToken ? 'Yes' : 'No');
      console.log('[Login] Verification - Role in storage:', storedRole);

      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        console.log('[Login] Redirecting to /admin');
        router.push('/admin');
      }, 1000);

    } catch (err) {
      console.error('[Login] Error:', err);
      logger.error('Login failed', err);
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000000',
      fontFamily: "'Poppins', sans-serif"
    }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Playfair+Display:wght@400;700&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .login-container {
          animation: fadeInUp 0.8s ease-out;
        }
        
        input::placeholder {
          color: #666;
        }
      `}</style>
      
      {/* Premium Background Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: 'radial-gradient(circle at 50% 10%, #1a1610 0%, #000000 70%)'
      }}></div>
      
      {/* Subtle Pattern Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.5,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b69142' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Login Container */}
      <div className="login-container" style={{
        width: '420px',
        maxWidth: '90vw',
        zIndex: 10
      }}>
        <div style={{
          position: 'relative',
          background: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(182, 145, 66, 0.3)',
          borderRadius: '20px',
          padding: '50px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}>
          
          {/* Gold Top Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #B69142, transparent)'
          }}></div>

          {/* Brand Title */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '3rem',
            color: '#B69142',
            marginBottom: '5px',
            letterSpacing: '2px',
            textShadow: '0 0 20px rgba(182, 145, 66, 0.3)',
            fontWeight: 400
          }}>
            SAHAR
          </h1>
          
          {/* Brand Subtitle */}
          <div style={{
            fontSize: '0.8rem',
            color: '#888',
            letterSpacing: '4px',
            marginBottom: '40px',
            textTransform: 'uppercase',
            fontWeight: 500
          }}>
            PREMIUM ERP SYSTEM
          </div>

          {/* Login Inputs */}
          <div style={{ marginBottom: '25px' }}>
            
            {/* Email Input */}
            <div style={{
              position: 'relative',
              marginBottom: '25px',
              textAlign: 'left'
            }}>
              <Mail style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                color: focusedField === 'email' ? '#fff' : '#B69142',
                transition: 'all 0.3s',
                pointerEvents: 'none',
                textShadow: focusedField === 'email' ? '0 0 5px #B69142' : 'none'
              }} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{
                  width: '100%',
                  padding: '15px 20px 15px 50px',
                  background: focusedField === 'email' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                  border: focusedField === 'email' ? '1px solid #B69142' : '1px solid #333',
                  borderRadius: '10px',
                  color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxShadow: focusedField === 'email' ? '0 0 15px rgba(182, 145, 66, 0.1)' : 'none'
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{
              position: 'relative',
              marginBottom: '10px',
              textAlign: 'left'
            }}>
              <Lock style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                color: focusedField === 'password' ? '#fff' : '#B69142',
                transition: 'all 0.3s',
                pointerEvents: 'none',
                textShadow: focusedField === 'password' ? '0 0 5px #B69142' : 'none'
              }} />
              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && email && password && !loading) {
                    handleLogin(e);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '15px 20px 15px 50px',
                  background: focusedField === 'password' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                  border: focusedField === 'password' ? '1px solid #B69142' : '1px solid #333',
                  borderRadius: '10px',
                  color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxShadow: focusedField === 'password' ? '0 0 15px rgba(182, 145, 66, 0.1)' : 'none'
                }}
              />
            </div>

            {/* Login Button */}
            <button 
              onClick={handleLogin}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(182, 145, 66, 0.3)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = '#000';
                }
              }}
              style={{
                width: '100%',
                padding: '15px',
                background: loading ? '#333' : 'linear-gradient(135deg, #B69142, #8e7032)',
                border: 'none',
                borderRadius: '10px',
                color: loading ? '#666' : '#000',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Poppins', sans-serif",
                marginTop: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  <style>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                  Verifying...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '30px',
            fontSize: '0.75rem',
            color: '#555',
            letterSpacing: '0.5px'
          }}>
            © 2026 SAHAR COFFEE. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}