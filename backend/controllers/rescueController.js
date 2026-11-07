const db = require('../config/db');
const bcrypt = require('bcryptjs');

const event = (connection, listingId, role, actorId, type, quantity, details = '') =>
  connection.query(
    'INSERT INTO surplus_events (listing_id, actor_role, actor_id, event_type, quantity, details) VALUES (?, ?, ?, ?, ?, ?)',
    [listingId, role, actorId || null, type, quantity ?? null, details || null]
  );

async function approvedNgo(user) {
  const [rows] = user.role === 'ngo'
    ? await db.query("SELECT * FROM ngo_profiles WHERE ngo_id = ? AND status = 'approved'", [user.id])
    : await db.query("SELECT * FROM ngo_profiles WHERE customer_id = ? AND status = 'approved'", [user.id]);
  return rows[0];
}

exports.publicRegisterNgo = async (req, res) => {
  try {
    const { organization_name, organization_type, service_city, contact_phone } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!organization_name?.trim() || !['NGO', 'Community Kitchen'].includes(organization_type) || !service_city?.trim() || !contact_phone?.trim() || !validEmail || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Complete all organization fields, enter a valid email, and use a password between 8 and 72 bytes.' });
    }

    const [customers] = await db.query('SELECT customer_id, password FROM customers WHERE LOWER(email)=?', [email]);
    let customerId = null;
    let passwordHash = null;
    if (customers.length) {
      const stored = String(customers[0].password || '');
      const matched = stored.startsWith('$2') ? await bcrypt.compare(password, stored) : password === stored;
      if (!matched) return res.status(409).json({ message: 'This email already belongs to a customer account. Sign in with that account password to submit the organization application.' });
      customerId = customers[0].customer_id;
    } else {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const [existing] = await db.query(
      'SELECT ngo_id, status FROM ngo_profiles WHERE (contact_email=? OR (? IS NOT NULL AND customer_id=?)) LIMIT 1',
      [email, customerId, customerId]
    );
    if (existing[0]?.status === 'approved') return res.status(409).json({ message: 'This organization is already approved. Sign in through Customer Login to access the donation dashboard.' });
    if (existing.length) {
      await db.query(
        `UPDATE ngo_profiles SET customer_id=?, contact_email=?, password_hash=COALESCE(?, password_hash),
         organization_name=?, organization_type=?, service_city=?, contact_phone=?, status='pending', reviewed_by=NULL, reviewed_at=NULL
         WHERE ngo_id=?`,
        [customerId, email, passwordHash, organization_name.trim(), organization_type, service_city.trim(), contact_phone.trim(), existing[0].ngo_id]
      );
    } else {
      await db.query(
        `INSERT INTO ngo_profiles (customer_id, contact_email, password_hash, organization_name, organization_type, service_city, contact_phone, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [customerId, email, passwordHash, organization_name.trim(), organization_type, service_city.trim(), contact_phone.trim()]
      );
    }
    res.status(201).json({ message: 'Application submitted successfully. After admin approval, sign in through Customer Login using this email and password to access the donation dashboard.' });
  } catch (error) {
    console.error('Public NGO registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An application already uses this email address.' });
    res.status(500).json({ message: 'Unable to submit organization registration.' });
  }
};

exports.registerNgo = async (req, res) => {
  try {
    const { organization_name, organization_type, service_city, contact_phone } = req.body;
    if (!organization_name?.trim() || !['NGO', 'Community Kitchen'].includes(organization_type) || !service_city?.trim() || !contact_phone?.trim()) {
      return res.status(400).json({ message: 'Organization name, type, service city and contact phone are required.' });
    }
    await db.query(
      `INSERT INTO ngo_profiles (customer_id, organization_name, organization_type, service_city, contact_phone)
       VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE organization_name = VALUES(organization_name), organization_type = VALUES(organization_type), service_city = VALUES(service_city), contact_phone = VALUES(contact_phone), status = 'pending', reviewed_by = NULL, reviewed_at = NULL`,
      [req.user.id, organization_name.trim(), organization_type, service_city.trim(), contact_phone.trim()]
    );
    res.status(201).json({ message: 'Registration submitted. Admin approval is required before donation listings are available.' });
  } catch (error) {
    console.error('NGO registration error:', error);
    res.status(500).json({ message: 'Unable to submit organization registration.' });
  }
};

exports.myNgo = async (req, res) => {
  const [rows] = req.user.role === 'ngo'
    ? await db.query('SELECT * FROM ngo_profiles WHERE ngo_id = ?', [req.user.id])
    : await db.query('SELECT * FROM ngo_profiles WHERE customer_id = ?', [req.user.id]);
  res.json(rows[0] || null);
};

exports.createListing = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { vegetable_id, quantity, deadline, discounted_price, approved_discount } = req.body;
    const qty = Number(quantity); const price = Number(discounted_price);
    if (!vegetable_id || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0 || !deadline || approved_discount !== true) {
      return res.status(400).json({ message: 'Select produce, a valid quantity, discounted price and deadline, then approve the discount.' });
    }
    const until = new Date(deadline);
    if (!Number.isFinite(until.getTime()) || until <= new Date()) return res.status(400).json({ message: 'The unsold deadline must be in the future.' });
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT v.*, f.district FROM vegetables v JOIN farmers f ON f.farmer_id = v.farmer_id
       WHERE v.vegetable_id = ? AND v.farmer_id = ? FOR UPDATE`, [vegetable_id, req.user.id]
    );
    const veg = rows[0];
    if (!veg) throw new Error('Vegetable not found in your listings.');
    if (price >= Number(veg.price)) throw new Error('Rescue deal price must be lower than the original price.');
    if (qty > Number(veg.quantity)) throw new Error('Surplus quantity exceeds available vegetable stock.');
    const [insert] = await connection.query(
      `INSERT INTO surplus_listings (vegetable_id, farmer_id, locality, original_price, discounted_price, quantity_listed, quantity_remaining, deadline, status, farmer_approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [veg.vegetable_id, veg.farmer_id, veg.district || '', veg.price, price, qty, qty, until]
    );
    await connection.query('UPDATE vegetables SET quantity = quantity - ? WHERE vegetable_id = ?', [qty, veg.vegetable_id]);
    await event(connection, insert.insertId, 'farmer', req.user.id, 'published', qty, 'Farmer approved and published the discounted rescue price.');
    await connection.commit();
    res.status(201).json({ message: 'Rescue deal published.', listing_id: insert.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message || 'Unable to publish rescue deal.' });
  } finally { connection.release(); }
};

exports.farmerListings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, v.vegetable_name, v.image, v.sold_by FROM surplus_listings s JOIN vegetables v ON v.vegetable_id = s.vegetable_id
       WHERE s.farmer_id = ? ORDER BY s.created_at DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: 'Unable to load your rescue listings.' }); }
};

exports.customerListings = async (req, res) => {
  try {
    const [customers] = await db.query('SELECT city FROM customers WHERE customer_id = ?', [req.user.id]);
    const city = customers[0]?.city || '';
    const [rows] = await db.query(
      `SELECT s.listing_id, s.vegetable_id, s.farmer_id, s.locality, s.original_price, s.discounted_price,
              s.quantity_remaining, s.deadline, v.vegetable_name, v.category, v.image, v.sold_by, f.full_name AS farmer_name
       FROM surplus_listings s JOIN vegetables v ON v.vegetable_id = s.vegetable_id JOIN farmers f ON f.farmer_id = s.farmer_id
       WHERE s.status = 'active' AND s.deadline > NOW() AND s.quantity_remaining > 0
         AND (LOWER(s.locality) = LOWER(?) OR LOWER(s.locality) LIKE CONCAT('%', LOWER(?), '%') OR LOWER(?) LIKE CONCAT('%', LOWER(s.locality), '%'))
       ORDER BY s.deadline ASC`, [city, city, city]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: 'Unable to load nearby rescue deals.' }); }
};

exports.donationListings = async (req, res) => {
  try {
    const ngo = req.ngoProfile || await approvedNgo(req.user);
    if (!ngo) return res.status(403).json({ message: 'An admin-approved NGO or community kitchen profile is required.' });
    const [rows] = await db.query(
      `SELECT s.*, v.vegetable_name, v.image, v.sold_by, f.full_name AS farmer_name,
       (SELECT COALESCE(SUM(quantity),0) FROM donation_requests d WHERE d.listing_id=s.listing_id AND d.status='pending') AS quantity_pending
       FROM ngo_notifications n JOIN surplus_listings s ON s.listing_id=n.listing_id
       JOIN vegetables v ON v.vegetable_id=s.vegetable_id JOIN farmers f ON f.farmer_id=s.farmer_id
       WHERE n.ngo_id=? AND s.status='donation_open' AND s.quantity_remaining>0 ORDER BY n.created_at DESC`, [ngo.ngo_id]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: 'Unable to load donation listings.' }); }
};

exports.requestDonation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const ngo = req.ngoProfile || await approvedNgo(req.user);
    if (!ngo) return res.status(403).json({ message: 'Admin approval is required to request donations.' });
    const quantity = Number(req.body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: 'Enter a valid quantity.' });
    await connection.beginTransaction();
    const [notification] = await connection.query('SELECT notification_id FROM ngo_notifications WHERE ngo_id=? AND listing_id=?', [ngo.ngo_id, req.params.id]);
    if (!notification.length) throw new Error('This donation listing was not sent to your organization.');
    const [rows] = await connection.query('SELECT * FROM surplus_listings WHERE listing_id=? FOR UPDATE', [req.params.id]);
    const listing = rows[0];
    if (!listing || listing.status !== 'donation_open' || new Date(listing.donation_closes_at) <= new Date()) throw new Error('This donation listing is no longer available.');
    const [existing] = await connection.query("SELECT COALESCE(SUM(quantity),0) AS reserved FROM donation_requests WHERE listing_id=? AND status='pending'", [listing.listing_id]);
    if (quantity + Number(existing[0].reserved) > Number(listing.quantity_remaining)) throw new Error('Requested amount exceeds available donation quantity.');
    await connection.query('INSERT INTO donation_requests (listing_id, ngo_id, quantity) VALUES (?, ?, ?)', [listing.listing_id, ngo.ngo_id, quantity]);
    await event(connection, listing.listing_id, 'ngo', req.user.id, 'donation_requested', quantity, ngo.organization_name);
    await connection.commit();
    res.status(201).json({ message: 'Donation request sent to the farmer.' });
  } catch (error) { await connection.rollback(); res.status(400).json({ message: error.message || 'Could not submit donation request.' }); }
  finally { connection.release(); }
};

exports.farmerDonationRequests = async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.*, s.vegetable_id, s.locality, v.vegetable_name, n.organization_name, n.organization_type
     FROM donation_requests d JOIN surplus_listings s ON s.listing_id=d.listing_id
     JOIN vegetables v ON v.vegetable_id=s.vegetable_id JOIN ngo_profiles n ON n.ngo_id=d.ngo_id
     WHERE s.farmer_id=? ORDER BY d.requested_at DESC`, [req.user.id]
  );
  res.json(rows);
};

exports.decideDonation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT d.*, s.farmer_id, s.quantity_remaining, s.listing_id, s.status AS listing_status, s.donation_closes_at FROM donation_requests d
       JOIN surplus_listings s ON s.listing_id=d.listing_id WHERE d.request_id=? FOR UPDATE`, [req.params.id]
    );
    const request = rows[0];
    if (!request || Number(request.farmer_id) !== Number(req.user.id)) throw new Error('Donation request not found.');
    if (request.status !== 'pending') throw new Error('This request has already been decided.');
    if (!['approved', 'rejected'].includes(req.body.status)) throw new Error('Choose approve or reject.');
    if (req.body.status === 'approved') {
      if (Number(request.quantity) > Number(request.quantity_remaining)) throw new Error('Not enough unreserved produce remains.');
      await connection.query("UPDATE surplus_listings SET quantity_remaining=quantity_remaining-?, quantity_donated=quantity_donated+? WHERE listing_id=?", [request.quantity, request.quantity, request.listing_id]);
    } else if (request.listing_status === 'closed' || new Date(request.donation_closes_at) <= new Date()) {
      await connection.query('UPDATE surplus_listings SET quantity_remaining=GREATEST(0, quantity_remaining-?), quantity_discarded=quantity_discarded+? WHERE listing_id=?', [request.quantity, request.quantity, request.listing_id]);
    }
    await connection.query('UPDATE donation_requests SET status=?, decided_at=NOW(), farmer_note=? WHERE request_id=?', [req.body.status, String(req.body.note || '').slice(0, 500), req.params.id]);
    await event(connection, request.listing_id, 'farmer', req.user.id, `donation_${req.body.status}`, request.quantity);
    if (req.body.status === 'rejected' && (request.listing_status === 'closed' || new Date(request.donation_closes_at) <= new Date())) {
      await event(connection, request.listing_id, 'system', null, 'expired_discarded', request.quantity, 'Pending donation request was rejected after the donation window.');
    }
    const [left] = await connection.query('SELECT quantity_remaining FROM surplus_listings WHERE listing_id=?', [request.listing_id]);
    if (Number(left[0].quantity_remaining) <= 0) await connection.query("UPDATE surplus_listings SET status='closed' WHERE listing_id=?", [request.listing_id]);
    await connection.commit();
    res.json({ message: `Donation request ${req.body.status}.` });
  } catch (error) { await connection.rollback(); res.status(400).json({ message: error.message || 'Unable to update request.' }); }
  finally { connection.release(); }
};

exports.getMetrics = async (req, res) => {
  const isFarmer = req.user.role === 'farmer';
  const where = isFarmer ? 'WHERE farmer_id=?' : '';
  const params = isFarmer ? [req.user.id] : [];
  try {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(quantity_listed),0) AS listed, COALESCE(SUM(quantity_sold),0) AS sold,
       COALESCE(SUM(quantity_donated),0) AS donated, COALESCE(SUM(quantity_discarded),0) AS discarded
       FROM surplus_listings ${where}`, params
    );
    const stats = rows[0];
    stats.rescued = Number(stats.sold) + Number(stats.donated);
    res.json(stats);
  } catch (error) { res.status(500).json({ message: 'Unable to load rescue tracking totals.' }); }
};

