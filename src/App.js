import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AppLayout from './components/AppLayout';
import { useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import HomePage from './pages/HomePage';
import AddProductPage from './pages/AddProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SalesPage from './pages/SalesPage';

function AuthLoadingScreen() {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-spinner" aria-hidden="true" />
        <h2>Checking your sign-in status...</h2>
      </section>
    </main>
  );
}

function DataLoadingScreen() {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-spinner" aria-hidden="true" />
        <h2>Loading your cloud data...</h2>
      </section>
    </main>
  );
}

function AppRoutes() {
  const { isReady } = useShop();

  if (!isReady) {
    return <DataLoadingScreen />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/add-product" element={<AddProductPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/sold" element={<SalesPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ShopProvider>
      <AppRoutes />
    </ShopProvider>
  );
}

export default App;
