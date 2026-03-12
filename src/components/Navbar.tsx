'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check initial theme
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <nav style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 30px', 
      background: 'var(--card-bg)', 
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link href="/dashboard" style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '-0.5px' }}>
        <span style={{ color: 'var(--primary)' }}>SLIIT</span> File Share
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <Link href="/dashboard/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none' }}>
          {user?.avatarUrl ? (
            <img src={`https://sliitr2.kaveeshainduwara.lk/${user.avatarUrl}`} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <UserIcon size={18} />
          )}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name || 'Profile'}</span>
        </Link>

        {user?.email === 'kaveeshainduwara.lk@gmail.com' && (
          <Link href="/admin" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', padding: '5px 10px', background: 'var(--glass-border)', borderRadius: '6px' }}>
            Admin Panel
          </Link>
        )}

        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <LogOut size={18} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Logout</span>
        </button>
      </div>
    </nav>
  );
}
