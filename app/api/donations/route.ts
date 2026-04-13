import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    initDb();
    
    // Get all donations with donor info and new fields
    const donations = db.prepare(`
      SELECT 
        d.*,
        u.name as donor_name, u.contact as donor_contact
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      ORDER BY d.id DESC
    `).all();
    
    return NextResponse.json(donations);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const formData = await request.formData();
    const donor_id = formData.get('donor_id') as string;
    const food_type = formData.get('food_type') as string;
    const description = formData.get('description') as string;
    const quantity_lbs = formData.get('quantity') as string;
    const expiry_time = formData.get('expiry') as string;
    const pickup_address = formData.get('pickup_address') as string;
    const allergens = formData.get('allergens') as string;
    const prep_type = formData.get('prep_type') as string;
    const storage_type = formData.get('storage_type') as string;
    const is_veg = formData.get('is_veg') === 'on' || formData.get('is_veg') === 'true';
    const safety_confirmed = formData.get('safety_confirmed') === 'on' || formData.get('safety_confirmed') === 'true';
    const foodImage = formData.get('food_image') as File | null;

    if (!donor_id || !food_type || !quantity_lbs || !expiry_time || !safety_confirmed) {
        return NextResponse.json({ error: 'Missing required fields or safety confirmation' }, { status: 400 });
    }

    let food_image_url: string | null = null;
    if (foodImage) {
        const bytes = await foodImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'food');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${foodImage.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);
        food_image_url = `/uploads/food/${filename}`;
    }

    const insertDonation = db.prepare(`
      INSERT INTO donations (
        donor_id, food_type, description, quantity_lbs, expiry_time, 
        pickup_address, pickup_lat, pickup_lng, food_image_url, 
        allergens, is_veg, prep_type, storage_type, safety_confirmed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = insertDonation.run(
        donor_id, food_type, description, quantity_lbs, expiry_time,
        pickup_address, 40.7128, -74.0060, food_image_url,
        allergens, is_veg ? 1 : 0, prep_type, storage_type, safety_confirmed ? 1 : 0
    );
    
    return NextResponse.json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 });
  }
}
