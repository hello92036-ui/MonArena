import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { io } from "socket.io-client";
import { parseEther } from "viem";

const BACKEND_URL = "https://monarena.onrender.com";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const ABI = [
  { inputs: [{ internalType: "bytes32", name: "roomId", type: "bytes32" }], name: "bet", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "address", name: "winner", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }, { internalType: "bytes", name: "signature", type: "bytes" }], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
];

const C = 34;
const BW = 15 * C;
const HOMES = [
  { id: "r", base: "#FF5A5F", hi: "#FF8A8E", lo: "#C7363B", x: 0,     y: 9 * C },
  { id: "g", base: "#34D399", hi: "#7BEAC0", lo: "#14935E", x: 0,     y: 0     },
  { id: "y", base: "#FFC23D", hi: "#FFD97A", lo: "#D89400", x: 9 * C, y: 0     },
  { id: "b", base: "#3DA9FF", hi: "#7CC4FF", lo: "#1D7BCB", x: 9 * C, y: 9 * C },
];

const SAFE_CELLS = [{ c:1,r:6},{c:8,r:1},{c:13,r:8},{c:6,r:13},{c:2,r:8},{c:6,r:2},{c:12,r:6},{c:8,r:12}];
const ENTRY_CELLS = [{ x:C,y:6*C,f:"#FF5A5F"},{x:8*C,y:C,f:"#34D399"},{x:13*C,y:8*C,f:"#FFC23D"},{x:6*C,y:13*C,f:"#3DA9FF"}];

const START_OFFSETS = [0, 13, 26, 39];
const PATH = [
  [6,14],[6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
];
const HOME_STRETCH = [
  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
];
const PIECE_COLORS = ["#FF5A5F","#34D399","#FFC23D","#3DA9FF"];

function getPieceXY(playerIndex, relPos) {
  if (relPos < 0) return null;
  if (relPos >= 52) {
    const stretchIdx = relPos - 52;
    if (stretchIdx >= 0 && stretchIdx < 6) {
      const [col, row] = HOME_STRETCH[playerIndex][stretchIdx];
      return { x: col * C + C / 2, y: row * C + C / 2 };
    }
    return { x: 7.5 * C, y: 7.5 * C };
  }
  const globalPos = (relPos + START_OFFSETS[playerIndex]) % 52;
  const [col, row] = PATH[globalPos];
  return { x: col * C + C / 2, y: row * C + C / 2 };
}

function GCell({ x, y, fill = "#FFFFFF", stroke = "#D1C7B3" }) {
  return <rect x={x + 1} y={y + 1} width={C - 2} height={C - 2} rx="4" fill={fill} stroke={stroke} strokeWidth="1.2" />;
}

function GStar({ cx, cy }) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 9 : 3.5;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return <polygon points={p.join(" ")} fill="#C9B98A" opacity="0.9" />;
}

function GPiece({ cx, cy, color, highlight, onClick, ghost }) {
  return (
    <g onClick={onClick} style={{ 
      cursor: onClick ? "pointer" : "default", 
      transform: highlight ? 'scale(1.15)' : 'scale(1)', 
      transformOrigin: `${cx}px ${cy}px`, 
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
    }} filter={highlight ? "url(#glowFilter)" : "url(#shadowFilter)"} opacity={ghost ? 0.3 : 1}>
      <circle cx={cx} cy={cy} r="13" fill="#fff" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="10.5" fill={color} />
      <circle cx={cx} cy={cy} r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <ellipse cx={cx-3} cy={cy-4} rx="3.5" ry="2" fill="#fff" opacity="0.8" transform={`rotate(-45 ${cx-3} ${cy-4})`} />
    </g>
  );
}

function GHome({ h }) {
  const ix = h.x + C, iy = h.y + C;
  return (
    <g>
      <rect x={h.x + 3} y={h.y + 3} width={6 * C - 6} height={6 * C - 6} rx="16" fill={h.base} stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
      <rect x={ix - C*0.5} y={iy - C*0.5} width={5 * C} height={5 * C} rx="12" fill="#FFFFFF" filter="url(#shadowFilter)" />
    </g>
  );
}

