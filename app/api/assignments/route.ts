import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    initDb();
    const body = await request.json();
    const { donation_id, receiver_id } = body;

    // First, verify donation exists
    const act = db.prepare('UPDATE donations SET status = ? WHERE id = ?');
    act.run('Accepted', donation_id);

    const insertAssign = db.prepare(
      'INSERT INTO assignments (donation_id, receiver_id, status) VALUES (?, ?, ?)'
    );

    const info = insertAssign.run(donation_id, receiver_id, 'Assigned');

    return NextResponse.json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Update assignment status
  try {
    initDb();
    const body = await request.json();
    const { donation_id, status } = body;

    const update = db.prepare('UPDATE assignments SET status = ? WHERE donation_id = ?');
    update.run(status, donation_id);

    // Also update associated donation status for simplicity
    if (status === 'Picked Up') {
      db.prepare('UPDATE donations SET status = ? WHERE id = ?').run('In Transit', donation_id);
    }
    if (status === 'Delivered') {
      db.prepare('UPDATE donations SET status = ? WHERE id = ?').run('Delivered', donation_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}
