"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="navbar">
      <Link href="/" className="logo">
        🍽️ FoodLink
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Dashboard</Link>
            <button onClick={logout} className="btn" style={{ background: 'transparent', color: 'var(--danger)', padding: 0 }}>
              Logout ({user.name.split(' ')[0]})
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ textDecoration: 'none', color: 'var(--text-active)', fontWeight: '600' }}>Login</Link>
            <Link href="/register" className="btn btn-primary">Join Now</Link>
          </>
        )}
      </div>
    </nav>
  );
}