function LudoBoardSVG({ size, roomState, myPlayerIndex, onPieceClick, movablePieces }) {
  const pc = [];
  for (let r = 0; r < 6; r++) for (let c = 6; c < 9; c++) pc.push({ x: c * C, y: r * C });
  for (let r = 9; r < 15; r++) for (let c = 6; c < 9; c++) pc.push({ x: c * C, y: r * C });
  for (let r = 6; r < 9; r++) for (let c = 0; c < 6; c++) pc.push({ x: c * C, y: r * C });
  for (let r = 6; r < 9; r++) for (let c = 9; c < 15; c++) pc.push({ x: c * C, y: r * C });
  
  const lanes = [
    { cc: Array.from({ length: 5 }, (_, i) => ({ x: (1 + i) * C, y: 7 * C })), f: "#FF5A5F" },
    { cc: Array.from({ length: 5 }, (_, i) => ({ x: 7 * C, y: (1 + i) * C })), f: "#34D399" },
    { cc: Array.from({ length: 5 }, (_, i) => ({ x: (13 - i) * C, y: 7 * C })), f: "#FFC23D" },
    { cc: Array.from({ length: 5 }, (_, i) => ({ x: 7 * C, y: (13 - i) * C })), f: "#3DA9FF" },
  ];

  const allPieces = [];
  
  // Draw ghost pieces for empty slots so the board doesn't look empty
  HOMES.forEach((h, pIdx) => {
    const isActive = roomState?.players?.[pIdx];
    if (!isActive) {
      const hx = h.x + C, hy = h.y + C;
      const hpts = [[hx+C,hy+C],[hx+3*C,hy+C],[hx+C,hy+3*C],[hx+3*C,hy+3*C]];
      for(let i=0; i<4; i++) {
        allPieces.push(<GPiece key={`ghost-${pIdx}-${i}`} cx={hpts[i][0]} cy={hpts[i][1]} color={PIECE_COLORS[pIdx]} ghost={true} />);
      }
    }
  });

  if (roomState?.players) {
    roomState.players.forEach((player, pIdx) => {
      player.pieces.forEach((pos, pieceIdx) => {
        const isMovable = myPlayerIndex === pIdx && movablePieces?.includes(pieceIdx);
        if (pos === -1) {
          const hx = HOMES[pIdx].x + C, hy = HOMES[pIdx].y + C;
          const hpts = [[hx+C,hy+C],[hx+3*C,hy+C],[hx+C,hy+3*C],[hx+3*C,hy+3*C]];
          const [pcx, pcy] = hpts[pieceIdx] || hpts[0];
          allPieces.push(<GPiece key={`${pIdx}-${pieceIdx}`} cx={pcx} cy={pcy} color={PIECE_COLORS[pIdx]} highlight={isMovable} onClick={isMovable ? () => onPieceClick(pieceIdx) : null} />);
          return;
        }
        const xy = getPieceXY(pIdx, pos);
        if (!xy) return;
        allPieces.push(<GPiece key={`${pIdx}-${pieceIdx}`} cx={xy.x} cy={xy.y} color={PIECE_COLORS[pIdx]} highlight={isMovable} onClick={isMovable ? () => onPieceClick(pieceIdx) : null} />);
      });
    });
  }

  return (
    <svg viewBox={`0 0 ${BW} ${BW}`} width={size} height={size} style={{ display: "block", borderRadius: 16, boxShadow: "0 16px 48px -12px rgba(40,30,20,0.3)" }}>
      <defs>
        <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFF" floodOpacity="1" />
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <rect width={BW} height={BW} rx="18" fill="#EFE9D9" />
      <rect x="3" y="3" width={BW - 6} height={BW - 6} rx="14" fill="#EFE9D9" stroke="#C9BEA8" strokeWidth="2" />
      {pc.map((c, i) => <GCell key={i} x={c.x} y={c.y} />)}
      {lanes.map((l, li) => l.cc.map((c, i) => <GCell key={"l" + li + i} x={c.x} y={c.y} fill={l.f} stroke="rgba(0,0,0,0.08)" />))}
      {ENTRY_CELLS.map((e, i) => <GCell key={"e" + i} x={e.x} y={e.y} fill={e.f} stroke="rgba(0,0,0,0.08)" />)}
      {SAFE_CELLS.map((s, i) => <GStar key={i} cx={s.c * C + C / 2} cy={s.r * C + C / 2} />)}
      {HOMES.map(h => <GHome key={h.id} h={h} />)}
      <g transform={`translate(${6 * C},${6 * C})`}>
        <polygon points={`0,0 ${3 * C},0 ${1.5 * C},${1.5 * C}`} fill="#34D399" />
        <polygon points={`${3 * C},0 ${3 * C},${3 * C} ${1.5 * C},${1.5 * C}`} fill="#FFC23D" />
        <polygon points={`0,${3 * C} ${3 * C},${3 * C} ${1.5 * C},${1.5 * C}`} fill="#3DA9FF" />
        <polygon points={`0,0 0,${3 * C} ${1.5 * C},${1.5 * C}`} fill="#FF5A5F" />
        <line x1="0" y1="0" x2={3*C} y2={3*C} stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
        <line x1={3*C} y1="0" x2="0" y2={3*C} stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
        <rect width={3*C} height={3*C} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3"/>
        <circle cx={1.5 * C} cy={1.5 * C} r="9" fill="#FFF" filter="url(#shadowFilter)" />
      </g>
      {allPieces}
    </svg>
  );
}

