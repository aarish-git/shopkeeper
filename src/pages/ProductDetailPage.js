import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { useShop } from '../context/ShopContext';
import './ProductDetailPage.css';

const getEmptySizeRow = () => ({ size: '', costPrice: '', sellingPrice: '' });

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { getProductById, updateProduct, deleteProduct } = useShop();
  const product = getProductById(productId);

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    rateType: '',
    rateValue: '',
    sizePricing: [getEmptySizeRow()],
    images: [],
  });

  useEffect(() => {
    if (!product) {
      return;
    }

    const sizePricing = Array.isArray(product.sizePricing) && product.sizePricing.length
      ? product.sizePricing.map((row) => ({
          size: String(row.size || ''),
          costPrice: String(row.costPrice ?? ''),
          sellingPrice: String(row.sellingPrice ?? ''),
        }))
      : [{
          size: String(product.size || 'Default'),
          costPrice: String(product.costPrice ?? ''),
          sellingPrice: String(product.sellingPrice ?? ''),
        }];

    setFormData({
      name: String(product.name || ''),
      quantity: String(product.quantity ?? ''),
      rateType: String(product.rateType || ''),
      rateValue: String(product.rateValue ?? ''),
      sizePricing,
      images: Array.isArray(product.images) ? product.images : product.image ? [product.image] : [],
    });
  }, [product]);

  if (!product) {
    return (
      <section className="card">
        <h2>Product Not Found</h2>
        <p>The selected product does not exist.</p>
        <button type="button" className="secondary-btn" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </section>
    );
  }

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSizePriceChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sizePricing: prev.sizePricing.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addSizePriceRow = () => {
    setFormData((prev) => ({
      ...prev,
      sizePricing: [...prev.sizePricing, getEmptySizeRow()],
    }));
  };

  const removeSizePriceRow = (index) => {
    setFormData((prev) => {
      const nextRows = prev.sizePricing.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        sizePricing: nextRows.length ? nextRows : [getEmptySizeRow()],
      };
    });
  };

  const onSave = (event) => {
    event.preventDefault();
    const updated = updateProduct(product.id, formData);
    if (updated) {
      navigate('/products');
    }
  };

  const onDelete = () => {
    const shouldDelete = window.confirm('Delete this product permanently?');
    if (!shouldDelete) {
      return;
    }

    const deleted = deleteProduct(product.id);
    if (deleted) {
      navigate('/products');
    }
  };

  return (
    <section className="card">
      <div className="detail-header">
        <h2>Edit Product</h2>
        <p className="detail-meta">Product ID: {product.id}</p>
      </div>

      <form className="detail-form" onSubmit={onSave}>
        <div className="form-grid">
          <label>
            Product Name
            <input name="name" value={formData.name} onChange={onFieldChange} required />
          </label>

          <label>
            Quantity
            <input
              name="quantity"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.quantity}
              onChange={onFieldChange}
              required
            />
          </label>

          <label>
            Price / Rate Type (Optional)
            <select name="rateType" value={formData.rateType} onChange={onFieldChange}>
              <option value="">None</option>
              <option value="rupees">Rupees</option>
              <option value="weight">By Weight</option>
            </select>
          </label>

          <label>
            Price / Rate Value
            <input name="rateValue" type="number" min="0" step="0.01" value={formData.rateValue} onChange={onFieldChange} placeholder="Optional" />
          </label>
        </div>

        <div className="form-section">
          <h3>Sizes and Prices</h3>
          <div className="size-price-list">
            {formData.sizePricing.map((row, index) => (
              <div key={`${index}-${row.size}`} className="size-price-row">
                <label>
                  Size
                  <input value={row.size} onChange={(event) => onSizePriceChange(index, 'size', event.target.value)} placeholder="S / M / L / 500g" required />
                </label>

                <label>
                  Cost Price
                  <input type="number" min="0" step="0.01" value={row.costPrice} onChange={(event) => onSizePriceChange(index, 'costPrice', event.target.value)} required />
                </label>

                <label>
                  Selling Price
                  <input type="number" min="0" step="0.01" value={row.sellingPrice} onChange={(event) => onSizePriceChange(index, 'sellingPrice', event.target.value)} required />
                </label>

                <button type="button" className="danger-btn size-remove-btn" onClick={() => removeSizePriceRow(index)} disabled={formData.sizePricing.length === 1}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="secondary-btn" onClick={addSizePriceRow}>
            + Add Another Size
          </button>
        </div>

        <div className="form-section">
          <h3>Product Images</h3>
          <ImageUpload initialImages={formData.images} onImagesAdd={(images) => setFormData((prev) => ({ ...prev, images }))} />
        </div>

        <div className="detail-actions">
          <button type="submit" className="primary-btn">Save Changes</button>
          <button type="button" className="secondary-btn" onClick={() => navigate('/products')}>Cancel</button>
          <button type="button" className="danger-btn" onClick={onDelete}>Delete Product</button>
        </div>
      </form>
    </section>
  );
}

export default ProductDetailPage;
