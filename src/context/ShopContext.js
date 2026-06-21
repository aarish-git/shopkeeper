import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../utils/firebase';
import { parseStoredData, persistStoredData, STORAGE_KEYS } from '../utils/storage';

const ShopContext = createContext(null);
const DEFAULT_ADMIN_PASSWORD = 'admin';

const getDefaultForm = () => ({
  name: '',
  quantity: '',
  rateType: '',
  rateValue: '',
  category: '',
  sizePricing: [{ size: '', costPrice: '', sellingPrice: '' }],
  images: [],
});

const getNormalizedSizePricing = (rows = []) =>
  rows
    .map((row) => ({
      size: String(row.size || '').trim(),
      costPrice: Number(row.costPrice),
      sellingPrice: Number(row.sellingPrice),
    }))
    .filter((row) => row.size && Number.isFinite(row.costPrice) && Number.isFinite(row.sellingPrice));

const getWindowStartDate = (filter) => {
  const now = new Date();
  const start = new Date(now);

  if (filter === 'TODAY') {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter === 'WEEK') {
    start.setDate(now.getDate() - 7);
    return start;
  }

  if (filter === 'MONTH') {
    start.setMonth(now.getMonth() - 1);
    return start;
  }

  if (filter === 'YEAR') {
    start.setFullYear(now.getFullYear() - 1);
    return start;
  }

  return null;
};

const getSaleLineAmount = (line, key) => Number(line[key] || 0) * Number(line.quantity || 0);
const BACKUP_SCHEMA_VERSION = 1;

const sanitizeForFirestore = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, sanitizeForFirestore(entryValue)])
    );
  }

  return value;
};

const loadLocalState = () => {
  if (typeof window === 'undefined') {
    return { products: [], cartItems: [], sales: [], adminPassword: DEFAULT_ADMIN_PASSWORD };
  }

  return {
    products: parseStoredData(STORAGE_KEYS.products, []),
    cartItems: parseStoredData(STORAGE_KEYS.cart, []),
    sales: parseStoredData(STORAGE_KEYS.sales, []),
    adminPassword: parseStoredData(STORAGE_KEYS.adminPassword, DEFAULT_ADMIN_PASSWORD),
    categories: parseStoredData(STORAGE_KEYS.categories, []),
  };
};

const persistLocalState = (nextState) => {
  if (typeof window === 'undefined') {
    return;
  }

  persistStoredData(STORAGE_KEYS.products, nextState.products);
  persistStoredData(STORAGE_KEYS.cart, nextState.cartItems);
  persistStoredData(STORAGE_KEYS.sales, nextState.sales);
  persistStoredData(STORAGE_KEYS.adminPassword, nextState.adminPassword);
  persistStoredData(STORAGE_KEYS.categories, nextState.categories || []);
};

