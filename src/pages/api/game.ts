import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

type Player = {
  id: string;
  name: string;
  choice: 'rock' | 'paper' | 'scissors' | null;
  score: number;
};

type Room = {
  player1: Player | null;
  player2: Player | null;
  choices: Record<string, 'rock' | 'paper' | 'scissors'>;
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse & { socket?: { server?: any } }) {
  // Перевірка наявності socket.server
  if (!res.socket?.server) {
    console.error('Socket server not available');
    return res.status(500).end();
  }

  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server');
    
    // Ініціалізація Socket.IO з явним вказівкою типу для httpServer
    const httpServer = res.socket.server;
    const io = new Server(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: [
          'https://rps-server-lac.vercel.app',
          'http://localhost:3000'
        ],
        methods: ['GET', 'POST']
      }
    });

    const rooms: Record<string, Room> = {};

    const determineWinner = (choice1: string, choice2: string): 'player1' | 'player2' | 'draw' => {
      if (choice1 === choice2) return 'draw';
      const winConditions: Record<string, string[]> = {
        rock: ['scissors'],
        paper: ['rock'],
        scissors: ['paper']
      };
      return winConditions[choice1].includes(choice2) ? 'player1' : 'player2';
    };

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('joinRoom', ({ roomId, playerName }: { roomId: string; playerName: string }) => {
        if (!rooms[roomId]) {
          rooms[roomId] = {
            player1: null,
            player2: null,
            choices: {}
          };
        }

        const room = rooms[roomId];
        const isPlayer1 = !room.player1;

        const playerData: Player = {
          id: socket.id,
          name: playerName,
          choice: null,
          score: 0
        };

        if (isPlayer1) {
          room.player1 = playerData;
        } else {
          if (room.player2) {
            socket.emit('roomFull');
            return;
          }
          room.player2 = playerData;
        }

        socket.join(roomId);
        socket.emit('playerData', { ...playerData, isPlayer1 });

        if (room.player1 && room.player2) {
          io.to(room.player1.id).emit('gameReady', {
            currentPlayer: room.player1,
            opponent: room.player2,
            isPlayer1: true
          });
          io.to(room.player2.id).emit('gameReady', {
            currentPlayer: room.player2,
            opponent: room.player1,
            isPlayer1: false
          });
        }
      });

      socket.on('makeChoice', ({ roomId, choice }: { roomId: string; choice: 'rock' | 'paper' | 'scissors' }) => {
        const room = rooms[roomId];
        if (!room) return;

        if (socket.id === room.player1?.id) {
          room.player1.choice = choice;
        } else if (socket.id === room.player2?.id) {
          room.player2.choice = choice;
        }

        room.choices[socket.id] = choice;
        socket.to(roomId).emit('opponentChoice', choice);

        if (room.player1?.choice && room.player2?.choice) {
          const result = determineWinner(room.player1.choice, room.player2.choice);
          
          if (result === 'player1' && room.player1) room.player1.score += 1;
          if (result === 'player2' && room.player2) room.player2.score += 1;

          io.to(room.player1.id).emit('gameResult', {
            result: result === 'player1' ? 'win' : 'lose',
            currentPlayer: room.player1,
            opponent: room.player2
          });

          io.to(room.player2.id).emit('gameResult', {
            result: result === 'player2' ? 'win' : 'lose',
            currentPlayer: room.player2,
            opponent: room.player1
          });

          // Reset for next round
          room.player1.choice = null;
          room.player2.choice = null;
          room.choices = {};
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const roomId in rooms) {
          const room = rooms[roomId];
          if (room.player1?.id === socket.id || room.player2?.id === socket.id) {
            const opponentId = room.player1?.id === socket.id ? room.player2?.id : room.player1?.id;
            if (opponentId) {
              io.to(opponentId).emit('opponentDisconnected');
            }
            delete rooms[roomId];
            break;
          }
        }
      });
    });

    // Зберігаємо io instance
    (res.socket.server as any).io = io;
  }
  res.end();
}

export const config = {
  api: {
    bodyParser: false
  }
};
