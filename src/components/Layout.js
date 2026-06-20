import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children, title, role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = {
    student: [
      { name: 'Dashboard', path: '/student', icon: '📊' },
      { name: 'Fee Status', path: '/student/fees', icon: '💰' },
      { name: 'Admit Card', path: '/student/admit-card', icon: '🎫' },
      { name: 'Attendance', path: '/student/attendance', icon: '📅' },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin', icon: '📊' },
      { name: 'Students', path: '/admin/students', icon: '👥' },
      { name: 'Fee Ledger', path: '/admin/fees', icon: '💰' },
      { name: 'Payments', path: '/admin/payments', icon: '💳' },
    ],
    faculty: [
      { name: 'Dashboard', path: '/faculty', icon: '📊' },
      { name: 'My Courses', path: '/faculty/courses', icon: '📚' },
      { name: 'Mark Attendance', path: '/faculty/attendance', icon: '📝' },
    ],
  };

  const currentMenu = menuItems[role] || menuItems.student;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logo}>🏛️ College ERP</h2>
          <p style={styles.role}>{role?.toUpperCase()}</p>
        </div>
        <nav style={styles.nav}>
          {currentMenu.map((item) => (
            <div
              key={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
                  <span>{item.name}</span>
            </div>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>{title}</h1>
          <div style={styles.userInfo}>
            <span>👤 {role}</span>
          </div>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1a1a2e',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
  },
  logoContainer: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '20px',
  },
  logo: {
    fontSize: '20px',
    margin: 0,
    marginBottom: '8px',
  },
  role: {
    fontSize: '12px',
    opacity: 0.7,
    margin: 0,
  },
  nav: {
    flex: 1,
  },
  navItem: {
    padding: '12px 20px',
    margin: '4px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s',
    color: '#a0a0c0',
  },
  navItemActive: {
    backgroundColor: '#4f46e5',
    color: 'white',
  },
  navIcon: {
    fontSize: '18px',
  },
  logoutBtn: {
    margin: '20px',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s',
  },
  main: {
    flex: 1,
    marginLeft: '260px',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 32px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  userInfo: {
    fontSize: '14px',
    color: '#666',
  },
  content: {
    padding: '32px',
  },
};

export default Layout;