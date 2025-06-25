import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setEmailError(false);
    setPasswordError(false);

    let hasError = false;

    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) return;
   
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        alert('Login successful!');
        navigate('/dashboard');
      } else {
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      setErrorMessage('There was a problem with connecting with the server!');
    } finally {
      setLoading(false);
    }
  };

   return (
    <div className="login-main-content">
      <div className="login-container">
        <h2>Login</h2>

        {errorMessage && 
        <div className="error-message">{errorMessage}</div>
        }

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <p>Connecting, please wait...</p>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={emailError ? 'input-error' : ''}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={passwordError ? 'input-error' : ''}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;