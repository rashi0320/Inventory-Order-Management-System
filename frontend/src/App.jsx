import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Search filter query states
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Toast notification manager
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const clearError = () => setError(null);

  // Fetch all databases from APIs
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, custRes, ordRes] = await Promise.all([
        fetch('/dashboard'),
        fetch(`/products?search=${productSearch}`),
        fetch(`/customers?search=${customerSearch}`),
        fetch('/orders')
      ]);

      if (!dashRes.ok || !prodRes.ok || !custRes.ok || !ordRes.ok) {
        throw new Error("Failed to load application data from backend.");
      }

      const dashData = await dashRes.json();
      const prodData = await prodRes.json();
      const custData = await custRes.json();
      const ordData = await ordRes.json();

      setDashboardData(dashData);
      setProducts(prodData);
      setCustomers(custData);
      setOrders(ordData);
      clearError();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not connect to the backend server.");
      addToast("Failed to fetch data from API", "error");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data whenever search query changes
  useEffect(() => {
    fetchAllData();
  }, [productSearch, customerSearch]);

  // Handle seeding database
  const handleSeedDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/seed', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        addToast("Database seeded successfully with demo data!", "success");
        fetchAllData();
      } else {
        throw new Error(data.detail || "Seeding failed.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- PRODUCT CRUD OPERATIONS ---
  const handleAddProduct = async (productData, onSuccess) => {
    try {
      const response = await fetch('/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`Product "${productData.name}" created!`, "success");
        fetchAllData();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.detail || "Failed to create product.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  const handleUpdateProduct = async (id, updatedData, onSuccess) => {
    try {
      const response = await fetch(`/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (response.ok) {
        addToast("Product updated successfully!", "success");
        fetchAllData();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.detail || "Failed to update product.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        addToast("Product deleted successfully!", "success");
        fetchAllData();
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete product.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  // --- CUSTOMER CRUD OPERATIONS ---
  const handleAddCustomer = async (customerData, onSuccess) => {
    try {
      const response = await fetch('/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`Customer "${customerData.name}" added!`, "success");
        fetchAllData();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.detail || "Failed to add customer.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  const handleUpdateCustomer = async (id, updatedData, onSuccess) => {
    try {
      const response = await fetch(`/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (response.ok) {
        addToast("Customer updated successfully!", "success");
        fetchAllData();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.detail || "Failed to update customer.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      const response = await fetch(`/customers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        addToast("Customer deleted successfully!", "success");
        fetchAllData();
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete customer.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  // --- ORDER CRU OPERATIONS ---
  const handlePlaceOrder = async (orderData, onSuccess) => {
    try {
      const response = await fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`Order #${data.id} placed successfully!`, "success");
        fetchAllData();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.detail || "Failed to place order.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await fetch(`/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        addToast(`Order #${orderId} cancelled & deleted!`, "success");
        fetchAllData();
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to cancel/delete order.");
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };

  // Helper for quick restock from dashboard
  const handleQuickRestockClick = async (product) => {
    const qty = window.prompt(`How many items of "${product.name}" (SKU: ${product.sku}) would you like to add?`, "10");
    if (qty === null) return;
    
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      alert("Invalid restock quantity.");
      return;
    }

    handleUpdateProduct(product.id, {
      stock: product.stock + parsedQty
    });
  };

  // Include products with stock <= 5 to show on Dashboard
  const lowStockItems = products.filter(p => p.stock <= 5);
  const dashboardWithAlerts = dashboardData ? { ...dashboardData, low_stock_items: lowStockItems } : null;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">E</div>
          <div>
            <div className="logo-text">Ethara.AI</div>
            <div className="logo-tag">Inventory Hub</div>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            <li 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span> Dashboard
            </li>
            <li 
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span className="nav-icon">📦</span> Products
            </li>
            <li 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <span className="nav-icon">👥</span> Customers
            </li>
            <li 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="nav-icon">📋</span> Orders
            </li>
          </ul>
        </nav>

        {/* Database Seeder Button in Sidebar for convenience */}
        <div style={{ marginTop: '24px', padding: '12px 0' }}>
          {products.length === 0 && customers.length === 0 && (
            <button className="btn btn-success" style={{ width: '100%', fontSize: '12px' }} onClick={handleSeedDatabase}>
              🌱 Seed Demo Data
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <div>Assessment App v1.0</div>
          <div>Ethara.AI Engineering</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {loading && !dashboardData && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '18px', color: 'var(--text-secondary)' }}>
            ⚡ Connecting to Ethara.AI Hub...
          </div>
        )}

        {!loading && error && products.length === 0 && (
          <div style={{ maxWidth: '600px', margin: '80px auto', padding: '40px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <span style={{ fontSize: '48px' }}>📡</span>
            <h2 style={{ marginTop: '20px', color: 'var(--color-danger)' }}>Connection Offline</h2>
            <p style={{ margin: '16px 0', color: 'var(--text-secondary)' }}>
              Could not establish connection to the FastAPI backend service. Make sure it is running on port 8080.
            </p>
            <button className="btn btn-primary" onClick={fetchAllData}>
              🔄 Try Reconnecting
            </button>
          </div>
        )}

        {(dashboardData || products.length > 0) && (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={dashboardWithAlerts} 
                onNavigate={setActiveTab}
                onRestockClick={handleQuickRestockClick}
              />
            )}
            
            {activeTab === 'products' && (
              <Products 
                products={products}
                onAdd={handleAddProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onSearch={setProductSearch}
                error={error}
                clearError={clearError}
              />
            )}

            {activeTab === 'customers' && (
              <Customers 
                customers={customers}
                orders={orders}
                onAdd={handleAddCustomer}
                onUpdate={handleUpdateCustomer}
                onDelete={handleDeleteCustomer}
                onSearch={setCustomerSearch}
                error={error}
                clearError={clearError}
              />
            )}

            {activeTab === 'orders' && (
              <Orders 
                orders={orders}
                customers={customers}
                products={products}
                onAdd={handlePlaceOrder}
                onDelete={handleDeleteOrder}
                error={error}
                clearError={clearError}
              />
            )}
          </>
        )}
      </main>

      {/* Toast Alert Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
