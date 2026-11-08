
import React, { useEffect, useState } from 'react';

const EditOrder = ({ order, token, onClose, onUpdated }) => {
  const existingItems = order.items || order.order_items || [];

  const [items, setItems] = useState(
    existingItems.map(item => ({
      vegetable_id: Number(item.vegetable_id),
      vegetable_name: item.vegetable_name || item.name || 'Vegetable',
      quantity_unit: item.quantity_unit || 'kg',
      quantity_value: Number(
        item.quantity_value ?? item.quantity ?? 1
      )
    }))
  );

  const [address, setAddress] = useState(
    order.delivery_address || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateQuantity = (index, value) => {
    setItems(previous =>
      previous.map((item, i) =>
        i === index
          ? { ...item, quantity_value: value }
          : item
      )
    );
  };

  const removeItem = (index) => {
    setItems(previous =>
      previous.filter((_, i) => i !== index)
    );
  };

  const handleSave = async () => {
    setError('');

    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (items.length === 0) {
      setError('Your order must contain at least one product.');
      return;
    }

    if (items.some(item =>
      !Number.isFinite(Number(item.quantity_value)) ||
      Number(item.quantity_value) <= 0
    )) {
      setError('Please enter valid product quantities.');
      return;
    }

    const payload = {
      delivery_address: address.trim(),
      items: items.map(item => ({
        vegetable_id: item.vegetable_id,
        quantity_unit: item.quantity_unit,
        quantity_value: Number(item.quantity_value)
      }))
    };

    try {
      setLoading(true);

      const response = await fetch(
        `/api/orders/customer/edit/${order.order_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to update your order.'
        );
      }

      alert('Order updated successfully!');

      if (onUpdated) {
        await onUpdated();
      }

      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-order-modal">
      <div className="edit-order-content">

        <h2>Edit Your Order</h2>

        <p>Order ID: {order.order_id}</p>

        <h3>Update Product Quantities</h3>

        {items.map((item, index) => (
          <div key={item.vegetable_id} className="edit-order-item">

            <span>{item.vegetable_name}</span>

            <input
              type="number"
              min={item.quantity_unit === 'dozen' ? '0.5' : '0.01'}
              step={
              item.quantity_unit === 'piece' ? '1' : item.quantity_unit === 'dozen' ? '0.5' :
                item.quantity_unit === 'g' ? '1' : '0.25'
              }
              value={item.quantity_value}
              onChange={e =>
                updateQuantity(index, e.target.value)
              }
            />

            <span>{item.quantity_unit}</span>

            <button
              type="button"
              onClick={() => removeItem(index)}
            >
              Remove
            </button>

          </div>
        ))}

        <h3>Delivery Address</h3>

        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Enter your delivery address"
          rows="3"
        />

        {error && (
          <p style={{ color: 'red' }}>{error}</p>
        )}

        <div className="edit-order-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditOrder;
