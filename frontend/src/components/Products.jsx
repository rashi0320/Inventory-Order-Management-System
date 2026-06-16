import React, { useState } from 'react';

export default function Products({ products, onAdd, onUpdate, onDelete, onSearch, error, clearError }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'restock'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [restockQty, setRestockQty] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const openAddModal = () => {
    clearError();
    setModalMode('add');
    setSku('');
    setName('');
    setDescription('');
    setPrice('');
    setStock('0');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    clearError();
    setModalMode('edit');
    setSelectedProduct(product);
    setSku(product.sku);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setStock(product.stock.toString());
    setIsModalOpen(true);
  };

  const openRestockModal = (product) => {
    clearError();
    setModalMode('restock');
    setSelectedProduct(product);
    setRestockQty('10');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    clearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (modalMode === 'add') {
      onAdd({
        sku,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock)
      }, () => {
        closeModal();
      });
    } else if (modalMode === 'edit') {
      onUpdate(selectedProduct.id, {
        sku,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock)
      }, () => {
        closeModal();
      });
    } else if (modalMode === 'restock') {
      const newStock = selectedProduct.stock + parseInt(restockQty);
      onUpdate(selectedProduct.id, {
        stock: newStock
      }, () => {
        closeModal();
      });
    }
  };

  const handleDelete = (id, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      onDelete(id);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p className="page-subtitle">Track and manage catalog products, unique SKUs, and inventory levels.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          ➕ Add Product
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by product name or SKU..."
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
        {products.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: '600', color: 'var(--color-primary-light)' }}>{product.sku}</td>
                  <td style={{ fontWeight: '500' }}>{product.name}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.description || '-'}
                  </td>
                  <td>{formatCurrency(product.price)}</td>
                  <td style={{ fontWeight: '700' }}>{product.stock}</td>
                  <td>
                    {product.stock === 0 ? (
                      <span className="badge badge-danger">Out of stock</span>
                    ) : product.stock <= 5 ? (
                      <span className="badge badge-warning">Low stock</span>
                    ) : (
                      <span className="badge badge-success">In stock</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="Restock"
                        onClick={() => openRestockModal(product)}
                      >
                        ➕
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="Edit Product"
                        onClick={() => openEditModal(product)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger btn-icon-only" 
                        title="Delete Product"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No products found matching the criteria.
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? 'Add New Product' : modalMode === 'edit' ? 'Edit Product' : `Restock: ${selectedProduct?.name}`}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="error-banner">
                    ⚠️ {error}
                  </div>
                )}

                {modalMode === 'restock' ? (
                  <div className="form-group">
                    <label className="form-label">Current Stock: <strong>{selectedProduct?.stock}</strong></label>
                    <label className="form-label" htmlFor="restockQty">Quantity to Add</label>
                    <input
                      id="restockQty"
                      type="number"
                      className="form-input"
                      required
                      min="1"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="sku">Product SKU (Unique)</label>
                      <input
                        id="sku"
                        type="text"
                        className="form-input"
                        placeholder="e.g. VR-HD-001"
                        required
                        disabled={modalMode === 'edit'} // SKU is unique and typically immutable in normal flows, or we can keep it editable and let backend validate
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="name">Product Name</label>
                      <input
                        id="name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ethara VR Headset"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        className="form-input"
                        placeholder="Provide details about the product..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="price">Price ($)</label>
                        <input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-input"
                          placeholder="e.g. 599.99"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="stock">Initial Stock</label>
                        <input
                          id="stock"
                          type="number"
                          min="0"
                          className="form-input"
                          required
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Save Product' : modalMode === 'edit' ? 'Update Product' : 'Apply Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
