// script.js
// Handles all frontend logic for Monopoly Bank



const socket = io();
let myId = null;
let myRoom = null;
let isBanker = false;
let bankerId = null;
let currentPlayers = {};
let currentSalary = 200;
let gameEnded = false;

// Elements
const setupDiv = document.getElementById('setup');
const gameDiv = document.getElementById('game');
const roomInfo = document.getElementById('roomInfo');
const playersDiv = document.getElementById('players');
const setupError = document.getElementById('setupError');
const roomClosedDiv = document.getElementById('roomClosed');
const bankIcon = document.getElementById('bankIcon');
const payModal = document.getElementById('payModal');
const payModalTitle = document.getElementById('payModalTitle');
const payModalPlayer = document.getElementById('payModalPlayer');
const payModalAmount = document.getElementById('payModalAmount');
const payModalError = document.getElementById('payModalError');
const payModalConfirm = document.getElementById('payModalConfirm');
const payModalCancel = document.getElementById('payModalCancel');
const bankerPanel = document.getElementById('bankerPanel');
const salaryInput = document.getElementById('salaryInput');
const setSalaryBtn = document.getElementById('setSalaryBtn');
const bankerPlayers = document.getElementById('bankerPlayers');
const resetBtn = document.getElementById('resetBtn');
const endGameBtn = document.getElementById('endGameBtn');
const closeBankerPanel = document.getElementById('closeBankerPanel');
const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardList = document.getElementById('leaderboardList');

// Create Room (Banker)
document.getElementById('createRoomBtn').onclick = () => {
  const name = prompt('Enter your name (Banker):');
  if (!name || name.length < 2) return;
  socket.emit('createRoom', { name });
};

