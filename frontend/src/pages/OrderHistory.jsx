
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const { t } = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productToAdd, setProductToAdd] = useState('');
  const [, setClock] = useState(Date.now());

  // Fetch customer orders
  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders/customer/history');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Open edit form
  const handleEdit = async (order) => {
    const orderItems = order.items || order.order_items || [];

    setSelectedOrder(order);

    setEditItems(
      orderItems.map(item => ({
        vegetable_id: item.vegetable_id,
        vegetable_name:
          item.vegetable_name || item.name || 'Vegetable',
        quantity: Number(item.quantity_value ?? item.quantity ?? 1),
        quantity_unit: item.quantity_unit || 'kg',
        price: Number(item.price || 0),
        sold_by: item.sold_by || 'weight',
        surplus_listing_id: item.surplus_listing_id || null,
        original_price: item.original_price || null
      }))
    );

    setDeliveryAddress(
      order.delivery_address || ''
    );

    setError('');
    setProductToAdd('');
    try {
      const response = await API.get('/vegetables');
      setAvailableProducts(response.data || []);
    } catch {
      setAvailableProducts([]);
    }
  };

  const addProduct = () => {
    const product = availableProducts.find(v => Number(v.vegetable_id) === Number(productToAdd));
    if (!product || editItems.some(item => Number(item.vegetable_id) === Number(product.vegetable_id))) return;
    const isPiece = product.sold_by === 'piece';
    setEditItems(prev => [...prev, {
      vegetable_id: product.vegetable_id,
      vegetable_name: product.vegetable_name,
      quantity: isPiece ? 1 : 0.25,
      quantity_unit: isPiece ? 'piece' : 'kg',
      price: Number(product.price),
      sold_by: product.sold_by,
      surplus_listing_id: null,
      original_price: null
    }]);
    setProductToAdd('');
  };

  const canModify = (order) => {
    const elapsed = Date.now() - new Date(order.order_date).getTime();
    return elapsed >= 0 && elapsed <= 6 * 60 * 60 * 1000 &&
      !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status);
  };

  const editedSubtotal = editItems.reduce((sum, item) =>
    sum + item.price * (item.quantity_unit === 'g' ? item.quantity / 1000 : item.quantity), 0);
  const editedTotal = editedSubtotal + (editedSubtotal < 199 ? 15 : 0);

  // Update product quantity
  const updateQuantity = (index, change) => {
    setEditItems(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: Math.max(
                item.quantity_unit === 'piece' ? 1 : item.quantity_unit === 'g' ? 250 : 0.25,
                Number((item.quantity + (item.quantity_unit === 'piece' ? change * 4 : item.quantity_unit === 'g' ? change * 1000 : change)).toFixed(2))
              )
            }
          : item
      )
    );
  };

  // Remove product
  const removeItem = (index) => {
    setEditItems(prev =>
      prev.filter((_, i) => i !== index)
    );
  };

  // Save edited order
  const handleSave = async () => {
    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (editItems.length === 0) {
      setError('Your order must contain at least one product.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        delivery_address: deliveryAddress.trim(),
        items: editItems.map(item => ({
          vegetable_id: item.vegetable_id,
          quantity_value: Number(item.quantity),
          quantity_unit: item.quantity_unit,
          surplus_listing_id: item.surplus_listing_id || null
        }))
      };

      await API.put(
        `/orders/customer/edit/${selectedOrder.order_id}`,
        payload
      );

      alert('Order updated successfully!');

      setSelectedOrder(null);

      await fetchOrders();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update order. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="..." />;
  }

  return (
    <div
      className="container"
      style={{
        padding: '40px 20px',
        maxWidth: '840px'
      }}
    >

      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title">
          {t('orderHistory.title')}
        </h1>

        <p className="section-subtitle">
          {t('nav.myOrders')}
        </p>
      </div>

      {orders.length === 0 ? (

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}
        >
          <ShoppingBag
            size={48}
            color="#cbd5e1"
            style={{ marginBottom: '12px' }}
          />

          <h3>{t('orderHistory.noOrders')}</h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: '#64748b',
              marginBottom: '20px'
            }}
          >
            {t('cart.emptySub')}
          </p>

          <Link
            to="/vegetables"
            className="btn btn-primary"
          >
            {t('hero.shopNow')}
          </Link>
        </div>

      ) : (

        <div>
          {orders.map((order) => (

            <div key={order.order_id}>

              <OrderCard order={order} />

              <div
                style={{
                  marginTop: '-10px',
                  marginBottom: '20px',
                  textAlign: 'right'
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={() => handleEdit(order)}
                  disabled={!canModify(order)}
                >
                  Edit Order
                </button>
                {!canModify(order) && <span style={{ marginLeft: '10px', color: '#64748b' }}>Order can no longer be modified.</span>}
              </div>

            </div>

          ))}
        </div>

      )}

      {/* EDIT ORDER MODAL */}

      {selectedOrder && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '15px'
          }}
        >

          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '550px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '25px'
            }}
          >

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2>Edit Order #{selectedOrder.order_id}</h2>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <h3>Update Products</h3>

            <div style={{ display: 'flex', gap: '8px', margin: '10px 0 14px' }}>
              <select value={productToAdd} onChange={e => setProductToAdd(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <option value="">Add a product…</option>
                {availableProducts.filter(product => !editItems.some(item => Number(item.vegetable_id) === Number(product.vegetable_id))).map(product => (
                  <option key={product.vegetable_id} value={product.vegetable_id} disabled={Number(product.quantity) <= 0}>
                    {product.vegetable_name} — ₹{product.price} ({product.quantity} available)
                  </option>
                ))}
              </select>
              <button className="btn" onClick={addProduct} disabled={!productToAdd}>Add</button>
            </div>

            {editItems.map((item, index) => (

              <div
                key={item.vegetable_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '12px 0',
                  borderBottom: '1px solid #eee'
                }}
              >

                <div style={{ flex: 1 }}>
                  <strong>{item.vegetable_name}</strong>
                  {item.surplus_listing_id && <span style={{ display: 'inline-block', marginLeft: 7, background: '#fff2cf', color: '#8a4b00', borderRadius: 12, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 800 }}>Rescue Deal</span>}
                </div>

                <button
                  onClick={() => updateQuantity(index, -0.25)}
                  disabled={
                    item.quantity <=
                    (item.quantity_unit === 'piece' ? 1 : item.quantity_unit === 'g' ? 250 : 0.25)
                  }
                >
                  <Minus size={16} />
                </button>

                <span>
                  {item.quantity} {item.quantity_unit}
                </span>

                <button
                  onClick={() => updateQuantity(index, 0.25)}
                >
                  <Plus size={16} />
                </button>

                <button
                  onClick={() => removeItem(index)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'red',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={18} />
                </button>

              </div>

            ))}

            <div style={{ marginTop: '14px', textAlign: 'right', fontWeight: 700 }}>
              New total: ₹{editedTotal.toFixed(2)}
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 400 }}>Subtotal ₹{editedSubtotal.toFixed(2)} · Delivery ₹{editedSubtotal < 199 ? '15.00' : '0.00'}. Prepaid orders must keep the same final total.</div>
            </div>

            <h3 style={{ marginTop: '20px' }}>
              Delivery Address
            </h3>

            <textarea
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginTop: '10px'
              }}
            />

            {error && (
              <p style={{ color: 'red', marginTop: '12px' }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px'
              }}
            >

              <button
                className="btn"
                onClick={() => setSelectedOrder(null)}
                disabled={saving}
                style={{ flex: 1 }}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default OrderHistory;
