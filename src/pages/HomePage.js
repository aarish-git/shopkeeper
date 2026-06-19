import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import './HomePage.css';

function HomePage() {
  const { exportBackupData, importBackupData } = useShop();
  const backupFileInputRef = useRef(null);

  const onBackupRestoreClick = () => {
    backupFileInputRef.current?.click();
  };

  const onBackupFileSelected = async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    await importBackupData(file);
    event.target.value = '';
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">📊 Smart Business Management</div>
          <h1 className="hero-title">Welcome to Shopkeeper</h1>
          <p className="hero-subtitle">
            Manage your products, sales, and profits with ease. Built for shopkeepers, by shopkeepers.
          </p>
          <div className="hero-ctas">
            <Link to="/products" className="cta-btn primary-cta">
              Browse Products →
            </Link>
            <Link to="/add-product" className="cta-btn secondary-cta">
              Add Product
            </Link>
          </div>
        </div>
        <div className="hero-graphic">
          <div className="graphic-card">📦</div>
          <div className="graphic-card">💰</div>
          <div className="graphic-card">📈</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Shopkeeper?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛍️</div>
            <h3>Easy Product Management</h3>
            <p>Add products with images, prices, sizes, and more in seconds.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛒</div>
            <h3>Smart Shopping Cart</h3>
            <p>Manage quantities, track prices, and checkout with one click.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💹</div>
            <h3>Profit Analytics</h3>
            <p>Track your cost, selling price, and profit instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Bill Generation</h3>
            <p>Export sales reports as PDF or Word documents automatically.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Sales History</h3>
            <p>View all sold products with smart filters (day, week, month, year).</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Data Security</h3>
            <p>All your data is stored securely on your device.</p>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/add-product" className="action-card add-product-card">
            <div className="action-icon">➕</div>
            <h3>Add Product</h3>
            <p>Create a new product listing</p>
          </Link>

          <Link to="/products" className="action-card products-card">
            <div className="action-icon">📦</div>
            <h3>View Products</h3>
            <p>Browse your product catalog</p>
          </Link>

          <Link to="/cart" className="action-card cart-card">
            <div className="action-icon">🛒</div>
            <h3>Go to Cart</h3>
            <p>Checkout your items</p>
          </Link>

          <Link to="/sold" className="action-card sold-card">
            <div className="action-icon">📈</div>
            <h3>View Sales</h3>
            <p>Check your sales history</p>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Start Selling?</h2>
        <p>Get started in less than a minute</p>
        <Link to="/add-product" className="cta-btn large-cta">
          Add Your First Product
        </Link>
      </section>

      <section className="backup-section">
        <h2>Backup and Restore</h2>
        <p>Keep your products and sales safe. Export a backup file and restore it anytime.</p>
        <div className="backup-actions">
          <button type="button" className="primary-btn" onClick={exportBackupData}>
            Export Backup
          </button>
          <button type="button" className="secondary-btn" onClick={onBackupRestoreClick}>
            Restore Backup
          </button>
          <input
            ref={backupFileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onBackupFileSelected}
            style={{ display: 'none' }}
          />
        </div>
      </section>

      {/* Footer Info */}
      <section className="info-footer">
        <div className="info-card">
          <span className="info-number">∞</span>
          <span className="info-label">Unlimited Products</span>
        </div>
        <div className="info-card">
          <span className="info-number">∞</span>
          <span className="info-label">Unlimited Sales</span>
        </div>
        <div className="info-card">
          <span className="info-number">🔒</span>
          <span className="info-label">Your Data, Your Device</span>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
