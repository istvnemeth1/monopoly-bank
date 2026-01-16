// script.js
// Handles client-side logic for Monopoly Bank

const socket = io();
let myId = null;
let myRole = null;
let currentRoom = null;
let bankerId = null;

// Elements
const joinSection = document.getElementById('join-section');
const gameSection = document.getElementById('game-section');
const nameInput = document.getElementById('name');
const roomInput = document.getElementById('room');
const joinBtn = document.getElementById('join-btn');
const errorDiv = document.getElementById('error');
const roomTitle = document.getElementById('room-title');
const playersDiv = document.getElementById('players');
const bankerControls = document.getElementById('banker-controls');
const controlPanel = document.getElementById('control-panel');
const resetBtn = document.getElementById('reset-btn');
const leaveBtn = document.getElementById('leave-btn');

// Join or create room
joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  const code = roomInput.value.trim();
  if (!name) {
    errorDiv.textContent = 'Please enter your name.';
    return;
  }
  errorDiv.textContent = '';
  if (code) {
    socket.emit('joinRoom', { code, name });
  } else {
    socket.emit('createRoom', { name });
  }
};

// Handle room creation
socket.on('roomCreated', ({ code, players }) => {
  myRole = 'banker';
  currentRoom = code;
  bankerId = socket.id;
  showGame(code, players);
});

// Handle room join
socket.on('roomJoined', ({ code, players, bankerId: bId }) => {
  myRole = 'player';
  currentRoom = code;
  bankerId = bId;
  showGame(code, players);
});

// Error messages
socket.on('errorMsg', msg => {
  errorDiv.textContent = msg;
});

// Update player list
socket.on('updatePlayers', players => {
  renderPlayers(players);
});

// Room closed (banker left)
socket.on('roomClosed', () => {
  alert('Banker left. Room closed.');
  location.reload();
});

// Show game section
function showGame(code, players) {
  joinSection.classList.add('hidden');
  gameSection.classList.remove('hidden');
  roomTitle.textContent = `Room: ${code}`;
  renderPlayers(players);
  if (myRole === 'banker') {
    bankerControls.classList.remove('hidden');
  } else {
    bankerControls.classList.add('hidden');
  }
}

// Render players and balances
function renderPlayers(players) {
  playersDiv.innerHTML = '';
  controlPanel.innerHTML = '';
  Object.entries(players).forEach(([id, player]) => {
    // Player row
    const row = document.createElement('div');
    row.className = 'player-row';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'player-name';
    nameSpan.textContent = player.name + (id === bankerId ? ' (Banker)' : '');
    const balanceSpan = document.createElement('span');
    balanceSpan.className = 'player-balance';
    balanceSpan.textContent = `£${player.balance}`;
    row.appendChild(nameSpan);
    row.appendChild(balanceSpan);
    playersDiv.appendChild(row);

    // Banker controls
    if (myRole === 'banker') {
      const controlRow = document.createElement('div');
      controlRow.className = 'player-row';
      const label = document.createElement('span');
      label.textContent = player.name;
      const addBtn = document.createElement('button');
      addBtn.textContent = '+£50';
      addBtn.onclick = () => socket.emit('changeBalance', { playerId: id, amount: 50 });
      const subBtn = document.createElement('button');
      subBtn.textContent = '−£50';
      subBtn.onclick = () => socket.emit('changeBalance', { playerId: id, amount: -50 });
      controlRow.appendChild(label);
      controlRow.appendChild(addBtn);
      controlRow.appendChild(subBtn);
      controlPanel.appendChild(controlRow);
    }
  });
}

// Banker: Reset game
resetBtn.onclick = () => {
  if (confirm('Reset all balances to £1500?')) {
    socket.emit('resetGame');
  }
};

// Leave room
leaveBtn.onclick = () => {
  location.reload();
};