const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'draw';
  
  const winConditions = {
    rock: ['scissors'],
    paper: ['rock'],
    scissors: ['paper']
  };
  
  return winConditions[choice1].includes(choice2) ? 'player1' : 'player2';
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('joinRoom', ({ roomId, playerName }) => {
    try {
      if (!rooms[roomId]) {
        rooms[roomId] = {
          player1: null,
          player2: null,
          choices: {}
        };
        console.log(`Room ${roomId} created`);
      }

      const room = rooms[roomId];

      if (room.player1 && room.player2) {
        socket.emit('roomFull');
        return;
      }

      const isPlayer1 = !room.player1;
      const playerData = {
        id: socket.id,
        name: playerName || `Player${isPlayer1 ? '1' : '2'}`,
        choice: null,
        score: 0
      };

      if (isPlayer1) {
        room.player1 = playerData;
      } else {
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
    } catch (err) {
      console.error('Join room error:', err);
    }
  });

  socket.on('makeChoice', ({ roomId, choice }) => {
    const room = rooms[roomId];
    if (!room) return;

    const isPlayer1 = socket.id === room.player1?.id;
    if (isPlayer1) {
      room.player1.choice = choice;
    } else {
      room.player2.choice = choice;
    }
    room.choices[socket.id] = choice;

    socket.to(roomId).emit('opponentChoice', choice);

    if (room.player1?.choice && room.player2?.choice) {
      const result = determineWinner(room.player1.choice, room.player2.choice);
      
      if (result === 'player1') room.player1.score += 1;
      if (result === 'player2') room.player2.score += 1;

      io.to(room.player1.id).emit('gameResult', {
        result: result === 'player1' ? 'win' : result === 'player2' ? 'lose' : 'draw',
        currentPlayer: room.player1,
        opponent: room.player2
      });
      
      io.to(room.player2.id).emit('gameResult', {
        result: result === 'player2' ? 'win' : result === 'player1' ? 'lose' : 'draw',
        currentPlayer: room.player2,
        opponent: room.player1
      });

      room.player1.choice = null;
      room.player2.choice = null;
      room.choices = {};
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '.../client/build');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
