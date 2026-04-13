import Database from 'better-sqlite3';
import path from 'path';

// Using a slightly different path for better Windows compatibility inside nextjs
// process.cwd() will point to the root of the next.js app
const dbPath = path.join(process.cwd(), 'foodlink.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      proof_file_url TEXT, -- Required for Donor, NGO, Receiver
      role TEXT NOT NULL CHECK(role IN ('Donor', 'NGO', 'Volunteer', 'Receiver')),
      contact TEXT NOT NULL,
      address TEXT, -- Organization / User Address
      lat REAL,
      lng REAL,
      registration_agreement BOOLEAN DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      food_type TEXT NOT NULL, -- Title of the Food
      description TEXT,
      quantity_lbs REAL NOT NULL,
      expiry_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Accepted', 'In Transit', 'Delivered')),
      pickup_address TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      food_image_url TEXT,
      allergens TEXT,
      is_veg BOOLEAN,
      prep_type TEXT, -- Homemade / Restaurant / Packaged
      storage_type TEXT, -- Refrigerated / Room temperature
      safety_confirmed BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(donor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donation_id INTEGER NOT NULL,
      volunteer_id INTEGER,
      receiver_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Assigned' CHECK(status IN ('Assigned', 'Picked Up', 'Delivered')),
      proof_pickup_url TEXT,
      proof_delivery_url TEXT,
      FOREIGN KEY(donation_id) REFERENCES donations(id),
      FOREIGN KEY(volunteer_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS receiver_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiver_id INTEGER NOT NULL,
      needs_description TEXT NOT NULL,
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    );
  `);
  
  // Seed initial mock users if table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as {count: number};
  if (count.count === 0) {
    // Hash for 'password123'
    const defaultHash = '$2a$10$cb10/l/f3F07fQh2.aIqS.iWd/w8G9J6Q.C1wXgM5q42n7w9QjT56';
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, contact, address, lat, lng, registration_agreement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertUser.run('Local Bakery', 'bakery@example.com', defaultHash, 'Donor', '123-456-7890', '123 Baker St, NY 10001', 40.7128, -74.0060, 1);
    insertUser.run('Food Bank NGO', 'contact@foodbank.org', defaultHash, 'NGO', '123-456-7891', '456 NGO Way, NY 10002', 40.7138, -74.0160, 1);
    insertUser.run('John Volunteer', 'john@example.com', defaultHash, 'Volunteer', '123-456-7892', '789 Volunteer Ave, NY 10003', 40.7148, -74.0260, 1);
    insertUser.run('Community Center', 'center@example.com', defaultHash, 'Receiver', '123-456-7893', '321 Center St, NY 10004', 40.7158, -74.0360, 1);
    
    // Seed initial donation
    const insertDonation = db.prepare(`
        INSERT INTO donations (
            donor_id, food_type, description, quantity_lbs, expiry_time, status, 
            pickup_address, pickup_lat, pickup_lng, allergens, is_veg, prep_type, 
            storage_type, safety_confirmed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDonation.run(
        1, '50 Loaves of Bread', 'Assorted sourdough and wheat bread', 50, 
        new Date(Date.now() + 86400000).toISOString(), 'Pending', 
        '123 Baker St, NY 10001', 40.7128, -74.0060, 'Gluten', 1, 'Restaurant', 
        'Room temperature', 1
    );
  }
}

initDb();

export default db;
