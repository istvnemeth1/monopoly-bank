// server.js
// Express and Socket.IO setup for Monopoly Bank app

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files from 'public' folder
app.use(express.static('public'));

// In-memory data structure for rooms and players
const rooms = {};

// Helper: Generate a 4-letter room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Store current room and role for this socket
  socket.data = { room: null, role: null };

  // Banker creates a room
  socket.on('createRoom', ({ name }) => {
    let code;
    do {
      code = generateRoomCode();
    } while (rooms[code]);
    rooms[code] = {
      bankerId: socket.id,
      players: {},
    };
    rooms[code].players[socket.id] = { name, balance: 1500 }; // Banker starts with £1500
    socket.data.room = code;
    socket.data.role = 'banker';
    socket.join(code);
    io.to(socket.id).emit('roomCreated', { code, players: rooms[code].players });
    io.to(code).emit('updatePlayers', rooms[code].players);
  });

  // Player joins a room
  socket.on('joinRoom', ({ code, name }) => {
    code = code.toUpperCase();
    if (!rooms[code]) {
      io.to(socket.id).emit('errorMsg', 'Room not found.');
      return;
    }
    if (rooms[code].players[socket.id]) {
      io.to(socket.id).emit('errorMsg', 'Already joined.');
      return;
    }
    rooms[code].players[socket.id] = { name, balance: 1500 };
    socket.data.room = code;
    socket.data.role = 'player';
    socket.join(code);
    io.to(socket.id).emit('roomJoined', { code, players: rooms[code].players, bankerId: rooms[code].bankerId });
    io.to(code).emit('updatePlayers', rooms[code].players);
  });

  // Banker adds/removes money
  socket.on('changeBalance', ({ playerId, amount }) => {
    const { room, role } = socket.data;
    if (!room || role !== 'banker') return;
    if (rooms[room] && rooms[room].players[playerId]) {
      rooms[room].players[playerId].balance += amount;
      io.to(room).emit('updatePlayers', rooms[room].players);
    }
  });

  // Banker resets the game
  socket.on('resetGame', () => {
    const { room, role } = socket.data;
    if (!room || role !== 'banker') return;
    Object.values(rooms[room].players).forEach(player => player.balance = 1500);
    io.to(room).emit('updatePlayers', rooms[room].players);
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    const { room, role } = socket.data;
    if (!room || !rooms[room]) return;
    delete rooms[room].players[socket.id];
    // If banker leaves, delete the room
    if (role === 'banker') {
      delete rooms[room];
      io.to(room).emit('roomClosed');
    } else {
      io.to(room).emit('updatePlayers', rooms[room].players);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});