const DOTS = {
  1: [{ x: 20, y: 20 }],
  2: [{ x: 12, y: 12 }, { x: 28, y: 28 }],
  3: [{ x: 12, y: 12 }, { x: 20, y: 20 }, { x: 28, y: 28 }],
  4: [{ x: 12, y: 12 }, { x: 28, y: 12 }, { x: 12, y: 28 }, { x: 28, y: 28 }],
  5: [{ x: 12, y: 12 }, { x: 28, y: 12 }, { x: 20, y: 20 }, { x: 12, y: 28 }, { x: 28, y: 28 }],
  6: [{ x: 12, y: 10 }, { x: 28, y: 10 }, { x: 12, y: 20 }, { x: 28, y: 20 }, { x: 12, y: 30 }, { x: 28, y: 30 }],
};

function DiceFace({ value, size = 52, rolling }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={{ filter: "drop-shadow(0 4px 8px rgba(40,30,20,0.25))", animation: rolling ? "diceRoll 0.4s ease" : undefined }}>
      <rect x="2" y="2" width="36" height="36" rx="8" fill="white" stroke="#D9CDB1" strokeWidth="1.5" />
      <rect x="2" y="2" width="36" height="11" rx="8" fill="#FFF8EC" />
      {(DOTS[value] || []).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3.2" fill="#1a1f3a" />)}
    </svg>
  );
}

