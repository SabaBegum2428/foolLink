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
      <div className="nav-links">
        {user ? (
          <>
            <Link href="/dashboard" className="nav-link" style={{ borderBottom: '2px solid var(--secondary)' }}>
              Dashboard
            </Link>
            <button onClick={logout} className="btn nav-link" style={{ background: 'transparent', color: '#fca5a5', padding: 0 }}>
              Logout ({user.name.split(' ')[0]})
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">Login</Link>
            <Link href="/register" className="btn btn-primary">Join Now</Link>
          </>
        )}
      </div>
    </nav>
  );
}
