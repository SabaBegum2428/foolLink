"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await refreshUser();
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <h1 className="title" style={{ textAlign: 'center' }}>Welcome Back</h1>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '0.8rem', borderRadius: '0.75rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="flex-column gap-1">
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              className="input"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="name@example.com"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            Sign In
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Don't have an account? <Link href="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '700' }}>Join FoodLink</Link>
        </p>
      </div>
    </div>
  );
}
