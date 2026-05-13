import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { signWin } from "./signer.js";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};
const START_OFFSETS = [0, 13, 26, 39];
const SAFE_GLOBAL_POSITIONS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const TURN_TIMEOUT_MS = 15000;
const MAX_LIVES = 4;

function createPlayer(id) {
    return { id, pieces: [-1, -1, -1, -1], lives: MAX_LIVES, isActive: true };
}

function emitRoom(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const safeRoomData = { ...room };
    delete safeRoomData.turnTimer;
    io.to(roomId).emit("room-update", { roomId, ...safeRoomData });
}

async function checkWinCondition(roomId, room) {
    const activePlayers = room.players.filter(p => p.isActive);
    let winnerId = null;

    if (room.winner) {
        winnerId = room.winner;
    } else if (room.started && activePlayers.length === 1 && room.players.length > 1) {
        winnerId = activePlayers[0].id;
        room.winner = winnerId;
    }

    if (winnerId) {
        if (room.turnTimer) clearTimeout(room.turnTimer);
        room.started = false;
        console.log(`[SYSTEM] Game ${roomId} Resolved. Winner: ${winnerId}`);
        
        try {
            const signature = await signWin(winnerId, roomId);
            io.to(roomId).emit("game-won", { winner: winnerId, signature, amount: "1.9" });
        } catch (err) {
            console.error("Signing Error:", err);
        }
        
        emitRoom(roomId);
        return true;
    }
    return false;
}

function startClock(roomId) {
    const room = rooms[roomId];
    if (!room || !room.started || room.winner) return;
    if (room.turnTimer) clearTimeout(room.turnTimer);
    room.deadline = Date.now() + TURN_TIMEOUT_MS;
    room.turnTimer = setTimeout(() => handleTimeout(roomId), TURN_TIMEOUT_MS);
}

async function handleTimeout(roomId) {
    const room = rooms[roomId];
    if (!room || !room.started) return;
    const player = room.players[room.turn];
    player.lives -= 1;
    if (player.lives <= 0) {
        player.isActive = false;
        player.pieces = [-1, -1, -1, -1];
    }
    if (await checkWinCondition(roomId, room)) return;
    nextTurn(roomId, room);
    emitRoom(roomId);
}

function nextTurn(roomId, room) {
    let loops = 0;
    do {
        room.turn = (room.turn + 1) % room.players.length;
        loops++;
    } while (!room.players[room.turn].isActive && loops < 10);
    room.lastDice = null;
    room.sixCount = 0;
    startClock(roomId);
}

function getGlobalPosition(playerIndex, relativePos) {
    if (relativePos < 0 || relativePos > 51) return null;
    return (relativePos + START_OFFSETS[playerIndex]) % 52;
}

function processMove(room, playerIndex, pieceIndex, dice) {
    const player = room.players[playerIndex];
    if (player.pieces[pieceIndex] === -1) {
        if (dice === 6) { player.pieces[pieceIndex] = 0; return { success: true, extraTurn: true }; }
        return { success: false, extraTurn: false };
    }
    const newPos = player.pieces[pieceIndex] + dice;
    if (newPos > 57) return { success: false, extraTurn: false };
    player.pieces[pieceIndex] = newPos;
    let killedOpponent = false;
    const globalPos = getGlobalPosition(playerIndex, newPos);
    if (globalPos !== null && !SAFE_GLOBAL_POSITIONS.has(globalPos)) {
        room.players.forEach((opp, oppIndex) => {
            if (oppIndex === playerIndex || !opp.isActive) return;
            opp.pieces.forEach((oppPiecePos, oppPieceIndex) => {
                if (getGlobalPosition(oppIndex, oppPiecePos) === globalPos) {
                    opp.pieces[oppPieceIndex] = -1;
                    killedOpponent = true;
                }
            });
        });
    }
    if (player.pieces.every(p => p === 57)) room.winner = player.id;
    return { success: true, extraTurn: killedOpponent };
}

io.on("connection", (socket) => {
    socket.on("create-room", ({ roomId, userId }) => {
        rooms[roomId] = { host: userId, players: [createPlayer(userId)], turn: 0, started: false, lastDice: null, lastDiceDisplay: null, sixCount: 0 };
        socket.join(roomId); emitRoom(roomId);
    io.emit("roomsUpdated", Object.entries(rooms).map(([id, r]) => ({ id, name: r.host?.slice(0,6)+"s Arena", entryFee: 1, players: r.players.length })));
    });

    socket.on("join-room", ({ roomId, userId }) => {
        const room = rooms[roomId];
        if (!room) return;
        if (!room.players.find(p => p.id === userId)) room.players.push(createPlayer(userId));
        socket.join(roomId); emitRoom(roomId);
    });

    socket.on("start-game", ({ roomId, userId }) => {
        const room = rooms[roomId];
        if (!room || userId !== room.host || room.players.length < 2) return;
        room.started = true;
        startClock(roomId);
        emitRoom(roomId);
    });

    socket.on("roll-dice", async ({ roomId, userId }) => {
        const room = rooms[roomId];
        if (!room || !room.started) return;
        const currentPlayer = room.players[room.turn];
        if (userId !== currentPlayer.id || room.lastDice !== null || !currentPlayer.isActive) return;
        if (room.turnTimer) clearTimeout(room.turnTimer);
        const dice = Math.floor(Math.random() * 6) + 1;
        room.lastDice = dice; room.lastDiceDisplay = dice;
        if (dice === 6) room.sixCount++; else room.sixCount = 0;
        if (room.sixCount >= 3) { nextTurn(roomId, room); emitRoom(roomId); return; }
        const movablePieces = [];
        currentPlayer.pieces.forEach((piece, index) => {
            if (piece === -1 && dice === 6) movablePieces.push(index);
            else if (piece >= 0 && piece + dice <= 57) movablePieces.push(index);
        });
        if (movablePieces.length === 0) { nextTurn(roomId, room); emitRoom(roomId); return; }
        if (movablePieces.length === 1) {
            const result = processMove(room, room.turn, movablePieces[0], dice);
            if (await checkWinCondition(roomId, room)) return;
            if (dice === 6 || result.extraTurn) { room.lastDice = null; startClock(roomId); }
            else { nextTurn(roomId, room); }
            emitRoom(roomId); return;
        }
        startClock(roomId);
        emitRoom(roomId);
    });

    socket.on("move-piece", async ({ roomId, pieceIndex, userId }) => {
        const room = rooms[roomId];
        if (!room || !room.started) return;
        const player = room.players[room.turn];
        if (userId !== player.id || room.lastDice === null || !player.isActive) return;
        if (room.turnTimer) clearTimeout(room.turnTimer);
        const result = processMove(room, room.turn, pieceIndex, room.lastDice);
        if (!result.success) { startClock(roomId); return; }
        if (await checkWinCondition(roomId, room)) return;
        if (room.lastDice === 6 || result.extraTurn) { room.lastDice = null; startClock(roomId); }
        else { nextTurn(roomId, room); }
        emitRoom(roomId);
    });
});

server.listen(8080, "0.0.0.0", () => console.log("LUDO ENGINE RUNNING"));
