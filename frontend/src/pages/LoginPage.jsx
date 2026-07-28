import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, Flame, ShieldCheck } from "lucide-react";
import { extractErrorMessage } from "@/lib/axios";
import { useAppDispatch } from "@/hooks/useStore";
import { loginSuccess } from "@/store/authSlice";
import { api } from "@/services/api";

function LoginPage({ onLogin }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.login(email.trim().toLowerCase(), password);
      const user = await api.getCurrentUser();
      console.log("User data:", user);
      console.log("User permissions:", user.permissions);
      console.log("User role:", user.role_name);
      dispatch(
        loginSuccess({
          email: user.email,
          name: user.name,
          role: user.role_name || "Admin",
          permissions: user.permissions || []
        })
      );
      onLogin?.();
      navigate("/");
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid credentials. Use admin@gmail.com / admin123"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agnigate-login-page">
      <div className="network-background"></div>
      <div className="login-content">
        <div className="login-logo-section">
          <img 
            src="/agnigate_logo.png" 
            alt="Agnigate Logo" 
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="logo-fallback">
            <div className="logo-icon">
              <Flame size={48} />
            </div>
            <h1 className="brand-name">AGNIGATE</h1>
          </div>
          <p className="system-name">NETWORK MANAGEMENT SYSTEM</p>
        </div>

        <div className="login-subtitle">
          Sign in to continue to your account
        </div>

        <form className="agnigate-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-with-icon">
              <Mail size={20} className="field-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username or Email"
                autoComplete="username"
                className="agnigate-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Lock size={20} className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="agnigate-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error ? <div className="error-message">{error}</div> : null}

          <div className="form-actions">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="custom-checkbox"
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Signing in..." : "LOGIN"}
          </button>
        </form>

      

       

        <div className="copyright">
          © 2024 Agnigate Technologies. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export { LoginPage };
