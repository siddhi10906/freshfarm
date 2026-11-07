const crypto = require('crypto');
const db = require('../config/db');

const apiBase = 'https://api.razorpay.com/v1';

function gatewayCredentials() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.');
  }
  return { keyId: RAZORPAY_KEY_ID, secret: RAZORPAY_KEY_SECRET };
}

async function razorpayRequest(path, method = 'GET', payload) {
  const { keyId, secret } = gatewayCredentials();
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
      ...(payload ? { 'Content-Type': 'application/json' } : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {})
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.description || 'Razorpay request failed.');
  }
  return data;
}

function calculateAmount(items) {
  const subtotal = items.reduce((sum, item) => {
    const value = Number(item.quantity_value);
    return sum + Number(item.price) * (item.quantity_unit === 'g' ? value / 1000 : value);
  }, 0);
  return Number((subtotal + (subtotal < 199 ? 15 : 0)).toFixed(2));
}

function toStockQuantity(unit, value) {
  return unit === 'g' ? value / 1000 : value;
}

function readItems(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

async function releaseAttempt(attemptId, nextStatus = 'failed') {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [attempts] = await connection.query(
      'SELECT * FROM payment_attempts WHERE attempt_id = ? FOR UPDATE',
      [attemptId]
    );
    const attempt = attempts[0];
    if (!attempt || attempt.status !== 'pending') {
      await connection.rollback();
      return false;
    }
    for (const item of readItems(attempt.items_json)) {
      if (item.surplus_listing_id) {
        await connection.query(
          `UPDATE surplus_listings SET quantity_remaining=quantity_remaining+?,
           status=IF(status='closed' AND deadline>NOW(), 'active', status) WHERE listing_id=?`,
          [item.stock_quantity, item.surplus_listing_id]
        );
      } else {
        await connection.query('UPDATE vegetables SET quantity = quantity + ? WHERE vegetable_id = ?', [item.stock_quantity, item.vegetable_id]);
      }
    }
    await connection.query(
      'UPDATE payment_attempts SET status = ? WHERE attempt_id = ?',
      [nextStatus, attemptId]
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

exports.expirePendingAttempts = async () => {
  const [rows] = await db.query(
    "SELECT attempt_id FROM payment_attempts WHERE status = 'pending' AND expires_at <= NOW() LIMIT 100"
  );
  for (const row of rows) {
    await releaseAttempt(row.attempt_id, 'expired');
  }
};

exports.createRazorpayOrder = async (req, res) => {
  let connection;
  let attemptId;
  try {
    gatewayCredentials();
    const deliveryAddress = String(req.body.delivery_address || '').trim();
    const preferredMethod = ['UPI', 'Credit Card'].includes(req.body.payment_method)
      ? req.body.payment_method
      : 'Online';
    if (!deliveryAddress) return res.status(400).json({ message: 'Delivery address is required.' });

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [cartItems] = await connection.query(
      `SELECT c.cart_id, c.vegetable_id, c.quantity, c.quantity_unit, c.quantity_value, c.surplus_listing_id,
              v.vegetable_name, v.price, v.sold_by, s.discounted_price AS rescue_price,
              s.original_price AS rescue_original_price, s.quantity_remaining AS rescue_stock,
              s.status AS rescue_status, s.deadline AS rescue_deadline
       FROM cart c JOIN vegetables v ON v.vegetable_id = c.vegetable_id
       LEFT JOIN surplus_listings s ON s.listing_id=c.surplus_listing_id
       WHERE c.customer_id = ? ORDER BY c.vegetable_id FOR UPDATE`,
      [req.user.id]
    );
    if (!cartItems.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    const ids = [...new Set(cartItems.map(item => Number(item.vegetable_id)))].sort((a, b) => a - b);
    const [vegetables] = await connection.query(
      `SELECT vegetable_id, quantity, sold_by FROM vegetables
       WHERE vegetable_id IN (${ids.map(() => '?').join(',')}) ORDER BY vegetable_id FOR UPDATE`,
      ids
    );
    const stockById = new Map(vegetables.map(item => [Number(item.vegetable_id), item]));
    const snapshot = cartItems.map(item => {
      const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : 'kg');
      const value = Number(item.quantity_value ?? item.quantity);
      if (!['kg', 'g', 'piece'].includes(unit) || !Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid quantity for ${item.vegetable_name}.`);
      }
      if ((item.sold_by === 'piece') !== (unit === 'piece')) {
        throw new Error(`Invalid quantity unit for ${item.vegetable_name}.`);
      }
      return {
        cart_id: Number(item.cart_id),
        vegetable_id: Number(item.vegetable_id),
        vegetable_name: item.vegetable_name,
        quantity: toStockQuantity(unit, value),
        quantity_unit: unit,
        quantity_value: value,
        stock_quantity: toStockQuantity(unit, value),
        price: Number(item.surplus_listing_id ? item.rescue_price : item.price),
        original_price: item.surplus_listing_id ? Number(item.rescue_original_price) : null,
        surplus_listing_id: item.surplus_listing_id ? Number(item.surplus_listing_id) : null
      };
    });
    for (const item of snapshot) {
      const stock = stockById.get(item.vegetable_id);
      const available = item.surplus_listing_id ? Number(cartItems.find(row => Number(row.vegetable_id) === item.vegetable_id)?.rescue_stock) : Number(stock?.quantity);
      const rescue = cartItems.find(row => Number(row.vegetable_id) === item.vegetable_id);
      if (item.surplus_listing_id && (rescue?.rescue_status !== 'active' || new Date(rescue.rescue_deadline) <= new Date())) {
        throw new Error(`Rescue Deal for ${item.vegetable_name} has expired.`);
      }
      if (!stock || item.stock_quantity > available) {
        throw new Error(`Insufficient stock for ${item.vegetable_name}. Please update your cart and try again.`);
      }
    }

    const amount = calculateAmount(snapshot);
    const amountPaise = Math.round(amount * 100);
    const [insert] = await connection.query(
      `INSERT INTO payment_attempts
       (customer_id, amount_paise, delivery_address, items_json, payment_method, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
      [req.user.id, amountPaise, deliveryAddress, JSON.stringify(snapshot), preferredMethod]
    );
    attemptId = insert.insertId;
    for (const item of snapshot) {
      if (item.surplus_listing_id) {
        const [updated] = await connection.query(
          `UPDATE surplus_listings SET quantity_remaining=quantity_remaining-?
           WHERE listing_id=? AND status='active' AND deadline>NOW() AND quantity_remaining>=?`,
          [item.stock_quantity, item.surplus_listing_id, item.stock_quantity]
        );
        if (!updated.affectedRows) throw new Error(`Rescue Deal stock for ${item.vegetable_name} changed. Please retry.`);
      } else {
        await connection.query('UPDATE vegetables SET quantity = quantity - ? WHERE vegetable_id = ?', [item.stock_quantity, item.vegetable_id]);
      }
    }
    await connection.commit();

    const gatewayOrder = await razorpayRequest('/orders', 'POST', {
      amount: amountPaise,
      currency: 'INR',
      receipt: `ff_${attemptId}`,
      notes: { freshfarm_attempt_id: String(attemptId), customer_id: String(req.user.id) }
    });
    await db.query(
      'UPDATE payment_attempts SET gateway_order_id = ? WHERE attempt_id = ? AND status = ?',
      [gatewayOrder.id, attemptId, 'pending']
    );
    res.status(201).json({
      attempt_id: attemptId,
      razorpay_order_id: gatewayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      expires_in_seconds: 900
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch {}
    }
    if (attemptId) {
      try { await releaseAttempt(attemptId, 'failed'); } catch (releaseError) {
        console.error('Could not release failed payment reservation:', releaseError.message);
      }
    }
    console.error('Create Razorpay Order Error:', error.message);
    res.status(400).json({ message: error.message || 'Unable to start online payment.' });
  } finally {
    if (connection) connection.release();
  }
};

async function createFreshFarmOrder(attemptId, paymentId, paymentMethod) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT * FROM payment_attempts WHERE attempt_id = ? FOR UPDATE',
      [attemptId]
    );
    const attempt = rows[0];
    if (!attempt) throw new Error('Payment attempt was not found.');
    if (attempt.status === 'paid') {
      await connection.commit();
      return { order_id: attempt.order_id, already_paid: true };
    }
    if (attempt.status !== 'pending') {
      await connection.commit();
      return { expired: true };
    }

    const items = readItems(attempt.items_json);
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, total_amount, payment_method, payment_status,
                           payment_id, delivery_address, status)
       VALUES (?, ?, ?, 'Paid', ?, ?, 'Order Placed')`,
      [attempt.customer_id, Number(attempt.amount_paise) / 100,
        `Razorpay (${String(paymentMethod || attempt.payment_method).toUpperCase()})`, paymentId,
        attempt.delivery_address]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items
         (order_id, vegetable_id, quantity, quantity_unit, quantity_value, price, surplus_listing_id, original_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.vegetable_id, item.quantity, item.quantity_unit,
          item.quantity_value, item.price, item.surplus_listing_id, item.original_price]
      );
      if (item.surplus_listing_id) {
        await connection.query('UPDATE surplus_listings SET quantity_sold=quantity_sold+? WHERE listing_id=?', [item.stock_quantity, item.surplus_listing_id]);
        await connection.query(
          `INSERT INTO surplus_events (listing_id, actor_role, actor_id, event_type, quantity, details)
           VALUES (?, 'customer', ?, 'sold_at_discount', ?, ?)`,
          [item.surplus_listing_id, attempt.customer_id, item.stock_quantity, `Order #${orderId}`]
        );
      }
      await connection.query(
        `DELETE FROM cart WHERE cart_id = ? AND customer_id = ?
         AND COALESCE(quantity_unit, ?) = ?
         AND COALESCE(quantity_value, quantity) = ?`,
        [item.cart_id, attempt.customer_id, item.quantity_unit, item.quantity_unit, item.quantity_value]
      );
    }
    await connection.query(
      "INSERT INTO delivery_status (order_id, current_status) VALUES (?, 'Order Placed')",
      [orderId]
    );
    await connection.query(
      `UPDATE payment_attempts SET status = 'paid', gateway_payment_id = ?, order_id = ?
       WHERE attempt_id = ?`,
      [paymentId, orderId, attemptId]
    );
    await connection.commit();
    return { order_id: orderId, already_paid: false };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function refundPayment(paymentId) {
  try {
    await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/refund`, 'POST', {});
  } catch (error) {
    console.error('Automatic refund failed; refund this captured payment in Razorpay Dashboard:', paymentId, error.message);
  }
}

exports.verifyPayment = async (req, res) => {
  try {
    const { keyId, secret } = gatewayCredentials();
    const { razorpay_order_id: gatewayOrderId, razorpay_payment_id: paymentId,
      razorpay_signature: signature } = req.body;
    if (!gatewayOrderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Payment verification data is incomplete.' });
    }
    const [attempts] = await db.query(
      'SELECT * FROM payment_attempts WHERE gateway_order_id = ? AND customer_id = ?',
      [gatewayOrderId, req.user.id]
    );
    const attempt = attempts[0];
    if (!attempt) return res.status(404).json({ message: 'Payment attempt was not found.' });

    const expected = crypto.createHmac('sha256', secret)
      .update(`${attempt.gateway_order_id}|${paymentId}`).digest();
    const received = Buffer.from(String(signature), 'hex');
    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ message: 'Payment signature is invalid.' });
    }

    const payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== attempt.gateway_order_id ||
        Number(payment.amount) !== Number(attempt.amount_paise) || payment.status !== 'captured') {
      return res.status(400).json({ message: 'Payment is not captured for the expected amount.' });
    }
    const result = await createFreshFarmOrder(attempt.attempt_id, paymentId, payment.method);
    if (result.expired) {
      await refundPayment(paymentId);
      return res.status(409).json({ message: 'This payment session expired. If the payment was captured, a refund has been initiated.' });
    }
    res.status(200).json({ message: 'Payment verified and order placed.', order_id: result.order_id });
  } catch (error) {
    console.error('Razorpay Verification Error:', error.message);
    res.status(500).json({ message: error.message || 'Unable to verify payment.' });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT attempt_id FROM payment_attempts WHERE attempt_id = ? AND customer_id = ? AND status = ?',
      [req.params.id, req.user.id, 'pending']
    );
    if (rows.length) await releaseAttempt(rows[0].attempt_id, 'failed');
    res.status(200).json({ message: 'Payment session closed.' });
  } catch (error) {
    console.error('Cancel Razorpay Attempt Error:', error.message);
    res.status(500).json({ message: 'Could not close the payment session.' });
  }
};

exports.webhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get('X-Razorpay-Signature');
    if (!webhookSecret || !signature || !Buffer.isBuffer(req.body)) {
      return res.status(400).send('Invalid webhook configuration or payload.');
    }
    const expected = crypto.createHmac('sha256', webhookSecret).update(req.body).digest();
    const received = Buffer.from(signature, 'hex');
    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).send('Invalid signature.');
    }
    const event = JSON.parse(req.body.toString('utf8'));
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        const [attempts] = await db.query(
          'SELECT attempt_id, amount_paise FROM payment_attempts WHERE gateway_order_id = ?',
          [payment.order_id]
        );
        const attempt = attempts[0];
      if (attempt && payment.status === 'captured' &&
          Number(payment.amount) === Number(attempt.amount_paise)) {
          const result = await createFreshFarmOrder(attempt.attempt_id, payment.id, payment.method);
          if (result.expired) await refundPayment(payment.id);
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error.message);
    res.status(500).send('Webhook processing failed.');
  }
};
