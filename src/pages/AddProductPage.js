import { useState } from 'react';
import { useShop } from '../context/ShopContext';
import ImageUpload from '../components/ImageUpload';
import './AddProductPage.css';

function AddProductPage() {
  const { formData, onInputChange, onImagesChange, addSizePriceRow, removeSizePriceRow, updateSizePriceRow, addProduct, categories, addCategory } = useShop();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      onInputChange({ target: { name: 'category', value: newCategoryName.trim() } });
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  return (
    <section className="card">
      <h2>Add Product</h2>
      <form onSubmit={addProduct}>
        <div className="form-grid">
          <label>
            Product Name
            <input name="name" value={formData.name} onChange={onInputChange} required />
          </label>

          <label>
            Quantity
            <input
              name="quantity"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.quantity}
              onChange={onInputChange}
              required
            />
          </label>

          <label>
            Price / Rate Type (Optional)
            <select name="rateType" value={formData.rateType} onChange={onInputChange}>
              <option value="">None</option>
              <option value="rupees">Rupees</option>
              <option value="weight">By Weight</option>
            </select>
          </label>

          <label>
            Price / Rate Value
            <input
              name="rateValue"
              type="number"
              min="0"
              step="0.01"
              value={formData.rateValue}
              onChange={onInputChange}
              placeholder="Optional"
            />
          </label>

        </div>

        <div className="form-section">
          <h3>🏷️ Category</h3>
          <p className="section-description">Assign a category to organise your products.</p>

          <div className="category-row">
            <select
              name="category"
              value={formData.category}
              onChange={onInputChange}
              className="category-select"
            >
              <option value="">— No category —</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {!showNewCategory ? (
              <button
                type="button"
                className="secondary-btn category-add-btn"
                onClick={() => setShowNewCategory(true)}
              >
                + New
              </button>
            ) : (
              <div className="new-category-inline">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                  autoFocus
                  className="new-category-input"
                />
                <button type="button" className="primary-btn category-confirm-btn" onClick={handleAddCategory}>
                  Add
                </button>
                <button
                  type="button"
                  className="secondary-btn category-cancel-btn"
                  onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>📏 Sizes and Prices</h3>
          <p className="section-description">Add one or more sizes and set cost/selling price for each size.</p>

          <div className="size-price-list">
            {formData.sizePricing.map((row, index) => (
              <div key={`${index}-${row.size}`} className="size-price-row">
                <label>
                  Size
                  <input
                    value={row.size}
                    onChange={(event) => updateSizePriceRow(index, 'size', event.target.value)}
                    placeholder="S / M / L / 500g"
                    required
                  />
                </label>

                <label>
                  Cost Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.costPrice}
                    onChange={(event) => updateSizePriceRow(index, 'costPrice', event.target.value)}
                    required
                  />
                </label>

                <label>
                  Selling Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.sellingPrice}
                    onChange={(event) => updateSizePriceRow(index, 'sellingPrice', event.target.value)}
                    required
                  />
                </label>

                <button
                  type="button"
                  className="danger-btn size-remove-btn"
                  onClick={() => removeSizePriceRow(index)}
                  disabled={formData.sizePricing.length === 1}
                >
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
          <h3>📸 Product Images</h3>
          <p className="section-description">Add one or multiple product images. Use camera, gallery, or file upload.</p>
          <ImageUpload onImagesAdd={onImagesChange} />
        </div>

        <button className="primary-btn" type="submit" style={{ marginTop: '20px' }}>
          Add Product
        </button>
      </form>
    </section>
  );
}

export default AddProductPage;
