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
  const { soldLines, totals, salesFilter, setSalesFilter, clearMessage, clearTodaySales } = useShop();

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
        <button className="danger-btn" type="button" onClick={onResetTodaySales}>
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
    </section>
  );
}

export default SalesPage;
