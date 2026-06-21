import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, useShop } from '../context/ShopContext';
import './ProductsPage.css';

function ProductsPage() {
  const { products, addToCart, categories } = useShop();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [selectedSizeByProduct, setSelectedSizeByProduct] = useState({});

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      // keyword search
      if (keyword) {
        const name = String(product.name || '').toLowerCase();
        const rateType = String(product.rateType || '').toLowerCase();
        const stock = String(product.quantity ?? '');
        const legacySize = String(product.size || '').toLowerCase();
        const category = String(product.category || '').toLowerCase();
        const sizeList = Array.isArray(product.sizePricing)
          ? product.sizePricing.map((row) => String(row?.size || '').toLowerCase()).join(' ')
          : '';
        const matches =
          name.includes(keyword) ||
          rateType.includes(keyword) ||
          stock.includes(keyword) ||
          legacySize.includes(keyword) ||
          sizeList.includes(keyword) ||
          category.includes(keyword);
        if (!matches) return false;
      }

      // category filter
      if (categoryFilter && String(product.category || '') !== categoryFilter) return false;

      // stock filter
      if (stockFilter === 'in' && Number(product.quantity) < 1) return false;
      if (stockFilter === 'out' && Number(product.quantity) > 0) return false;

      return true;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const getSizeOptions = (product) => {
    if (Array.isArray(product.sizePricing) && product.sizePricing.length) {
      return product.sizePricing.filter(
        (row) => row && row.size && Number.isFinite(Number(row.costPrice)) && Number.isFinite(Number(row.sellingPrice))
      );
    }

    return [
      {
        size: product.size || 'Default',
        costPrice: Number(product.costPrice || 0),
        sellingPrice: Number(product.sellingPrice || 0),
      },
    ];
  };

  const getSelectedSizeOption = (product) => {
    const options = getSizeOptions(product);
    const selectedSize = selectedSizeByProduct[product.id];
    return options.find((row) => row.size === selectedSize) || options[0];
  };

  const buyNow = (product) => {
    const selected = getSelectedSizeOption(product);
    const added = addToCart(product, selected.size);
    if (added) {
      navigate('/cart');
    }
  };

  const getProductImages = (product) => {
    // Support both old single image and new multiple images
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product.image) {
      return [product.image];
    }
    return [];
  };

  const getDisplayImage = (product) => {
    const images = getProductImages(product);
    if (!images.length) return null;
    const index = selectedImageIndex[product.id] || 0;
    return images[index];
  };

  const cycleImage = (product, direction) => {
    const images = getProductImages(product);
    if (images.length <= 1) return;

    const currentIndex = selectedImageIndex[product.id] || 0;
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % images.length;
    } else {
      newIndex = (currentIndex - 1 + images.length) % images.length;
    }

    setSelectedImageIndex((prev) => ({ ...prev, [product.id]: newIndex }));
  };

  return (
    <section className="card">
      <h2>All Products</h2>
      {!products.length ? <p>No products yet. Add your first product.</p> : null}

      {products.length ? (
        <div className="products-search-wrap">
          <div className="search-filter-bar">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, size, rate type, or stock"
              className="products-search"
              aria-label="Search products"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter by stock"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            {(searchTerm || categoryFilter || stockFilter !== 'all') && (
              <button
                type="button"
                className="secondary-btn filter-clear-btn"
                onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStockFilter('all'); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : null}

      {products.length && !filteredProducts.length ? <p>No products match "{searchTerm}".</p> : null}

      <div className="products-grid">
        {filteredProducts.map((product) => {
          const images = getProductImages(product);
          const displayImage = getDisplayImage(product);
          const currentImageIndex = selectedImageIndex[product.id] || 0;
          const sizeOptions = getSizeOptions(product);
          const selectedOption = getSelectedSizeOption(product);

          return (
            <article key={product.id} className="product-card">
              <div className="product-image-container">
                {displayImage ? (
                  <>
                    <img src={displayImage} alt={product.name} className="product-image" />
                    {images.length > 1 && (
                      <>
                        <button
                          className="image-nav-btn prev"
                          onClick={() => cycleImage(product, 'prev')}
                          title="Previous image"
                        >
                          ❮
                        </button>
                        <button
                          className="image-nav-btn next"
                          onClick={() => cycleImage(product, 'next')}
                          title="Next image"
                        >
                          ❯
                        </button>
                        <div className="image-counter">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="no-image-placeholder">📷 No Image</div>
                )}
              </div>

              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex((prev) => ({ ...prev, [product.id]: index }))}
                      title={`Image ${index + 1}`}
                    >
                      ●
                    </button>
                  ))}
                </div>
              )}

              <h3>{product.name}</h3>
              <p>Stock: {product.quantity}</p>
              {sizeOptions.length > 1 ? (
                <label className="size-select-label">
                  Size
                  <select
                    value={selectedOption.size}
                    onChange={(event) =>
                      setSelectedSizeByProduct((prev) => ({
                        ...prev,
                        [product.id]: event.target.value,
                      }))
                    }
                  >
                    {sizeOptions.map((option) => (
                      <option key={`${product.id}-${option.size}`} value={option.size}>
                        {option.size}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p>Size: {selectedOption.size}</p>
              )}
              <p>Cost: {formatCurrency(selectedOption.costPrice)}</p>
              <p>Selling: {formatCurrency(selectedOption.sellingPrice)}</p>
              {product.rateType ? (
                <p>
                  Rate: {product.rateType} {product.rateValue ? `(${product.rateValue})` : ''}
                </p>
              ) : null}

              <div className="btn-row">
                <button className="primary-btn" type="button" onClick={() => addToCart(product, selectedOption.size)}>
                  Add to Cart
                </button>
                <button className="secondary-btn" type="button" onClick={() => buyNow(product)}>
                  Buy Now
                </button>
                <button className="secondary-btn" type="button" onClick={() => navigate(`/products/${product.id}`)}>
                  View / Edit
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ProductsPage;
