import { NextResponse } from 'next/server';
import { Server } from 'socket.io';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { socket } = (req as any)?.params || {};
  
  if (!socket?.server) {
    return NextResponse.json({ error: 'Socket not available' }, { status: 500 });
  }

  if (!socket.server.io) {
    const io = new Server(socket.server);
    // ...решта логіки з попереднього прикладу
    socket.server.io = io;
  }

  return NextResponse.json({ success: true });
}