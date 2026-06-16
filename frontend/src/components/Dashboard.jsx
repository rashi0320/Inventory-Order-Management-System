import React from 'react';

export default function Dashboard({ data, onNavigate, onRestockClick }) {
  if (!data) return <div className="loading">Loading dashboard metrics...</div>;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Revenue</h3>
            <div className="metric-value">{formatCurrency(data.total_revenue)}</div>
          </div>
          <div className="metric-icon green">💵</div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Products</h3>
            <div className="metric-value">{data.total_products}</div>
          </div>
          <div className="metric-icon blue">📦</div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Customers</h3>
            <div className="metric-value">{data.total_customers}</div>
          </div>
          <div className="metric-icon purple">👥</div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Orders</h3>
            <div className="metric-value">{data.total_orders}</div>
          </div>
          <div className="metric-icon blue">📋</div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Low Stock Items</h3>
            <div className="metric-value" style={{ color: data.low_stock_count > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {data.low_stock_count}
            </div>
          </div>
          <div className="metric-icon amber">⚠️</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Recent Orders</h3>
            <button className="btn btn-secondary" onClick={() => onNavigate('orders')}>
              View All Orders
            </button>
          </div>
          <div className="table-container">
            {data.recent_orders && data.recent_orders.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 'bold' }}>#{order.id}</td>
                      <td>{order.customer.name}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{formatCurrency(order.total_price)}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'COMPLETED' ? 'badge-success' : 
                          order.status === 'PENDING' ? 'badge-info' : 'badge-danger'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '24px', textAlignment: 'center', color: 'var(--text-secondary)' }}>
                No orders placed yet.
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Low Stock Alerts</h3>
            <button className="btn btn-secondary" onClick={() => onNavigate('products')}>
              Manage Stock
            </button>
          </div>
          <div className="alert-list">
            {/* Products are passed or we can filter in the App.jsx */}
            {data.low_stock_items && data.low_stock_items.length > 0 ? (
              data.low_stock_items.map((prod) => (
                <div className="alert-item" key={prod.id}>
                  <div className="alert-item-content">
                    <div className="alert-item-title">{prod.name}</div>
                    <div className="alert-item-meta">SKU: {prod.sku}</div>
                  </div>
                  <div className="alert-item-badge">
                    {prod.stock} left
                  </div>
                  <button 
                    className="btn btn-secondary btn-icon-only" 
                    title="Quick Restock"
                    onClick={() => onRestockClick(prod)}
                  >
                    ➕
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                ✅ All inventory levels are healthy!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