export function GameRoom({ room, onLeave }) {
  const { address } = useAccount();
  const [roomState, setRoomState] = useState(null);
  const [diceValue, setDiceValue] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [status, setStatus] = useState("Waiting for players...");
  const [winData, setWinData] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [movablePieces, setMovablePieces] = useState([]);
  const socketRef = useRef(null);

  const { writeContract } = useWriteContract();

  const myPlayerIndex = roomState?.players?.findIndex(p => p.id?.toLowerCase() === address?.toLowerCase()) ?? -1;
  const isMyTurn = roomState?.started && roomState?.players?.[roomState?.turn]?.id?.toLowerCase() === address?.toLowerCase();
  const hasRolled = movablePieces.length > 0 && isMyTurn;

  useEffect(() => {
    if (!room || !address) return;
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      const roomId = room.id === "new" ? `room_${Date.now()}` : room.id;
      room._resolvedId = roomId;
      socket.emit("join-room", { roomId, userId: address });
    });

    socket.on("room-update", (data) => {
      setRoomState(data);
      if (data.lastDiceDisplay) setDiceValue(data.lastDiceDisplay);
      
      if (data.started && data.players) {
        const myIdx = data.players.findIndex(p => p.id?.toLowerCase() === address?.toLowerCase());
        const isMyTurnNow = data.players[data.turn]?.id?.toLowerCase() === address?.toLowerCase();
        if (isMyTurnNow && data.lastDice !== null && myIdx >= 0) {
          const dice = Number(data.lastDice ?? data.lastDiceDisplay);
          const pieces = data.players[myIdx].pieces;
          const movable = [];
          pieces.forEach((p, i) => {
            if (p === -1 && dice === 6) movable.push(i);
            else if (p >= 0 && p + dice <= 57) movable.push(i);
          });
          setMovablePieces(movable);
        } else {
          setMovablePieces([]);
        }
      }

      if (!data.started) {
        setStatus(`${data.players?.length || 0}/4 players • Waiting to start`);
      } else if (data.winner) {
        setStatus("Game over!");
      } else {
        const currentPlayer = data.players?.[data.turn];
        const isMe = currentPlayer?.id?.toLowerCase() === address?.toLowerCase();
        setStatus(isMe ? "Your turn!" : `${currentPlayer?.id?.slice(0, 6)}... is playing`);
      }
    });

    socket.on("game-won", (data) => setWinData(data));
    return () => socket.disconnect();
  }, [room?.id, address]);

  const handleStart = () => {
    const roomId = room._resolvedId || room.id;
    socketRef.current?.emit("start-game", { roomId, userId: address });
  };

  const handleRoll = () => {
    if (!isMyTurn || hasRolled || diceRolling) return;
    setDiceRolling(true);
    setTimeout(() => setDiceRolling(false), 400);
    const roomId = room._resolvedId || room.id;
    socketRef.current?.emit("roll-dice", { roomId, userId: address });
  };

  const handlePieceClick = (pieceIndex) => {
    const roomId = room._resolvedId || room.id;
    socketRef.current?.emit("move-piece", { roomId, pieceIndex, userId: address });
    setMovablePieces([]);
  };

  const handleClaim = () => {
    if (!winData || claiming) return;
    setClaiming(true);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "claim",
      args: [winData.winner, parseEther(winData.amount), winData.signature],
    });
  };

  const isHost = roomState?.host?.toLowerCase() === address?.toLowerCase();
  const canStart = isHost && (roomState?.players?.length >= 2) && !roomState?.started;
  const boardSize = Math.min(typeof window !== "undefined" ? window.innerWidth - 24 : 360, 420);

  return (
    <div style={{ minHeight: "100svh", background: "hsl(36 100% 96%)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes diceRoll { 0%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(-15deg) scale(1.1)} 75%{transform:rotate(15deg) scale(1.1)} 100%{transform:rotate(0deg) scale(1)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      
      <header style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid hsl(36 30% 87%)", background: "white" }}>
        <button onClick={onLeave} style={{ background: "none", border: "none", fontWeight: "700", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}>← Leave</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: 16 }}>{room?.name || "Arena"}</div>
          <div onClick={() => { navigator.clipboard?.writeText(room?._resolvedId || room?.id || ""); }} style={{ fontSize: 10, color: "var(--coral)", fontWeight: "700", cursor: "pointer", letterSpacing: "0.05em" }}>
            📋 {(room?._resolvedId || room?.id || "").slice(-8).toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: 12, color: isMyTurn ? "#15A36A" : "var(--muted)", fontWeight: "700", animation: isMyTurn ? "pulse 1.5s infinite" : undefined }}>
          {isMyTurn ? "YOUR TURN" : "WAITING"}
        </div>
      </header>

      {winData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "slideUp 0.4s ease" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px 24px", textAlign: "center", maxWidth: 320, margin: "0 16px" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: "800", marginBottom: 4 }}>
              {winData.winner?.toLowerCase() === address?.toLowerCase() ? "You Won!" : "Game Over"}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              {winData.winner?.toLowerCase() === address?.toLowerCase() ? `Claim your ${winData.amount} MON prize` : `${winData.winner?.slice(0, 8)}... wins`}
            </div>
            {winData.winner?.toLowerCase() === address?.toLowerCase() && (
              <button onClick={handleClaim} disabled={claiming} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(180deg,#34D399,#14935E)", color: "white", fontWeight: "800", fontSize: 16, cursor: claiming ? "not-allowed" : "pointer" }}>
                {claiming ? "Claiming..." : `Claim ${winData.amount} MON`}
              </button>
            )}
            <button onClick={onLeave} style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", fontWeight: "700", cursor: "pointer" }}>Leave Arena</button>
          </div>
        </div>
      )}

      <div style={{ padding: "8px 16px", background: "white", borderBottom: "1px solid hsl(36 30% 87%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{status}</span>
        <span style={{ fontSize: 13, fontWeight: "700", color: "var(--coral)" }}>Pot: {((roomState?.players?.length || 0) * (room?.entryFee || 0)).toFixed(2)} MON</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "12px 12px 0" }}>
        <div style={{ position: "relative" }}>
          <LudoBoardSVG size={boardSize} roomState={roomState} myPlayerIndex={myPlayerIndex} onPieceClick={handlePieceClick} movablePieces={movablePieces} />
        </div>
      </div>

      <div style={{ padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        {roomState?.players?.map((p, i) => {
          const isActive = p.isActive;
          const isTurn = roomState.turn === i && roomState.started;
          const isMe = p.id?.toLowerCase() === address?.toLowerCase();
          return (
            <div key={p.id} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 10, background: isTurn ? PIECE_COLORS[i] : "white", border: `2px solid ${isTurn ? "#222" : "hsl(36 30% 87%)"}`, opacity: isActive ? 1 : 0.4 }}>
              <div style={{ fontSize: 10, fontWeight: "800", color: isTurn ? "white" : PIECE_COLORS[i] }}>{isMe ? "YOU" : `P${i + 1}`}</div>
              <div style={{ fontSize: 10, color: isTurn ? "rgba(255,255,255,0.8)" : "var(--muted)" }}>❤️ {p.lives}</div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "8px 16px 24px", marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {canStart && (
          <button onClick={handleStart} style={{ padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(180deg,#34D399,#14935E)", color: "white", fontWeight: "800", fontSize: 15, cursor: "pointer" }}>
            Start Game ({roomState?.players?.length} players)
          </button>
        )}

        {roomState?.started && !roomState?.winner && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              {diceValue ? <DiceFace value={diceValue} size={52} rolling={diceRolling} /> : <div style={{ width: 52, height: 52, borderRadius: 10, background: "hsl(36 30% 92%)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 11, fontWeight: "700" }}>DICE</div>}
            </div>
            <button onClick={handleRoll} disabled={!isMyTurn || hasRolled}
              style={{ flex: 3, padding: "14px", borderRadius: 14, border: "none", fontSize: 15, fontWeight: "800", cursor: (!isMyTurn || hasRolled) ? "not-allowed" : "pointer", background: isMyTurn && !hasRolled ? "linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))" : "hsl(36 20% 88%)", color: isMyTurn && !hasRolled ? "white" : "var(--muted)" }}>
              {!isMyTurn ? "Opponent's Turn" : hasRolled ? "Pick a Piece ↑" : "Roll Dice"}
            </button>
          </div>
        )}

        {!roomState?.started && !canStart && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, padding: "10px" }}>Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
