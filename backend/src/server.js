import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createHash, randomBytes } from "crypto";

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

app.use(express.json());
app.get("/health", (_, res) => res.json({ ok: true }));

// ─── In-memory game rooms ──────────────────────────────────────────────────
const rooms = new Map();
const players = new Map(); // socketId -> { address, roomId }

function generateRoomId() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function generateServerSeed() {
  return randomBytes(32).toString("hex");
}

function rollDice(seeds, rollNumber) {
  const combined = seeds.join("") + rollNumber;
  const hash = createHash("sha256").update(combined).digest("hex");
  return (parseInt(hash.slice(0, 8), 16) % 6) + 1;
}

function getPublicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    game: room.game,
    stake: room.stake,
    capacity: room.capacity,
    players: room.players.map(p => ({
      address: p.address,
      socketId: p.socketId,
      seedCommit: p.seedCommit,
      ready: p.ready,
    })),
    status: room.status,
    currentTurn: room.currentTurn,
    gameState: room.gameState,
    rollNumber: room.rollNumber,
  };
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  // ─── Create room ──────────────────────────────────────────────────────────
  socket.on("create_room", ({ address, game, stake, capacity, name }) => {
    const roomId = generateRoomId();
    const serverSeed = generateServerSeed();
    const serverSeedHash = createHash("sha256").update(serverSeed).digest("hex");

    const room = {
      id: roomId,
      name: name || `Room ${roomId}`,
      game: game || "ludo",
      stake: stake || 100,
      capacity: capacity || 4,
      status: "waiting",
      serverSeed,
      serverSeedHash,
      players: [],
      currentTurn: 0,
      rollNumber: 0,
      gameState: initGameState(game || "ludo"),
      createdAt: Date.now(),
    };

    rooms.set(roomId, room);
    joinRoom(socket, room, address);

    socket.emit("room_created", {
      roomId,
      serverSeedHash,
      room: getPublicRoom(room),
    });

    io.emit("rooms_updated", getRoomList());
    console.log("room created:", roomId, "by", address);
  });

  // ─── Join room ────────────────────────────────────────────────────────────
  socket.on("join_room", ({ roomId, address }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit("error", { msg: "Room not found" });
    if (room.status !== "waiting") return socket.emit("error", { msg: "Game already started" });
    if (room.players.length >= room.capacity) return socket.emit("error", { msg: "Room full" });
    if (room.players.find(p => p.address === address)) return socket.emit("error", { msg: "Already in room" });

    joinRoom(socket, room, address);
    socket.emit("room_joined", { room: getPublicRoom(room) });
    io.to(roomId).emit("room_updated", getPublicRoom(room));
    io.emit("rooms_updated", getRoomList());
  });

  // ─── Commit seed (fairness) ───────────────────────────────────────────────
  socket.on("commit_seed", ({ roomId, seedHash }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    player.seedCommit = seedHash;
    player.ready = true;

    io.to(roomId).emit("room_updated", getPublicRoom(room));

    // Start game when all players committed
    if (room.players.length === room.capacity &&
        room.players.every(p => p.ready)) {
      room.status = "active";
      io.to(roomId).emit("game_started", {
        room: getPublicRoom(room),
        serverSeedHash: room.serverSeedHash,
      });
      console.log("game started:", roomId);
    }
  });

  // ─── Roll dice ────────────────────────────────────────────────────────────
  socket.on("roll_dice", ({ roomId, playerSeed }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== "active") return;

    const player = room.players[room.currentTurn];
    if (!player || player.socketId !== socket.id) {
      return socket.emit("error", { msg: "Not your turn" });
    }

    room.rollNumber++;
    const seeds = [room.serverSeed, playerSeed, ...room.players.map(p => p.address)];
    const result = rollDice(seeds, room.rollNumber);

    io.to(roomId).emit("dice_rolled", {
      player: player.address,
      result,
      rollNumber: room.rollNumber,
    });

    console.log("dice rolled:", result, "by", player.address);
  });

  // ─── Move piece ───────────────────────────────────────────────────────────
  socket.on("move_piece", ({ roomId, pieceIndex, diceValue }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== "active") return;

    const player = room.players[room.currentTurn];
    if (!player || player.socketId !== socket.id) return;

    const moved = applyMove(room, room.currentTurn, pieceIndex, diceValue);
    if (!moved.valid) return socket.emit("error", { msg: "Invalid move" });

    io.to(roomId).emit("piece_moved", {
      player: player.address,
      playerIndex: room.currentTurn,
      pieceIndex,
      newPosition: moved.newPosition,
      captured: moved.captured,
      gameState: room.gameState,
    });

    // Check win
    const winner = checkWin(room, room.currentTurn);
    if (winner !== null) {
      room.status = "finished";
      room.serverSeedRevealed = room.serverSeed;
      io.to(roomId).emit("game_over", {
        winner: player.address,
        winnerIndex: room.currentTurn,
        serverSeed: room.serverSeed,
        gameState: room.gameState,
      });
      rooms.delete(roomId);
      io.emit("rooms_updated", getRoomList());
      return;
    }

    // Next turn (skip if dice was 6 — player rolls again)
    if (diceValue !== 6) {
      room.currentTurn = (room.currentTurn + 1) % room.players.length;
    }

    io.to(roomId).emit("turn_changed", {
      currentTurn: room.currentTurn,
      player: room.players[room.currentTurn]?.address,
    });
  });

  // ─── Get rooms list ───────────────────────────────────────────────────────
  socket.on("get_rooms", () => {
    socket.emit("rooms_list", getRoomList());
  });

  // ─── Disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const p = players.get(socket.id);
    if (p?.roomId) {
      const room = rooms.get(p.roomId);
      if (room) {
        room.players = room.players.filter(pl => pl.socketId !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(p.roomId);
        } else {
          io.to(p.roomId).emit("player_left", {
            address: p.address,
            room: getPublicRoom(room),
          });
        }
        io.emit("rooms_updated", getRoomList());
      }
    }
    players.delete(socket.id);
    console.log("disconnected:", socket.id);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────
