import React, { useState } from 'react';

export default function Customers({ customers, onAdd, onUpdate, onDelete, onSearch, error, clearError, orders }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'history'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const openAddModal = () => {
    clearError();
    setModalMode('add');
    setName('');
    setEmail('');
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    clearError();
    setModalMode('edit');
    setSelectedCustomer(customer);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone || '');
    setIsModalOpen(true);
  };

  const openHistoryModal = (customer) => {
    clearError();
    setModalMode('history');
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    clearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (modalMode === 'add') {
      onAdd({
        name,
        email,
        phone
      }, () => {
        closeModal();
      });
    } else if (modalMode === 'edit') {
      onUpdate(selectedCustomer.id, {
        name,
        email,
        phone
      }, () => {
        closeModal();
      });
    }
  };

  const handleDelete = (id, customerName) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"? This will fail if the customer has order history.`)) {
      onDelete(id);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  // Filter orders for the selected customer
  const customerOrders = selectedCustomer 
    ? orders.filter(o => o.customer_id === selectedCustomer.id) 
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers Directory</h1>
          <p className="page-subtitle">Manage customer profiles, contact info, and track order histories.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          👥 Add Customer
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {error && !isModalOpen && (
        <div className="error-banner">
          ⚠️ {error}
          <button style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={clearError}>✕</button>
        </div>
      )}

      <div className="table-container">
        {customers.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registered Date</th>
                <th>Orders placed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const orderCount = orders.filter(o => o.customer_id === customer.id).length;
                return (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 'bold' }}>#{customer.id}</td>
                    <td style={{ fontWeight: '500' }}>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{customer.phone || '-'}</td>
                    <td>{formatDate(customer.created_at)}</td>
                    <td>
                      <span className="badge badge-info">{orderCount} orders</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary btn-icon-only" 
                          title="View Order History"
                          onClick={() => openHistoryModal(customer)}
                        >
                          📜
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon-only" 
                          title="Edit Customer"
                          onClick={() => openEditModal(customer)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-danger btn-icon-only" 
                          title="Delete Customer"
                          onClick={() => handleDelete(customer.id, customer.name)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No customers found matching the criteria.
          </div>
        )}
      </div>

      {/* Modal dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? 'Add New Customer' : modalMode === 'edit' ? 'Edit Customer' : `Order History: ${selectedCustomer?.name}`}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            {modalMode === 'history' ? (
              <div className="modal-body">
                {customerOrders.length > 0 ? (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Items</th>
                          <th>Total Amount</th>
                          <th>Order Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map(order => (
                          <tr key={order.id}>
                            <td style={{ fontWeight: 'bold' }}>#{order.id}</td>
                            <td>
                              <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '13px' }}>
                                {order.items.map(item => (
                                  <li key={item.id}>
                                    • {item.product ? item.product.name : `Product ID ${item.product_id}`} x {item.quantity}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td style={{ fontWeight: '600' }}>{formatCurrency(order.total_price)}</td>
                            <td>{formatDate(order.created_at)}</td>
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
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No orders have been placed by this customer yet.
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ maxWidth: '550px', margin: '0 auto' }}>
                  {error && (
                    <div className="error-banner">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="custName">Customer Name</label>
                    <input
                      id="custName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custEmail">Email Address (Unique)</label>
                    <input
                      id="custEmail"
                      type="email"
                      className="form-input"
                      placeholder="e.g. john.doe@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custPhone">Phone Number</label>
                    <input
                      id="custPhone"
                      type="text"
                      className="form-input"
                      placeholder="e.g. +1-555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalMode === 'add' ? 'Save Customer' : 'Update Customer'}
                  </button>
                </div>
              </form>
            )}
            
            {modalMode === 'history' && (
              <div className="modal-footer">
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
