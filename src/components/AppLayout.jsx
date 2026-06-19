import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';

const navItems = [
  { to: '/', label: '🏠 Home' },
  { to: '/add-product', label: '➕ Add Product' },
  { to: '/products', label: '📦 Products' },
  { to: '/cart', label: '🛒 Cart' },
  { to: '/sold', label: '📈 Sales' },
];

function AppLayout({ children }) {
  const { message, clearMessage } = useShop();
  const { user, signOutUser } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon">🛍️</div>
            <div>
              <h1>Shopkeeper</h1>
              <p>Smart Business Management</p>
            </div>
          </div>
          <div className="header-account">
            <div className="account-chip">
              <span className="account-label">Signed in</span>
              <strong>{user?.displayName || user?.email || 'Google user'}</strong>
            </div>
            <button type="button" className="secondary-btn header-logout-btn" onClick={signOutUser}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="page-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-btn active nav-link' : 'nav-btn nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {message ? (
        <p className="status-msg">
          {message}
          <button type="button" className="clear-msg-btn" onClick={clearMessage}>
            ✕
          </button>
        </p>
      ) : null}

      <main className="page-body">{children}</main>
    </div>
  );
}

export default AppLayout;