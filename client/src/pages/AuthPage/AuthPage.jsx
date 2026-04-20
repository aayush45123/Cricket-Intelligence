import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthPage.module.css";

const AuthPage = () => {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password);
      }
      navigate("/my-matches");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <div className={styles.logo}>
            Cricket <span>Intelligence</span>
          </div>
          <h1 className={styles.title}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className={styles.sub}>
            {mode === "login"
              ? "Sign in to score your matches and view analytics."
              : "Join to start scoring live matches with full analytics."}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                name="name"
                className={styles.input}
                placeholder="Your name"
                value={form.name}
                onChange={update}
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              placeholder="you@email.com"
              value={form.email}
              onChange={update}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              placeholder={
                mode === "register" ? "At least 6 characters" : "Your password"
              }
              value={form.password}
              onChange={update}
              required
              minLength={6}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className={styles.switchMode}>
          {mode === "login" ? (
            <span>
              Don't have an account?
              <button
                className={styles.switchBtn}
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?
              <button
                className={styles.switchBtn}
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