function joinRoom(socket, room, address) {
  room.players.push({
    socketId: socket.id,
    address,
    seedCommit: null,
    ready: false,
    pieces: [0, 0, 0, 0], // 0 = home, 1-57 = board path, 58 = finished
  });
  players.set(socket.id, { address, roomId: room.id });
  socket.join(room.id);
}

function getRoomList() {
  return Array.from(rooms.values())
    .filter(r => r.status === "waiting")
    .map(r => ({
      id: r.id,
      name: r.name,
      game: r.game,
      stake: r.stake,
      capacity: r.capacity,
      players: r.players.length,
    }));
}

function initGameState(game) {
  if (game === "ludo") {
    return {
      pieces: [
        [0, 0, 0, 0], // player 0 (red)
        [0, 0, 0, 0], // player 1 (green)
        [0, 0, 0, 0], // player 2 (yellow)
        [0, 0, 0, 0], // player 3 (blue)
      ],
    };
  }
  return {
    positions: [1, 1, 1, 1], // snake & ladder: position 1-100
  };
}

function applyMove(room, playerIndex, pieceIndex, diceValue) {
  if (room.game === "ludo") {
    return applyLudoMove(room, playerIndex, pieceIndex, diceValue);
  }
  return applySnakeMove(room, playerIndex, diceValue);
}

function applyLudoMove(room, playerIndex, pieceIndex, diceValue) {
  const pieces = room.gameState.pieces[playerIndex];
  const current = pieces[pieceIndex];

  // Piece in home — needs 6 to start
  if (current === 0 && diceValue !== 6) return { valid: false };
  if (current === 0 && diceValue === 6) {
    pieces[pieceIndex] = 1; // enter board
    return { valid: true, newPosition: 1, captured: null };
  }

  const next = current + diceValue;
  if (next > 57) return { valid: false }; // can't overshoot finish

  // Check capture (simplified — full path collision logic omitted for brevity)
  let captured = null;
  pieces[pieceIndex] = next;

  return { valid: true, newPosition: next, captured };
}

function applySnakeMove(room, playerIndex, diceValue) {
  const SNAKES = { 99:41, 87:36, 67:19 };
  const LADDERS = { 4:25, 21:42, 51:84 };

  let pos = room.gameState.positions[playerIndex];
  pos = Math.min(100, pos + diceValue);

  if (SNAKES[pos]) pos = SNAKES[pos];
  if (LADDERS[pos]) pos = LADDERS[pos];

  room.gameState.positions[playerIndex] = pos;
  return { valid: true, newPosition: pos, captured: null };
}

function checkWin(room, playerIndex) {
  if (room.game === "ludo") {
    const pieces = room.gameState.pieces[playerIndex];
    if (pieces.every(p => p === 57)) return playerIndex;
  } else {
    if (room.gameState.positions[playerIndex] >= 100) return playerIndex;
  }
  return null;
}

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`MonArena backend running on port ${PORT}`));
