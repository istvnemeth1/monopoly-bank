// script.js
// Handles all frontend logic for Monopoly Bank

const socket = io();
let myId = null;
let myRoom = null;
let isBanker = false;

// Elements
const setupDiv = document.getElementById('setup');
const gameDiv = document.getElementById('game');
const roomInfo = document.getElementById('roomInfo');
const playersDiv = document.getElementById('players');
const bankerControls = document.getElementById('bankerControls');
const setupError = document.getElementById('setupError');
const roomClosedDiv = document.getElementById('roomClosed');

// Create Room (Banker)
document.getElementById('createRoomBtn').onclick = () => {
  const name = prompt('Enter your name (Banker):');
  if (!name || name.length < 2) return;
  socket.emit('createRoom', name, ({ roomCode }) => {
    myRoom = roomCode;
    isBanker = true;
    showGame();
  });
};

// Join Room (Player)
document.getElementById('joinRoomBtn').onclick = () => {
  const code = document.getElementById('joinRoomCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value.trim();
  if (code.length !== 4 || name.length < 2) {
    setupError.textContent = 'Enter a valid room code and name.';
    return;
  }
  socket.emit('joinRoom', code, name, (res) => {
    if (res.error) {
      setupError.textContent = res.error;
    } else {
      myRoom = code;
      isBanker = (socket.id === res.bankerId);
      showGame();
    }
  });
};

// Show game UI
function showGame() {
  setupDiv.style.display = 'none';
  gameDiv.style.display = '';
  roomInfo.textContent = `Room: ${myRoom}`;
  document.getElementById('leaveBtn').onclick = () => location.reload();
  if (isBanker) bankerControls.style.display = '';
  else bankerControls.style.display = 'none';
}

// Render players and balances
socket.on('updatePlayers', (players, bankerId) => {
  myId = socket.id;
  playersDiv.innerHTML = '';
  Object.entries(players).forEach(([id, player]) => {
    const div = document.createElement('div');
    div.className = 'player' + (id === bankerId ? ' banker' : '');
    div.innerHTML = `
      <span>${player.name} ${id === bankerId ? '(Banker)' : ''}</span>
      <span>£${player.balance}</span>
    `;
    // Banker controls for each player
    if (isBanker && id !== bankerId) {
      const controls = document.createElement('span');
      controls.className = 'controls';
      [-100, -10, -1, 1, 10, 100].forEach(amount => {
        const btn = document.createElement('button');
        btn.textContent = (amount > 0 ? '+' : '') + amount;
        btn.onclick = () => {
          socket.emit('updateBalance', myRoom, id, amount);
        };
        controls.appendChild(btn);
      });
      div.appendChild(controls);
    }
    playersDiv.appendChild(div);
  });
});

// Banker: Reset game
document.getElementById('resetBtn').onclick = () => {
  if (confirm('Reset all balances to £1500?')) {
    socket.emit('resetGame', myRoom);
  }
};

// Room closed by Banker
socket.on('roomClosed', () => {
  gameDiv.style.display = 'none';
  roomClosedDiv.style.display = '';
});