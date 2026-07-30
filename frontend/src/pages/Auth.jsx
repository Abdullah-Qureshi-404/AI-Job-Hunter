import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
} from 'react-icons/hi';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import './Auth.css';

/* ─────────────────────────────────────────────
   Animation variants
   ───────────────────────────────────────────── */

const panelTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 0.9,
};

// Form fade variants
const formVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

const formTransition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94],
};

/* ─────────────────────────────────────────────
   Auth Component
   ───────────────────────────────────────────── */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const toggle = () => {
    setShowPassword(false);
    setIsLogin((prev) => !prev);
  };

  return (
    <div className="auth-page">
      {!isSupabaseConfigured && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            maxWidth: 560,
            background: 'rgba(255, 107, 107, 0.12)',
            border: '1px solid rgba(255, 107, 107, 0.45)',
            color: '#ff8f8f',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          Set <code>VITE_SUPABASE_ANON_KEY</code> to your Supabase <strong>anon</strong> key
          (Dashboard → Project Settings → API). Do not use the service_role key.
        </div>
      )}
      <div className="auth-card">

        {/* ── LEFT HALF ──────────────── */}
        <div className="form-panel form-panel--left">
          <AnimatePresence mode="wait">
            {isLogin && (
              <motion.div
                key="login-form"
                className="form-inner"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={formTransition}
              >
                <LoginForm
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  toggle={toggle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT HALF ──────────────── */}
        <div className="form-panel form-panel--right">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="signup-form"
                className="form-inner"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={formTransition}
              >
                <SignupForm
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  toggle={toggle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── PURPLE OVERLAY PANEL ─────────── */}
        <motion.div
          className="purple-panel"
          animate={{ x: isLogin ? '100%' : '0%' }}
          initial={false}
          transition={panelTransition}
          style={{ left: 0 }}
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="panel-login"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="purple-panel-content"
              >
                <h2 className="purple-heading">Hello, Friend!</h2>
                <p className="purple-text">
                  Enter your personal details and start your journey with us
                </p>
                <button
                  type="button"
                  className="btn-outline"
                  id="switch-to-signup"
                  onClick={toggle}
                >
                  SIGN UP
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="panel-signup"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="purple-panel-content"
              >
                <h2 className="purple-heading">Welcome Back!</h2>
                <p className="purple-text">
                  To keep connected with us please login with your personal info
                </p>
                <button
                  type="button"
                  className="btn-outline"
                  id="switch-to-login"
                  onClick={toggle}
                >
                  SIGN IN
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Login Form
   ───────────────────────────────────────────── */
function LoginForm({ showPassword, setShowPassword, toggle }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2 className="form-title">Sign In</h2>

      <p className="divider">use your email and password</p>

      {error && <p className="auth-error">{error}</p>}

      <div className="input-group">
        <input
          type="email"
          placeholder="Email"
          id="login-email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <HiOutlineMail className="input-icon" />
      </div>

      <div className="input-group">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          id="login-password"
          autoComplete="current-password"
          style={{ paddingRight: 40 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <HiOutlineLockClosed className="input-icon" />
        <button
          type="button"
          className="eye-toggle"
          onClick={() => setShowPassword((v) => !v)}
          aria-label="Toggle password visibility"
        >
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </button>
      </div>

      <div className="forgot-row">
        <button type="button" className="forgot-link">
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        className="btn-primary"
        id="login-submit"
        disabled={isSubmitting}
        style={{ opacity: isSubmitting ? 0.7 : 1 }}
      >
        {isSubmitting ? (
          <span className="btn-spinner" />
        ) : (
          'SIGN IN'
        )}
      </button>

      <div className="mobile-toggle">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={toggle}>
          Sign Up
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────
   Signup Form
   ───────────────────────────────────────────── */
function SignupForm({ showPassword, setShowPassword, toggle }) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await signup(email, password, fullName);
      setSuccess('Check your email to confirm your account.');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2 className="form-title">Create Account</h2>

      <p className="divider">use your email to register</p>

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="auth-success">{success}</p>}

      <div className="input-group">
        <input
          type="text"
          placeholder="Full Name"
          id="signup-name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <HiOutlineUser className="input-icon" />
      </div>

      <div className="input-group">
        <input
          type="email"
          placeholder="Email"
          id="signup-email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <HiOutlineMail className="input-icon" />
      </div>

      <div className="input-group">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          id="signup-password"
          autoComplete="new-password"
          style={{ paddingRight: 40 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <HiOutlineLockClosed className="input-icon" />
        <button
          type="button"
          className="eye-toggle"
          onClick={() => setShowPassword((v) => !v)}
          aria-label="Toggle password visibility"
        >
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </button>
      </div>

      <button
        type="submit"
        className="btn-primary"
        id="signup-submit"
        style={{ marginTop: 10, opacity: isSubmitting ? 0.7 : 1 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="btn-spinner" />
        ) : (
          'SIGN UP'
        )}
      </button>

      <div className="mobile-toggle">
        Already have an account?{' '}
        <button type="button" onClick={toggle}>
          Sign In
        </button>
      </div>
    </form>
  );
}
