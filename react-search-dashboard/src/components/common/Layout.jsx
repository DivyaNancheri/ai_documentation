import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="logo">Data Dashboard</h1>
        </div>
        <div className="header-right">
          <span className="user-info">👤 Admin User</span>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="nav-menu">
            <Link 
              to="/" 
              className={`nav-item ${isActive('/') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              {sidebarOpen && <span className="nav-label">Dashboard</span>}
            </Link>
            <Link 
              to="/search" 
              className={`nav-item ${isActive('/search') ? 'active' : ''}`}
            >
              <span className="nav-icon">🔍</span>
              {sidebarOpen && <span className="nav-label">Search</span>}
            </Link>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