exports.adminNgos = async (_req, res) => {
  const [rows] = await db.query('SELECT n.*, COALESCE(c.full_name, n.organization_name) AS full_name, COALESCE(c.email, n.contact_email) AS email FROM ngo_profiles n LEFT JOIN customers c ON c.customer_id=n.customer_id ORDER BY n.created_at DESC');
  res.json(rows);
};

exports.reviewNgo = async (req, res) => {
  if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Status must be approved or rejected.' });
  await db.query('UPDATE ngo_profiles SET status=?, reviewed_by=?, reviewed_at=NOW() WHERE ngo_id=?', [req.body.status, req.user.id, req.params.id]);
  res.json({ message: `Organization ${req.body.status}.` });
};

exports.processDeadlines = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [expired] = await connection.query("SELECT * FROM surplus_listings WHERE status='active' AND deadline<=NOW() FOR UPDATE");
    for (const listing of expired) {
      await connection.query("UPDATE surplus_listings SET status='donation_open', donation_closes_at=DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE listing_id=?", [listing.listing_id]);
      const [eligible] = await connection.query("SELECT ngo_id FROM ngo_profiles WHERE status='approved' AND LOWER(service_city)=LOWER(?)", [listing.locality]);
      for (const ngo of eligible) await connection.query('INSERT IGNORE INTO ngo_notifications (ngo_id, listing_id) VALUES (?, ?)', [ngo.ngo_id, listing.listing_id]);
      await event(connection, listing.listing_id, 'system', null, 'deadline_reached', listing.quantity_remaining, `Notified ${eligible.length} eligible organizations.`);
    }
    const [closed] = await connection.query("SELECT * FROM surplus_listings WHERE status='donation_open' AND donation_closes_at<=NOW() FOR UPDATE");
    for (const listing of closed) {
      const [reserved] = await connection.query("SELECT COALESCE(SUM(quantity),0) AS qty FROM donation_requests WHERE listing_id=? AND status='pending'", [listing.listing_id]);
      const discard = Math.max(0, Number(listing.quantity_remaining) - Number(reserved[0].qty));
      if (discard > 0) {
        await connection.query('UPDATE surplus_listings SET quantity_remaining=quantity_remaining-?, quantity_discarded=quantity_discarded+? WHERE listing_id=?', [discard, discard, listing.listing_id]);
        await event(connection, listing.listing_id, 'system', null, 'expired_discarded', discard);
      }
      await connection.query("UPDATE surplus_listings SET status='closed' WHERE listing_id=?", [listing.listing_id]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); console.error('Rescue deadline processor:', error.message); }
  finally { connection.release(); }
};
