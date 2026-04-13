"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Donor",
    contact: "",
    address: ""
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [agreement, setAgreement] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const requiresProof = formData.role === "NGO" || formData.role === "Receiver" || formData.role === "Donor";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (requiresProof && !proofFile) {
        setError(`${formData.role} must provide valid proof of registration / identity.`);
        return;
    }

    if (!agreement) {
        setError("You must take full responsibility for the quality and safety of your participation.");
        return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append("agreement", agreement.toString());
    if (proofFile) data.append("proof_file", proofFile);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: data,
    });

    if (res.ok) {
        // Automatically login the user after successful registration
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        
        if (!loginRes.ok) {
            const err = await loginRes.json();
            setError(err.error || "Auto-login failed. Please login manually.");
            return;
        }
        
        await refreshUser();
        router.push("/dashboard");
    } else {
      const d = await res.json();
      setError(d.error || "Registration failed");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', padding: '3rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <h1 className="title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Join FoodLink</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Create your account to start redistributing food.</p>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.95rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="flex-column gap-1">
          <div className="input-group">
            <label>Name / Organization</label>
            <input 
              type="text" 
              className="input"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
              placeholder="Organization Name"
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="input"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              placeholder="email@example.com"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input"
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
              placeholder="••••••••"
            />
          </div>
          <div className="input-group">
            <label>Contact Number</label>
            <input 
              type="text" 
              className="input"
              value={formData.contact} 
              onChange={e => setFormData({...formData, contact: e.target.value})} 
              required 
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="input-group">
            <label>Address / Location</label>
            <input 
              type="text" 
              className="input"
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              required 
              placeholder="e.g. 123 Main St, New York"
            />
          </div>

          <div className="input-group">
            <label>Account Role</label>
            <select 
              className="select"
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})} 
            >
              <option value="Donor">Donor (Providing Food)</option>
              <option value="NGO">NGO (Managing Redistribution)</option>
              <option value="Volunteer">Volunteer (Logistics/Delivery)</option>
              <option value="Receiver">Receiver (Orphanage/Rest-house)</option>
            </select>
          </div>

          {requiresProof && (
              <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '1.25rem', border: '1px dashed var(--secondary)', margin: '1rem 0' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--secondary)' }}>
                      Identity / Registration Proof Required
                  </label>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Please upload an official ID or organization registration document (Photo only).
                  </p>
                  <input 
                    type="file" 
                    onChange={e => setProofFile(e.target.files ? e.target.files[0] : null)}
                    accept="image/*"
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      background: 'rgba(0,0,0,0.2)', 
                      borderRadius: '0.5rem',
                      color: 'var(--text-active)'
                    }}
                  />
                  {proofFile && <p style={{ color: 'var(--success)', marginTop: '0.75rem', fontWeight: 'bold' }}>✅ File ready for upload</p>}
              </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.25rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)', margin: '1rem 0' }}>
            <input 
              type="checkbox" 
              id="agreement"
              checked={agreement}
              onChange={e => setAgreement(e.target.checked)}
              style={{ marginTop: '0.35rem', transform: 'scale(1.2)' }}
            />
            <label htmlFor="agreement" style={{ fontSize: '0.85rem', color: 'var(--warning)', cursor: 'pointer', lineHeight: '1.5' }}>
              <strong>Responsibility Agreement:</strong> I confirm that any food I provide is safe for consumption, I will disclose all allergens, and I take full responsibility for the quality of my participation.
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '3.5rem', marginTop: '1rem', fontSize: '1.1rem' }}>
            Create Account
          </button>
        </form>
        
        <p style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '700' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
