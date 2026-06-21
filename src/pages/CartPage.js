import { useNavigate } from 'react-router-dom';
import { formatCurrency, useShop } from '../context/ShopContext';

function CartPage() {
  const { cartItems, updateCartQuantity, updateCartSellingPrice, removeFromCart, markAsSold } = useShop();
  const navigate = useNavigate();

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.sellingPrice || 0),
    0
  );

  const onCompleteSale = () => {
    const done = markAsSold();
    if (done) {
      navigate('/sold');
    }
  };

  return (
    <section className="card">
      <h2>Cart Items</h2>
      {cartItems.length === 0 ? <p>No items in cart.</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Quantity</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Line Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.size || '-'}</td>
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={item.quantity}
                    onChange={(event) => updateCartQuantity(item.id, event.target.value)}
                  />
                </td>
                <td>{formatCurrency(item.costPrice)}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.sellingPrice}
                    onChange={(event) => updateCartSellingPrice(item.id, event.target.value)}
                  />
                </td>
                <td>{formatCurrency(Number(item.quantity || 0) * Number(item.sellingPrice || 0))}</td>
                <td>
                  <button className="danger-btn" type="button" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cartItems.length > 0 ? (
        <div className="summary-box">
          <p>Total Amount: {formatCurrency(cartTotal)}</p>
        </div>
      ) : null}

      <div className="cart-actions">
        <button className="primary-btn" type="button" onClick={onCompleteSale}>
          Sold (Complete Sale)
        </button>
      </div>
    </section>
  );
}

export default CartPage;
