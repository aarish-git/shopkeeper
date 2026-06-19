import { useNavigate } from 'react-router-dom';
import { formatCurrency, useShop } from '../context/ShopContext';

function CartPage() {
  const { cartItems, updateCartQuantity, removeFromCart, markAsSold } = useShop();
  const navigate = useNavigate();

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
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateCartQuantity(item.id, event.target.value)}
                  />
                </td>
                <td>{formatCurrency(item.costPrice)}</td>
                <td>{formatCurrency(item.sellingPrice)}</td>
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

      <div className="cart-actions">
        <button className="primary-btn" type="button" onClick={onCompleteSale}>
          Sold (Complete Sale)
        </button>
      </div>
    </section>
  );
}

export default CartPage;
