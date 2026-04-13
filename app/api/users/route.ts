import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';

export async function GET() {
  try {
    initDb();
    const users = db.prepare('SELECT id, name, role, contact FROM users').all();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
