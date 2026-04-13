import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const contact = formData.get('contact') as string;
    const address = formData.get('address') as string;
    const proofFile = formData.get('proof_file') as File | null;
    const agreement = formData.get('agreement') === 'true';

    if (!name || !email || !password || !role || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (['NGO', 'Receiver', 'Donor'].includes(role) && !proofFile) {
      return NextResponse.json({ error: `Valid proof file required for ${role}` }, { status: 400 });
    }

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement to safety terms is required' }, { status: 400 });
    }

    let proof_file_url: string | null = null;
    if (proofFile) {
        const bytes = await proofFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Define path saving into public/uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const filename = `${Date.now()}-${proofFile.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);
        proof_file_url = `/uploads/proofs/${filename}`;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    try {
        const stmt = db.prepare(`
            INSERT INTO users (name, email, password_hash, proof_file_url, role, contact, address, lat, lng, registration_agreement)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(name, email, password_hash, proof_file_url, role, contact, address, null, null, agreement ? 1 : 0);
        
        return NextResponse.json({ message: 'Registration successful', userId: result.lastInsertRowid }, { status: 201 });
    } catch (dbError: any) {
        console.error('Database registration error:', dbError);
        if (dbError.message.includes('UNIQUE constraint failed')) {
            return NextResponse.json({ error: 'User already registered with this email' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Database error during registration', details: dbError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Registration processing error:', error);
    return NextResponse.json({ error: 'Failed to register', details: error.message }, { status: 500 });
  }
}
