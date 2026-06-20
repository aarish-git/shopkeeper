import { useState } from 'react';
import { useShop, formatCurrency } from '../context/ShopContext';
import { generatePdfBill, generateWordBill } from '../utils/billing';

const SALES_FILTERS = [
  { key: 'TODAY', label: 'Today' },
  { key: 'WEEK', label: '1 Week' },
  { key: 'MONTH', label: '1 Month' },
  { key: 'YEAR', label: '1 Year' },
  { key: 'ALL', label: 'All' },
];

const getSaleLineAmount = (line, key) => Number(line[key] || 0) * Number(line.quantity || 0);

function SalesPage() {
  const { soldLines, totals, salesFilter, setSalesFilter, clearMessage, clearTodaySales, adminPassword } = useShop();
  const [showSalesData, setShowSalesData] = useState(false);
  const [isResetArmed, setIsResetArmed] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const onToggleSalesVisibility = () => {
    if (showSalesData) {
      setShowSalesData(false);
      setIsResetArmed(false);
      return;
    }

    setAdminPasswordInput('');
    setAdminError('');
    setIsAdminDialogOpen(true);
  };

  const onUnlockSalesData = () => {
    if (adminPasswordInput === adminPassword) {
      setShowSalesData(true);
      setIsAdminDialogOpen(false);
      setAdminPasswordInput('');
      setAdminError('');
      return;
    }

    setAdminError('Incorrect password.');
  };

  const onPdf = () => {
    if (!soldLines.length) {
      return;
    }
    clearMessage();
    generatePdfBill(soldLines, totals);
  };

  const onWord = () => {
    if (!soldLines.length) {
      return;
    }
    clearMessage();
    generateWordBill(soldLines, totals);
  };

  const onResetTodaySales = () => {
    const shouldReset = window.confirm('Reset all sales records for today? This cannot be undone.');
    if (!shouldReset) {
      return;
    }

    clearTodaySales();
  };

  return (
    <section className="card">
      <div className="sold-header">
        <h2>Sold Products</h2>
        <div className="filter-row">
          {SALES_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={salesFilter === filter.key ? 'chip active' : 'chip'}
              onClick={() => setSalesFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: '16px' }}>
        <button className="secondary-btn" type="button" onClick={onToggleSalesVisibility}>
          {showSalesData ? 'Hide Sales Data' : 'Show Sales Data'}
        </button>
      </div>

      {!showSalesData ? <p>Sales data is hidden. Click Show Sales Data and enter admin password.</p> : null}

      {showSalesData ? (
        <>
          <div className="btn-row" style={{ marginBottom: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isResetArmed}
                onChange={(event) => setIsResetArmed(event.target.checked)}
              />
              I understand this resets today sales.
            </label>
            <button className="danger-btn" type="button" onClick={onResetTodaySales} disabled={!isResetArmed}>
              Reset Today Sales
            </button>
          </div>

          {!soldLines.length ? <p>No sold products in this period.</p> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Cost Total</th>
                  <th>Selling Total</th>
                  <th>Profit</th>
                  <th>Sold At</th>
                </tr>
              </thead>
              <tbody>
                {soldLines.map((line, index) => {
                  const lineCost = getSaleLineAmount(line, 'costPrice');
                  const lineSelling = getSaleLineAmount(line, 'sellingPrice');
                  return (
                    <tr key={`${line.productId}-${line.size || 'default'}-${line.soldAt}-${index}`}>
                      <td>{line.name}</td>
                      <td>{line.size || '-'}</td>
                      <td>{line.quantity}</td>
                      <td>{formatCurrency(line.costPrice)}</td>
                      <td>{formatCurrency(line.sellingPrice)}</td>
                      <td>{formatCurrency(lineCost)}</td>
                      <td>{formatCurrency(lineSelling)}</td>
                      <td>{formatCurrency(lineSelling - lineCost)}</td>
                      <td>{new Date(line.soldAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="summary-box">
            <p>Total Cost Price: {formatCurrency(totals.totalCost)}</p>
            <p>Total Selling Price: {formatCurrency(totals.totalSelling)}</p>
            <p>Total Profit Earned: {formatCurrency(totals.totalProfit)}</p>
          </div>

          <div className="btn-row">
            <button className="primary-btn" type="button" onClick={onPdf} disabled={!soldLines.length}>
              Download PDF Bill
            </button>
            <button className="secondary-btn" type="button" onClick={onWord} disabled={!soldLines.length}>
              Download Word Bill
            </button>
          </div>
        </>
      ) : null}

      {isAdminDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.35)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 18px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Admin Access</h3>
            <p>Enter admin password to view sales data.</p>
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(event) => setAdminPasswordInput(event.target.value)}
              placeholder="Enter password"
              autoFocus
            />
            {adminError ? <p style={{ color: '#b91c1c', marginTop: '8px' }}>{adminError}</p> : null}
            <div className="btn-row" style={{ marginTop: '16px' }}>
              <button className="primary-btn" type="button" onClick={onUnlockSalesData}>
                Unlock
              </button>
              <button className="secondary-btn" type="button" onClick={() => setIsAdminDialogOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default SalesPage;
