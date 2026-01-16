[no content]
# Monopoly Bank

>A simple, real-time Monopoly money control app for friends and families. No logins, no installs—just share a room code and play!

---

## 📝 Overview

**Monopoly Bank** lets one user act as the Banker and others as Players. The Banker can add/remove money for any player, and all changes update instantly for everyone. No accounts or passwords—just a room code!

**Tech stack:**
- Backend: Node.js, Express
- Real-time: Socket.IO
- Frontend: HTML, CSS, Vanilla JavaScript

---

## 🚀 Features
- One user is the Banker (creates a room)
- Players join with a room code and name
- Banker can add/remove money for any player
- Real-time updates for all
- Reset game at any time
- No login or database—data lives in memory
- Mobile-friendly UI

---

## 📁 Folder Structure

```
monopoly-bank/
│── package.json
│── server.js
│── README.md
└── public/
	 ├── index.html
	 ├── style.css
	 └── script.js
```

---

## ⚙️ Setup & Run Locally

1. **Requirements:**
	- Node.js v16 or newer

2. **Install dependencies:**
	```sh
	npm install
	```

3. **Start the server:**
	```sh
	npm start
	```

4. **Open the app:**
	- Go to [http://localhost:3000](http://localhost:3000)

5. **Test with multiple devices:**
	- Open the link on your phone (on the same Wi-Fi) using your computer’s IP address, e.g. `http://192.168.1.10:3000`
	- Or open multiple tabs/windows on your computer

---

## 🏗️ How It Works

1. **Banker** clicks "Create Room" and enters their name
2. **Players** join with the room code and their name
3. **Banker** can:
	- Add/remove money for any player (with quick or custom amounts)
	- Set the salary amount (default £200, can be changed anytime)
	- Give salary to any player by pressing their "Salary" button (player receives the set salary)
	- Reset the game
4. **Players** can:
	- Pay any other player a custom amount (money is deducted from their balance and added to the chosen player)
5. **All changes** are updated in real time for everyone

---

## 🗃️ Data Structure

Rooms and players are stored in memory like this:

```js
rooms = {
  "ABCD": {
	 bankerId: "socketid123",
	 players: {
		"socketid123": { name: "Alice", balance: 1500 },
		"socketid456": { name: "Bob", balance: 1500 }
	 }
  }
}
```

---

## 🌍 Free Hosting Guide

### Render.com (free tier)
1. Create a free account at [https://render.com](https://render.com)
2. Click "New Web Service" and connect your GitHub repo or upload your code
3. Set build command: `npm install` and start command: `npm start`
4. No environment variables needed
5. Share your Render URL with friends

### Fly.io (free tier)
1. Install [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Run `fly launch` in your project folder and follow prompts
3. Deploy with `fly deploy`
4. Share your Fly.io URL with friends

---

## 🔒 Security & Limitations
- No database: all data is in memory
- On server restart, all rooms and balances are lost
- For persistent storage, add a database or file system

---

## 💡 Optional Upgrades
- Transaction history
- Undo last transaction
- Password-protected Banker
- PWA (installable app) support
- Persistent storage

---

## 📜 Licence

MIT
# monopoly-bank
