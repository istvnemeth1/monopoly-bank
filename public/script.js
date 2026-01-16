// script.js
// Handles all frontend logic for Monopoly Bank


const socket = io();
let myId = null;
let myRoom = null;
let isBanker = false;
let bankerId = null;
let currentPlayers = {};
let currentSalary = 200;

// Elements
const setupDiv = document.getElementById('setup');
const gameDiv = document.getElementById('game');
const roomInfo = document.getElementById('roomInfo');
const playersDiv = document.getElementById('players');
const bankerControls = document.getElementById('bankerControls');
const setupError = document.getElementById('setupError');
const roomClosedDiv = document.getElementById('roomClosed');
const salaryInput = document.getElementById('salaryInput');
const setSalaryBtn = document.getElementById('setSalaryBtn');
const playerPayDiv = document.getElementById('playerPay');
const payTo = document.getElementById('payTo');
const payAmount = document.getElementById('payAmount');
const payBtn = document.getElementById('payBtn');
const payError = document.getElementById('payError');
const customModal = document.getElementById('customModal');
const customModalTitle = document.getElementById('customModalTitle');
const customAmountInput = document.getElementById('customAmountInput');
const customAmountConfirm = document.getElementById('customAmountConfirm');
const customAmountCancel = document.getElementById('customAmountCancel');
const customAmountError = document.getElementById('customAmountError');

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
    bankerControls.style.display = '';
    playerPayDiv.style.display = 'none';
  } else {
    bankerControls.style.display = 'none';
    playerPayDiv.style.display = '';
  }
}


// Render players and balances
function renderPlayers(players, banker, salary) {
  myId = socket.id;
  bankerId = banker;
  currentPlayers = players;
  currentSalary = salary || 200;
  playersDiv.innerHTML = '';
  Object.entries(players).forEach(([id, player]) => {
    const div = document.createElement('div');
    div.className = 'player' + (id === banker ? ' banker' : '');
    div.innerHTML = `
      <span>${player.name} ${id === banker ? '(Banker)' : ''}</span>
      <span>£${player.balance}</span>
    `;
    // Banker controls for each player
    if (isBanker && id !== banker) {
      const controls = document.createElement('span');
      controls.className = 'controls';
      [-100, -10, -1, 1, 10, 100].forEach(amount => {
        const btn = document.createElement('button');
        btn.textContent = (amount > 0 ? '+' : '') + amount;
        btn.onclick = () => {
          socket.emit('changeBalance', { playerId: id, amount });
        };
        controls.appendChild(btn);
      });
      // Custom add/remove
      const customAdd = document.createElement('button');
      customAdd.textContent = '+Custom';
      customAdd.onclick = () => openCustomModal(id, 'add');
      controls.appendChild(customAdd);
      const customRemove = document.createElement('button');
      customRemove.textContent = '-Custom';
      customRemove.onclick = () => openCustomModal(id, 'remove');
      controls.appendChild(customRemove);
      // Salary button
      const salaryBtn = document.createElement('button');
      salaryBtn.textContent = 'Salary (£' + currentSalary + ')';
      salaryBtn.onclick = () => socket.emit('giveSalary', id);
      controls.appendChild(salaryBtn);
      div.appendChild(controls);
    }
    playersDiv.appendChild(div);
  });

  // Player pay UI
  if (!isBanker) {
    payTo.innerHTML = '';
    Object.entries(players).forEach(([id, player]) => {
      if (id !== myId) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = player.name;
        payTo.appendChild(opt);
      }
    });
  }
}

// Socket events for player list
socket.on('updatePlayers', (players, banker, salary) => {
  renderPlayers(players, banker, salary);
});

socket.on('roomCreated', ({ code, players, salary }) => {
  myRoom = code;
  isBanker = true;
  showGame();
  renderPlayers(players, socket.id, salary);
});

socket.on('roomJoined', ({ code, players, bankerId, salary }) => {
  myRoom = code;
  isBanker = (socket.id === bankerId);
  showGame();
  renderPlayers(players, bankerId, salary);
});

socket.on('errorMsg', msg => {
  setupError.textContent = msg;
});

document.getElementById('resetBtn').onclick = () => {
  if (confirm('Reset all balances to £1500?')) {
    socket.emit('resetGame', myRoom);
  }
};

// Banker: Set salary
if (setSalaryBtn) {
  setSalaryBtn.onclick = () => {
    const val = parseInt(salaryInput.value, 10);
    if (isNaN(val) || val < 1 || val > 10000) {
      salaryInput.value = currentSalary;
      return;
    }
    socket.emit('setSalary', val);
  };
}

// Custom add/remove modal logic (banker)
let customTargetId = null;
let customType = null;
function openCustomModal(playerId, type) {
  customTargetId = playerId;
  customType = type;
  customModalTitle.textContent = (type === 'add' ? 'Add Custom Amount' : 'Remove Custom Amount');
  customAmountInput.value = '';
  customAmountError.textContent = '';
  customModal.style.display = 'flex';
}
if (customAmountCancel) customAmountCancel.onclick = () => { customModal.style.display = 'none'; };
if (customAmountConfirm) customAmountConfirm.onclick = () => {
  const val = parseInt(customAmountInput.value, 10);
  if (isNaN(val) || val < 1 || val > 100000) {
    customAmountError.textContent = 'Enter a valid amount.';
    return;
  }
  const amt = customType === 'add' ? val : -val;
  socket.emit('changeBalance', { playerId: customTargetId, amount: amt });
  customModal.style.display = 'none';
};

// Player pay logic
if (payBtn) payBtn.onclick = () => {
  payError.textContent = '';
  const toId = payTo.value;
  const amt = parseInt(payAmount.value, 10);
  if (!toId || isNaN(amt) || amt < 1 || amt > 100000) {
    payError.textContent = 'Enter a valid amount and select a player.';
    return;
  }
  if (currentPlayers[myId].balance < amt) {
    payError.textContent = 'Insufficient funds.';
    return;
  }
  socket.emit('playerPay', { toId, amount: amt });
  payAmount.value = '';
};

// Room closed by Banker
socket.on('roomClosed', () => {
  gameDiv.style.display = 'none';
  roomClosedDiv.style.display = '';
});