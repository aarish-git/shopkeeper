export const STORAGE_KEYS = {
  products: 'shopkeeper_products',
  cart: 'shopkeeper_cart',
  sales: 'shopkeeper_sales',
  adminPassword: 'shopkeeper_admin_password',
};

export const parseStoredData = (key, fallbackValue) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
};

export const persistStoredData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
