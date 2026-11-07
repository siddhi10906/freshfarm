const db = require('./config/db');

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (!rows.length) await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

async function addIndexIfMissing(table, indexName, statement) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, indexName]
  );
  if (!rows.length) await db.query(statement);
}

async function migrate() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS ngo_profiles (
      ngo_id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL UNIQUE,
      organization_name VARCHAR(150) NOT NULL, organization_type ENUM('NGO','Community Kitchen') NOT NULL,
      service_city VARCHAR(100) NOT NULL, contact_phone VARCHAR(30) NOT NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      reviewed_by INT NULL, reviewed_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ngo_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
      INDEX idx_ngo_status_city (status, service_city)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS surplus_listings (
      listing_id INT AUTO_INCREMENT PRIMARY KEY, vegetable_id INT NOT NULL, farmer_id INT NOT NULL,
      locality VARCHAR(100) NOT NULL, original_price DECIMAL(10,2) NOT NULL,
      discounted_price DECIMAL(10,2) NOT NULL, quantity_listed DECIMAL(10,3) NOT NULL,
      quantity_remaining DECIMAL(10,3) NOT NULL, quantity_sold DECIMAL(10,3) NOT NULL DEFAULT 0,
      quantity_donated DECIMAL(10,3) NOT NULL DEFAULT 0, quantity_discarded DECIMAL(10,3) NOT NULL DEFAULT 0,
      deadline DATETIME NOT NULL,
      status ENUM('draft','active','donation_open','closed','discarded','cancelled') NOT NULL DEFAULT 'draft',
      farmer_approved_at DATETIME NULL, donation_closes_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_surplus_vegetable FOREIGN KEY (vegetable_id) REFERENCES vegetables(vegetable_id) ON DELETE CASCADE,
      CONSTRAINT fk_surplus_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
      INDEX idx_surplus_status_deadline (status, deadline), INDEX idx_surplus_farmer (farmer_id), INDEX idx_surplus_locality (locality)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS donation_requests (
      request_id INT AUTO_INCREMENT PRIMARY KEY, listing_id INT NOT NULL, ngo_id INT NOT NULL,
      quantity DECIMAL(10,3) NOT NULL, status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, decided_at DATETIME NULL, farmer_note VARCHAR(500) NULL,
      CONSTRAINT fk_donation_listing FOREIGN KEY (listing_id) REFERENCES surplus_listings(listing_id) ON DELETE CASCADE,
      CONSTRAINT fk_donation_ngo FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(ngo_id) ON DELETE CASCADE,
      INDEX idx_donation_listing_status (listing_id, status), INDEX idx_donation_ngo (ngo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS ngo_notifications (
      notification_id INT AUTO_INCREMENT PRIMARY KEY, ngo_id INT NOT NULL, listing_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, read_at DATETIME NULL,
      UNIQUE KEY uq_notification_listing (ngo_id, listing_id),
      CONSTRAINT fk_notification_ngo FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(ngo_id) ON DELETE CASCADE,
      CONSTRAINT fk_notification_listing FOREIGN KEY (listing_id) REFERENCES surplus_listings(listing_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS surplus_events (
      event_id INT AUTO_INCREMENT PRIMARY KEY, listing_id INT NOT NULL, actor_role VARCHAR(30) NOT NULL,
      actor_id INT NULL, event_type VARCHAR(60) NOT NULL, quantity DECIMAL(10,3) NULL, details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_surplus_event_listing FOREIGN KEY (listing_id) REFERENCES surplus_listings(listing_id) ON DELETE CASCADE,
      INDEX idx_surplus_event_listing (listing_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];
  for (const sql of statements) await db.query(sql);
  // Public applicants can exist before they have a FreshFarm customer account.
  await db.query('ALTER TABLE ngo_profiles MODIFY COLUMN customer_id INT NULL');
  await addColumnIfMissing('ngo_profiles', 'contact_email', 'VARCHAR(190) NULL');
  await addColumnIfMissing('ngo_profiles', 'password_hash', 'VARCHAR(255) NULL');
  await addIndexIfMissing('ngo_profiles', 'uq_ngo_contact_email', 'ALTER TABLE ngo_profiles ADD UNIQUE INDEX uq_ngo_contact_email (contact_email)');
  // Quantities are stored in kg-equivalents, so preserve fractional kg when reserving produce.
  await db.query('ALTER TABLE vegetables MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 0');
  await db.query('ALTER TABLE cart MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 1');
  await db.query('ALTER TABLE order_items MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL');
  await addColumnIfMissing('cart', 'surplus_listing_id', 'INT NULL');
  await addColumnIfMissing('order_items', 'surplus_listing_id', 'INT NULL');
  await addColumnIfMissing('order_items', 'original_price', 'DECIMAL(10,2) NULL');
  await addColumnIfMissing('payment_attempts', 'surplus_reserved_json', 'TEXT NULL');
  console.log('Fresh Produce Rescue & Donation Network migration complete.');
}

migrate().then(() => process.exit(0)).catch(error => {
  console.error('Rescue network migration failed:', error.message);
  process.exit(1);
});
