import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;

      // 2. Fetch user role from profiles table using secure UID match
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error("Error fetching user profile: " + profileError.message);
      }

      // 3. Fallback: If profile row is missing, automatically create it
      if (!profileData) {
        const defaultRole = email === "aironlingad1303@gmail.com" ? "admin" : "faculty";
        
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: user.id, email: user.email, role: defaultRole }])
          .select("role")
          .single();

        if (insertError) {
          throw new Error(`Profile not found and auto-creation failed: ${insertError.message}`);
        }
        profileData = newProfile;
      }

      // 4. Route securely based on role
      const role = profileData.role;
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "librarystaff") {
        navigate("/library-dashboard");
      } else if (role === "avrstaff") {
        navigate("/avr-dashboard");
      } else if (role === "faculty") {
        navigate("/faculty-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login Exception:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleLogin} className="login-card">
        <div className="login-header">
          <h2>IMC Portal Login</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="login-footer">
          <Link to="/">← Back to Home</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;