import React, { useState } from 'react';

export default function Orders({ orders, customers, products, onAdd, onDelete, error, clearError }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'details'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order creation form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // Array of { product_id, quantity, product }
  
  // Local state for searching products in the modal
  const [productSearch, setProductSearch] = useState('');

  const openAddModal = () => {
    clearError();
    setModalMode('add');
    setSelectedCustomerId(customers[0]?.id || '');
    setSelectedItems([]);
    setProductSearch('');
    setIsModalOpen(true);
  };

  const openDetailsModal = (order) => {
    setModalMode('details');
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    clearError();
  };

  // Add a product to the selection list or increment its count
  const handleSelectProduct = (product) => {
    if (product.stock === 0) return; // Cannot add out of stock

    const existingItem = selectedItems.find(item => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setSelectedItems(selectedItems.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setSelectedItems([...selectedItems, {
        product_id: product.id,
        quantity: 1,
        product: product
      }]);
    }
  };

  const handleQtyChange = (productId, delta, maxStock) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= maxStock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    clearError();

    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    const orderData = {
      customer_id: parseInt(selectedCustomerId),
      items: selectedItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    onAdd(orderData, () => {
      closeModal();
    });
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order? This will restore the products' stock in the inventory.")) {
      onDelete(orderId);
    }
  };

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

  // Filter products by search term in modal
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Tracking</h1>
          <p className="page-subtitle">Process customer transactions, view order statuses, and review transactional histories.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} disabled={customers.length === 0 || products.length === 0}>
          📋 Place New Order
        </button>
      </div>

      {customers.length === 0 && (
        <div className="error-banner">
          ⚠️ You must create at least one customer before you can place an order.
        </div>
      )}
      {products.length === 0 && (
        <div className="error-banner">
          ⚠️ You must create at least one product with stock before you can place an order.
        </div>
      )}

      {error && !isModalOpen && (
        <div className="error-banner">
          ⚠️ {error}
          <button style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={clearError}>✕</button>
        </div>
      )}

      <div className="table-container">
        {orders.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Order Date</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 'bold' }}>#{order.id}</td>
                  <td style={{ fontWeight: '500' }}>{order.customer.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{order.customer.email}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td style={{ fontWeight: '700' }}>{formatCurrency(order.total_price)}</td>
                  <td>
                    <span className={`badge ${
                      order.status === 'COMPLETED' ? 'badge-success' : 
                      order.status === 'PENDING' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="View Details"
                        onClick={() => openDetailsModal(order)}
                      >
                        🔍
                      </button>
                      {order.status !== 'CANCELLED' && (
                        <button 
                          className="btn btn-danger btn-icon-only" 
                          title="Cancel Order & Restore Stock"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders have been recorded. Place a new order to begin!
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className={`modal-content ${modalMode === 'add' ? 'modal-content-large' : ''}`}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? 'Place New Order' : `Order Details: #${selectedOrder?.id}`}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            {modalMode === 'add' ? (
              <form onSubmit={handleSubmitOrder}>
                <div className="modal-body">
                  {error && (
                    <div className="error-banner">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="order-builder">
                    {/* Left Panel: Customer and Product Selection */}
                    <div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="custSelect">Select Customer</label>
                        <select
                          id="custSelect"
                          className="form-input"
                          required
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                        >
                          <option value="" disabled>-- Select a customer --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Search & Click to Add Products</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search products by SKU or name..."
                          style={{ marginBottom: '10px' }}
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                        <div className="product-selector-grid">
                          {filteredProducts.map(p => (
                            <div 
                              key={p.id} 
                              className={`product-select-item ${p.stock === 0 ? 'disabled' : ''} ${selectedItems.some(i => i.product_id === p.id) ? 'selected' : ''}`}
                              onClick={() => handleSelectProduct(p)}
                              style={{ opacity: p.stock === 0 ? 0.5 : 1 }}
                            >
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  SKU: {p.sku} | Price: {formatCurrency(p.price)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                                  {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                                </span>
                              </div>
                            </div>
                          ))}
                          {filteredProducts.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              No products matching search
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Selected Items & Totals */}
                    <div style={{ display: 'flex', flexDir: 'column', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                          Cart / Order Items
                        </h4>
                        
                        <div className="selected-items-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {selectedItems.length > 0 ? (
                            selectedItems.map(item => (
                              <div className="selected-item-row" key={item.product_id}>
                                <div className="selected-item-info">
                                  <div className="selected-item-name">{item.product.name}</div>
                                  <div className="selected-item-price">
                                    {formatCurrency(item.product.price)} x {item.quantity} = {formatCurrency(parseFloat(item.product.price) * item.quantity)}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div className="quantity-control">
                                    <button 
                                      type="button" 
                                      className="quantity-btn" 
                                      onClick={() => handleQtyChange(item.product_id, -1, item.product.stock)}
                                    >
                                      -
                                    </button>
                                    <span className="quantity-val">{item.quantity}</span>
                                    <button 
                                      type="button" 
                                      className="quantity-btn" 
                                      disabled={item.quantity >= item.product.stock}
                                      onClick={() => handleQtyChange(item.product_id, 1, item.product.stock)}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-danger btn-icon-only" 
                                    onClick={() => handleRemoveItem(item.product_id)}
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                              Your cart is empty. Add items from the list on the left!
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedItems.length > 0 && (
                        <div className="summary-box">
                          <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{formatCurrency(calculateTotal())}</span>
                          </div>
                          <div className="summary-row">
                            <span>Total (Inc. Tax)</span>
                            <span>{formatCurrency(calculateTotal())}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={selectedItems.length === 0}>
                    🚀 Submit Order
                  </button>
                </div>
              </form>
            ) : (
              // Order Details Mode
              <div className="modal-body">
                {selectedOrder && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CUSTOMER</div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>{selectedOrder.customer.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedOrder.customer.email}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedOrder.customer.phone || 'No phone'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ORDER METADATA</div>
                        <div style={{ fontSize: '14px' }}>Date: {formatDate(selectedOrder.created_at)}</div>
                        <div style={{ fontSize: '14px', marginTop: '6px' }}>
                          Status:{' '}
                          <span className={`badge ${
                            selectedOrder.status === 'COMPLETED' ? 'badge-success' : 
                            selectedOrder.status === 'PENDING' ? 'badge-info' : 'badge-danger'
                          }`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>Items Summary</h4>
                    <div className="table-container" style={{ marginBottom: '20px' }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Unit Price</th>
                            <th>Qty</th>
                            <th>Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: '600', color: 'var(--color-primary-light)' }}>
                                {item.product ? item.product.sku : 'N/A'}
                              </td>
                              <td style={{ fontWeight: '500' }}>
                                {item.product ? item.product.name : `Product ID ${item.product_id}`}
                              </td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td>{item.quantity}</td>
                              <td style={{ fontWeight: '600' }}>{formatCurrency(parseFloat(item.unit_price) * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div className="summary-box" style={{ width: '250px', marginTop: 0 }}>
                        <div className="summary-row" style={{ fontWeight: '700', fontSize: '18px' }}>
                          <span>Total Paid:</span>
                          <span>{formatCurrency(selectedOrder.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {modalMode === 'details' && (
              <div className="modal-footer">
                {selectedOrder?.status !== 'CANCELLED' && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => {
                      handleCancelOrder(selectedOrder.id);
                      closeModal();
                    }}
                    style={{ marginRight: 'auto' }}
                  >
                    Cancel Order
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
