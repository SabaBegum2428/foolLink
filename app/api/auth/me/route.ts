import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const userObj = {
       id: session.id || session.userId,
       name: session.name,
       role: session.role,
       email: session.email,
       address: session.address
    };
    return NextResponse.json({ user: userObj }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to authenticate session' }, { status: 500 });
  }
}