export const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState(getDefaultForm());
  const [salesFilter, setSalesFilter] = useState('TODAY');
  const [adminPassword, setAdminPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  const remoteDocRef = useMemo(() => {
    if (!user || !db) {
      return null;
    }

    return doc(db, 'users', user.uid, 'shopData', 'main');
  }, [user]);

  const persistRemoteState = (nextState) => {
    if (!remoteDocRef || !user) {
      return;
    }

    void setDoc(
      remoteDocRef,
      sanitizeForFirestore({
        products: nextState.products,
        cartItems: nextState.cartItems,
        sales: nextState.sales,
        adminPassword: nextState.adminPassword,
        categories: nextState.categories || [],
        ownerUid: user.uid,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  };

  const commitState = (nextState) => {
    const nextProducts = Array.isArray(nextState.products) ? nextState.products : products;
    const nextCartItems = Array.isArray(nextState.cartItems) ? nextState.cartItems : cartItems;
    const nextSales = Array.isArray(nextState.sales) ? nextState.sales : sales;
    const nextAdminPassword =
      typeof nextState.adminPassword === 'string' && nextState.adminPassword.trim()
        ? nextState.adminPassword.trim()
        : adminPassword;
    const nextCategories = Array.isArray(nextState.categories) ? nextState.categories : categories;

    setProducts(nextProducts);
    setCartItems(nextCartItems);
    setSales(nextSales);
    setAdminPassword(nextAdminPassword);
    setCategories(nextCategories);

    const dataToPersist = {
      products: nextProducts,
      cartItems: nextCartItems,
      sales: nextSales,
      adminPassword: nextAdminPassword,
      categories: nextCategories,
    };
    if (remoteDocRef) {
      persistRemoteState(dataToPersist);
    } else {
      persistLocalState(dataToPersist);
    }
  };

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setCartItems([]);
      setSales([]);
      setAdminPassword(DEFAULT_ADMIN_PASSWORD);
      setCategories([]);
      setIsReady(false);
      return undefined;
    }

    if (!remoteDocRef) {
      const localState = loadLocalState();
      setProducts(localState.products);
      setCartItems(localState.cartItems);
      setSales(localState.sales);
      setAdminPassword(localState.adminPassword || DEFAULT_ADMIN_PASSWORD);
      setCategories(localState.categories || []);
      setIsReady(true);
      setMessage('Running in offline mode. Data is saved on this device.');
      return undefined;
    }

    setIsReady(false);
    const unsubscribe = onSnapshot(
      remoteDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          void setDoc(
            remoteDocRef,
            {
              products: [],
              cartItems: [],
              sales: [],
              adminPassword: DEFAULT_ADMIN_PASSWORD,
              categories: [],
              ownerUid: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          setProducts([]);
          setCartItems([]);
          setSales([]);
          setAdminPassword(DEFAULT_ADMIN_PASSWORD);
          setCategories([]);
          setIsReady(true);
          return;
        }

        const nextData = snapshot.data();
        setProducts(Array.isArray(nextData.products) ? nextData.products : []);
        setCartItems(Array.isArray(nextData.cartItems) ? nextData.cartItems : []);
        setSales(Array.isArray(nextData.sales) ? nextData.sales : []);
        setAdminPassword(
          typeof nextData.adminPassword === 'string' && nextData.adminPassword.trim()
            ? nextData.adminPassword.trim()
            : DEFAULT_ADMIN_PASSWORD
        );
        setCategories(Array.isArray(nextData.categories) ? nextData.categories : []);
        setIsReady(true);
      },
      () => {
        setMessage('Could not load your cloud data.');
        setIsReady(true);
      }
    );

    return unsubscribe;
  }, [user, remoteDocRef]);

  const persistProducts = (value) => {
    commitState({ products: value });
  };

  const persistCart = (value) => {
    commitState({ cartItems: value });
  };

  const persistSales = (value) => {
    commitState({ sales: value });
  };

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onImagesChange = (images) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const addSizePriceRow = () => {
    setFormData((prev) => ({
      ...prev,
      sizePricing: [...prev.sizePricing, { size: '', costPrice: '', sellingPrice: '' }],
    }));
  };

  const removeSizePriceRow = (index) => {
    setFormData((prev) => {
      const nextRows = prev.sizePricing.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        sizePricing: nextRows.length ? nextRows : [{ size: '', costPrice: '', sellingPrice: '' }],
      };
    });
  };

  const updateSizePriceRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sizePricing: prev.sizePricing.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const next = [...categories, trimmed];
    commitState({ categories: next });
  };

  const addProduct = (event) => {
    event.preventDefault();

    const quantity = Number(formData.quantity);
    const sizePricing = getNormalizedSizePricing(formData.sizePricing);

    if (!formData.name.trim()) {
      setMessage('Product name is required.');
      return false;
    }

    if (!quantity || quantity < 1) {
      setMessage('Quantity should be at least 1.');
      return false;
    }

    if (!sizePricing.length) {
      setMessage('Add at least one valid size with cost and selling price.');
      return false;
    }

    const hasNegativePrice = sizePricing.some((row) => row.costPrice < 0 || row.sellingPrice < 0);
    if (hasNegativePrice) {
      setMessage('Cost and selling prices must be positive numbers.');
      return false;
    }

    const defaultPrice = sizePricing[0];

    const product = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category ? formData.category.trim() : '',
      quantity,
      rateType: formData.rateType,
      rateValue: formData.rateValue ? Number(formData.rateValue) : null,
      sizePricing,
      costPrice: defaultPrice.costPrice,
      sellingPrice: defaultPrice.sellingPrice,
      size: defaultPrice.size,
      images: formData.images || [],
      createdAt: new Date().toISOString(),
    };

    persistProducts([...products, product]);
    setFormData(getDefaultForm());
    setMessage('Product added successfully.');
    return true;
  };

  const addToCart = (product, selectedSize) => {
    if (product.quantity < 1) {
      setMessage('No stock available for this product.');
      return false;
    }

    const normalizedSizes = getNormalizedSizePricing(product.sizePricing || []);
    const fallbackSize = {
      size: product.size || 'Default',
      costPrice: Number(product.costPrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
    };
    const sizeOptions = normalizedSizes.length ? normalizedSizes : [fallbackSize];
    const sizeInfo = sizeOptions.find((row) => row.size === selectedSize) || sizeOptions[0];

    const existing = cartItems.find((item) => item.productId === product.id && item.size === sizeInfo.size);

    if (existing) {
      const productInCartQty = cartItems
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

      if (productInCartQty >= product.quantity) {
        setMessage('Cannot add more than available stock.');
        return false;
      }

      const updated = cartItems.map((item) =>
        item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      persistCart(updated);
      setMessage('Cart quantity increased.');
      return true;
    }

    const productInCartQty = cartItems
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (productInCartQty >= product.quantity) {
      setMessage('Cannot add more than available stock.');
      return false;
    }

    const nextCart = [
      ...cartItems,
      {
        id: `cart-${Date.now()}`,
        productId: product.id,
        name: product.name,
        image: (product.images && product.images[0]) || product.image,
        quantity: 1,
        size: sizeInfo.size,
        costPrice: sizeInfo.costPrice,
        sellingPrice: sizeInfo.sellingPrice,
      },
    ];

    persistCart(nextCart);
    setMessage('Product added to cart.');
    return true;
  };

  const updateCartQuantity = (cartItemId, value) => {
    const nextQuantity = Number(value);
    if (!nextQuantity || nextQuantity < 1) {
      return;
    }

    const currentLine = cartItems.find((item) => item.id === cartItemId);
    if (!currentLine) {
      return;
    }

    const source = products.find((product) => product.id === currentLine.productId);
    const otherCartQty = cartItems
      .filter((item) => item.productId === currentLine.productId && item.id !== cartItemId)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (!source || nextQuantity + otherCartQty > source.quantity) {
      setMessage('Quantity exceeds available stock.');
      return;
    }

    const updated = cartItems.map((item) =>
      item.id === cartItemId ? { ...item, quantity: nextQuantity } : item
    );
    persistCart(updated);
  };

  const updateCartSellingPrice = (cartItemId, value) => {
    const nextPrice = Number(value);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      return;
    }

    const updated = cartItems.map((item) =>
      item.id === cartItemId ? { ...item, sellingPrice: nextPrice } : item
    );
    persistCart(updated);
  };

  const removeFromCart = (cartItemId) => {
    persistCart(cartItems.filter((item) => item.id !== cartItemId));
  };

  const getProductById = (productId) => products.find((product) => product.id === productId);

  const updateProduct = (productId, nextData) => {
    const current = getProductById(productId);
    if (!current) {
      setMessage('Product not found.');
      return false;
    }

    const quantity = Number(nextData.quantity);
    const sizePricing = getNormalizedSizePricing(nextData.sizePricing);

    if (!String(nextData.name || '').trim()) {
      setMessage('Product name is required.');
      return false;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      setMessage('Quantity must be 0 or more.');
      return false;
    }

    if (!sizePricing.length) {
      setMessage('Add at least one valid size with cost and selling price.');
      return false;
    }

    if (sizePricing.some((row) => row.costPrice < 0 || row.sellingPrice < 0)) {
      setMessage('Cost and selling prices must be positive numbers.');
      return false;
    }

    const defaultPrice = sizePricing[0];
    const updatedProduct = {
      ...current,
      name: String(nextData.name || '').trim(),
      quantity,
      rateType: nextData.rateType || '',
      rateValue: nextData.rateValue ? Number(nextData.rateValue) : null,
      sizePricing,
      costPrice: defaultPrice.costPrice,
      sellingPrice: defaultPrice.sellingPrice,
      size: defaultPrice.size,
      images: Array.isArray(nextData.images) ? nextData.images : current.images || [],
    };

    const priceBySize = new Map(sizePricing.map((row) => [row.size, row]));
    const updatedCart = cartItems.map((item) => {
      if (item.productId !== productId) {
        return item;
      }

      const linePrice = priceBySize.get(item.size) || defaultPrice;
      return {
        ...item,
        name: updatedProduct.name,
        costPrice: linePrice.costPrice,
        sellingPrice: linePrice.sellingPrice,
      };
    });

    persistProducts(products.map((product) => (product.id === productId ? updatedProduct : product)));
    persistCart(updatedCart);
    setMessage('Product updated successfully.');
    return true;
  };

  const deleteProduct = (productId) => {
    if (!getProductById(productId)) {
      setMessage('Product not found.');
      return false;
    }

    persistProducts(products.filter((product) => product.id !== productId));
    persistCart(cartItems.filter((item) => item.productId !== productId));
    setMessage('Product deleted successfully.');
    return true;
  };

  const markAsSold = () => {
    if (!cartItems.length) {
      setMessage('Cart is empty.');
      return false;
    }

    const saleRecord = {
      id: `sale-${Date.now()}`,
      soldAt: new Date().toISOString(),
      items: cartItems.map((item) => ({ ...item })),
    };

    persistSales([saleRecord, ...sales]);

    const updatedProducts = products.map((product) => {
      const soldQty = cartItems
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

      if (!soldQty) {
        return product;
      }

      return {
        ...product,
        quantity: Math.max(0, product.quantity - soldQty),
      };
    });

    commitState({
      sales: [saleRecord, ...sales],
      products: updatedProducts,
      cartItems: [],
    });
    setMessage('All cart items marked as sold.');
    return true;
  };

  const clearTodaySales = () => {
    const todayStart = getWindowStartDate('TODAY');
    const nextSales = sales.filter((sale) => new Date(sale.soldAt) < todayStart);

    if (nextSales.length === sales.length) {
      setMessage('No sales found for today.');
      return false;
    }

    persistSales(nextSales);
    setMessage('Today sales have been reset.');
    return true;
  };

  const filteredSales = useMemo(() => {
    const startDate = getWindowStartDate(salesFilter);
    if (!startDate) {
      return sales;
    }

    return sales.filter((sale) => new Date(sale.soldAt) >= startDate);
  }, [sales, salesFilter]);

  const soldLines = useMemo(
    () => filteredSales.flatMap((sale) => sale.items.map((item) => ({ ...item, soldAt: sale.soldAt }))),
    [filteredSales]
  );

  const totals = useMemo(() => {
    const totalCost = soldLines.reduce((sum, line) => sum + getSaleLineAmount(line, 'costPrice'), 0);
    const totalSelling = soldLines.reduce((sum, line) => sum + getSaleLineAmount(line, 'sellingPrice'), 0);
    return {
      totalCost,
      totalSelling,
      totalProfit: totalSelling - totalCost,
    };
  }, [soldLines]);

  const clearMessage = () => setMessage('');

  const updateAdminPassword = (currentPasswordInput, nextPasswordInput) => {
    if (String(currentPasswordInput || '') !== adminPassword) {
      setMessage('Current admin password is incorrect.');
      return false;
    }

    const trimmedNext = String(nextPasswordInput || '').trim();
    if (trimmedNext.length < 4) {
      setMessage('New admin password must be at least 4 characters.');
      return false;
    }

    commitState({ adminPassword: trimmedNext });
    setMessage('Admin password updated successfully.');
    return true;
  };

  const exportBackupData = () => {
    try {
      const payload = {
        app: 'shopkeeper',
        schemaVersion: BACKUP_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
          products,
          cartItems,
          sales,
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

      link.href = objectUrl;
      link.download = `shopkeeper-backup-${stamp}.json`;
      link.click();
      URL.revokeObjectURL(objectUrl);

      setMessage('Backup file downloaded successfully.');
      return true;
    } catch (error) {
      setMessage('Could not export backup. Please try again.');
      return false;
    }
  };

  const importBackupData = async (file) => {
    if (!file) {
      setMessage('Please choose a backup file.');
      return false;
    }

    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText);
      const backupData = parsed && parsed.data ? parsed.data : parsed;

      if (!backupData || !Array.isArray(backupData.products) || !Array.isArray(backupData.cartItems) || !Array.isArray(backupData.sales)) {
        setMessage('Invalid backup file format.');
        return false;
      }

      persistProducts(backupData.products);
      persistCart(backupData.cartItems);
      persistSales(backupData.sales);

      setMessage('Backup restored successfully.');
      return true;
    } catch (error) {
      setMessage('Could not restore backup. Please verify the file and try again.');
      return false;
    }
  };

  const value = {
    products,
    cartItems,
    isReady,
    formData,
    categories,
    salesFilter,
    setSalesFilter,
    adminPassword,
    soldLines,
    totals,
    message,
    clearMessage,
    onInputChange,
    onImagesChange,
    addSizePriceRow,
    removeSizePriceRow,
    updateSizePriceRow,
    addCategory,
    addProduct,
    addToCart,
    updateCartQuantity,
    updateCartSellingPrice,
    removeFromCart,
    getProductById,
    updateProduct,
    deleteProduct,
    markAsSold,
    clearTodaySales,
    updateAdminPassword,
    exportBackupData,
    importBackupData,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return context;
};