// Join Room (Player)
document.getElementById('joinRoomBtn').onclick = () => {
  const code = document.getElementById('joinRoomCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value.trim();
  if (code.length !== 4 || name.length < 2) {
    setupError.textContent = 'Enter a valid room code and name.';
    return;
  }
  socket.emit('joinRoom', { code, name });
};


// Show game UI
function showGame() {
  setupDiv.style.display = 'none';
  gameDiv.style.display = '';
  roomInfo.textContent = `Room: ${myRoom}`;
  document.getElementById('leaveBtn').onclick = () => location.reload();
  if (isBanker) {
    bankIcon.style.display = '';
  } else {
    bankIcon.style.display = 'none';
  }
}


// Render players and balances
function renderPlayers(players, banker, salary, ended) {
  myId = socket.id;
  bankerId = banker;
  currentPlayers = players;
  currentSalary = salary || 200;
  gameEnded = !!ended;
  playersDiv.innerHTML = '';
  Object.entries(players).forEach(([id, player]) => {
    const div = document.createElement('div');
    div.className = 'player' + (id === banker ? ' banker' : '');
    div.innerHTML = `
      <span class="player-name" data-id="${id}" style="cursor:${id!==myId&&!ended?'pointer':'default'};text-decoration:${id!==myId&&!ended?'underline':'none'};">${player.name} ${id === banker ? '(Banker)' : ''}</span>
      <span>£${player.balance}</span>
    `;
    playersDiv.appendChild(div);
  });

  // Add click listeners for player-to-player payment
  document.querySelectorAll('.player-name').forEach(el => {
    const pid = el.getAttribute('data-id');
    if (pid !== myId && !gameEnded) {
      el.onclick = () => openPayModal(pid);
    }
  });
}

// Socket events for player list
socket.on('updatePlayers', (players, banker, salary, ended) => {
  renderPlayers(players, banker, salary, ended);
});

socket.on('roomCreated', ({ code, players, salary, bankerId }) => {
  myRoom = code;
  isBanker = true;
  showGame();
  renderPlayers(players, socket.id, salary, false);
});

socket.on('roomJoined', ({ code, players, bankerId: bId, salary, ended }) => {
  myRoom = code;
  isBanker = (socket.id === bId);
  showGame();
  renderPlayers(players, bId, salary, ended);
});

socket.on('errorMsg', msg => {
  setupError.textContent = msg;
});

document.getElementById('resetBtn').onclick = () => {
  if (confirm('Reset all balances to £1500?')) {
    socket.emit('resetGame', myRoom);
  }
};


// --- Player-to-player payment modal logic ---
let payTargetId = null;
function openPayModal(playerId) {
  if (gameEnded) return;
  payTargetId = playerId;
  payModalPlayer.textContent = `Pay ${currentPlayers[playerId].name}`;
  payModalAmount.value = '';
  payModalError.textContent = '';
  payModal.style.display = 'flex';
}
if (payModalCancel) payModalCancel.onclick = () => { payModal.style.display = 'none'; };
if (payModalConfirm) payModalConfirm.onclick = () => {
  const amt = parseInt(payModalAmount.value, 10);
  if (!payTargetId || isNaN(amt) || amt < 1 || amt > 100000) {
    payModalError.textContent = 'Enter a valid amount.';
    return;
  }
  if (currentPlayers[myId].balance < amt) {
    payModalError.textContent = 'Insufficient funds.';
    return;
  }
  socket.emit('playerPay', { toId: payTargetId, amount: amt }, (res) => {
    if (res && res.error) {
      payModalError.textContent = res.error;
    } else {
      payModal.style.display = 'none';
    }
  });
};

// --- Banker Control Panel logic ---
if (bankIcon) bankIcon.onclick = () => {
  if (!isBanker) return;
  renderBankerPanel();
  bankerPanel.style.display = 'flex';
};
if (closeBankerPanel) closeBankerPanel.onclick = () => {
  bankerPanel.style.display = 'none';
};

function renderBankerPanel() {
  // Salary input
  salaryInput.value = currentSalary;
  // Player controls
  bankerPlayers.innerHTML = '';
  Object.entries(currentPlayers).forEach(([id, player]) => {
    const row = document.createElement('div');
    row.className = 'banker-row';
    row.innerHTML = `<b>${player.name}${id === bankerId ? ' (Banker)' : ''}</b> <span>£${player.balance}</span>`;
    if (!gameEnded) {
      // Add, Remove, Salary buttons
      ['add', 'remove', 'salary'].forEach(action => {
        const btn = document.createElement('button');
        if (action === 'add') btn.textContent = '➕';
        if (action === 'remove') btn.textContent = '➖';
        if (action === 'salary') btn.textContent = '💰';
        btn.onclick = () => {
          if (action === 'salary') {
            socket.emit('bankerAction', { action, playerId: id });
          } else {
            const val = prompt(`Amount to ${action === 'add' ? 'add' : 'remove'}:`);
            const amount = parseInt(val, 10);
            if (!isNaN(amount) && amount > 0 && amount <= 100000) {
              socket.emit('bankerAction', { action, playerId: id, amount });
            }
          }
        };
        row.appendChild(btn);
      });
    }
    bankerPlayers.appendChild(row);
  });
}

if (setSalaryBtn) setSalaryBtn.onclick = () => {
  const val = parseInt(salaryInput.value, 10);
  if (isNaN(val) || val < 1 || val > 10000) {
    salaryInput.value = currentSalary;
    return;
  }
  socket.emit('setSalary', val);
};

if (resetBtn) resetBtn.onclick = () => {
  if (confirm('Reset all balances to £1500?')) {
    socket.emit('resetGame');
    bankerPanel.style.display = 'none';
  }
};

if (endGameBtn) endGameBtn.onclick = () => {
  if (confirm('Are you sure you want to end the game?')) {
    socket.emit('endGame');
    bankerPanel.style.display = 'none';
  }
};

// --- Leaderboard logic ---
socket.on('gameEnded', (leaderboard) => {
  leaderboardList.innerHTML = '';
  leaderboard.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}: £${entry.balance}`;
    leaderboardList.appendChild(li);
  });
  leaderboardModal.style.display = 'flex';
});

// Room closed by Banker
socket.on('roomClosed', () => {
  gameDiv.style.display = 'none';
  roomClosedDiv.style.display = '';
});