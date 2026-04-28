const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('foodlink.db');

try {
    const donor_id = 1;
    const category = 'Money';
    const food_type = 'Monthly Relief';
    const description = 'Donation for community';
    const qty = NaN;
    const expiry = null;
    const pickup_address = null;
    const pickup_lat = 40.7128;
    const pickup_lng = -74.0060;
    const food_image_url = null;
    const allergens = null;
    const is_veg = 0;
    const prep_type = null;
    const storage_type = null;
    const safety_confirmed = 1;
    const detailsObj = { amount: '250', payment_method: 'Credit Card' };

    const insertDonation = db.prepare(`
      INSERT INTO donations (
        donor_id, category, food_type, description, quantity_lbs, expiry_time, 
        pickup_address, pickup_lat, pickup_lng, food_image_url, 
        allergens, is_veg, prep_type, storage_type, safety_confirmed, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = insertDonation.run(
        donor_id, category, food_type, description, qty, expiry,
        pickup_address, pickup_lat, pickup_lng, food_image_url,
        allergens, is_veg, prep_type, storage_type, safety_confirmed,
        JSON.stringify(detailsObj)
    );
    
    console.log('Success:', info);
} catch (error) {
    console.error('Error:', error);
} finally {
    db.close();
}
