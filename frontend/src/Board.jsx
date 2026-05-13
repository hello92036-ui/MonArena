import { COMMON_PATH, HOME_STRETCHES, BASE_POSITIONS } from './gridMap';

const Piece = ({ color, canClick }) => (
  <div style={{
    width: '90%', height: '90%', position: 'relative',
    filter: canClick ? `drop-shadow(0 0 6px white)` : 'drop-shadow(0 4px 4px rgba(0,0,0,0.4))',
    transform: canClick ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
    transition: 'all 0.2s', zIndex: 10
  }}>
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="50" r="45" fill="#fff" />
      <circle cx="50" cy="50" r="38" fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth="4"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
      <ellipse cx="38" cy="30" rx="12" ry="6" fill="#fff" opacity="0.6" transform="rotate(-30 38 30)"/>
    </svg>
  </div>
);

const BaseArea = ({ color, r, c }) => (
  <div style={{
    gridArea: `${r} / ${c} / ${r+6} / ${c+6}`,
    backgroundColor: color, border: "2px solid #222",
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2,
    boxShadow: "inset 0 0 15px rgba(0,0,0,0.3)"
  }}>
    <div style={{
      width: '65%', height: '65%', backgroundColor: '#fff', borderRadius: '15%',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }} />
  </div>
);

const Star = () => (
  <svg viewBox="0 0 24 24" width="70%" height="70%">
    <path fill="rgba(0,0,0,0.15)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const CenterGoal = () => (
  <div style={{ gridArea: "7 / 7 / 10 / 10", zIndex: 2 }}>
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }}>
      <polygon points="0,0 100,0 50,50" fill="#ffd24d" />
      <polygon points="100,0 100,100 50,50" fill="#4d4dff" />
      <polygon points="0,100 100,100 50,50" fill="#ff4d4d" />
      <polygon points="0,0 0,100 50,50" fill="#4dff4d" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="#222" strokeWidth="2"/>
      <line x1="100" y1="0" x2="0" y2="100" stroke="#222" strokeWidth="2"/>
      <rect width="100" height="100" fill="none" stroke="#222" strokeWidth="2"/>
    </svg>
  </div>
);

export default function Board({ room, socket, roomId, userId }) {
  if (!room) return <div style={{marginTop: 20}}>Connecting to Arena...</div>;

  const colors = ["#ff4d4d", "#4dff4d", "#ffd24d", "#4d4dff"];
  const START_OFFSETS = [0, 13, 26, 39];
  const SAFE_CELLS = [
    {r:13, c:6, color: "#ffcccc"}, {r:6, c:1, color: "#ccffcc"},
    {r:1, c:8, color: "#ffffcc"}, {r:8, c:13, color: "#ccccff"},
    {r:8, c:2, color: "#e6e6e6"}, {r:2, c:8, color: "#e6e6e6"},
    {r:6, c:12, color: "#e6e6e6"}, {r:12, c:6, color: "#e6e6e6"}
  ];

  const getGridPosition = (playerIndex, pieceIndex, pos) => {
    if (pos === -1) return BASE_POSITIONS[playerIndex][pieceIndex];
    if (pos === 57) return { r: 7, c: 7 }; // Goal
    if (pos < 51) {
      const globalPos = (pos + START_OFFSETS[playerIndex]) % 52;
      return COMMON_PATH[globalPos];
    }
    return HOME_STRETCHES[playerIndex][pos - 51];
  };

  const myTurnIndex = room.players.findIndex(p => p.id === userId);
  const isMyTurn = room.turn === myTurnIndex;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <div style={{ padding: "8px", width: "100%", background: "#333", color: "white", borderRadius: "5px", textAlign: "center", fontSize: "14px" }}>
        <strong>Turn:</strong> Player {room.turn + 1} | <strong>Dice:</strong> {room.lastDiceDisplay || "-"}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gridTemplateRows: "repeat(15, 1fr)",
        width: "95vw", maxWidth: "400px", aspectRatio: "1/1", background: "#222", border: "4px solid #222", gap: "1px",
        position: "relative"
      }}>
        {Array.from({length: 225}).map((_, i) => {
          const r = Math.floor(i / 15); const c = i % 15;
          const safeData = SAFE_CELLS.find(s => s.r === r && s.c === c);
          let bg = "#fff";

          if (safeData) bg = safeData.color;
          else if (r === 7 && c >= 1 && c <= 6) bg = "#ccffcc"; // Green
          else if (c === 7 && r >= 1 && r <= 6) bg = "#ffffcc"; // Yellow
          else if (r === 7 && c >= 8 && c <= 13) bg = "#ccccff"; // Blue
          else if (c === 7 && r >= 8 && r <= 13) bg = "#ffcccc"; // Red

          return (
            <div key={i} style={{ backgroundColor: bg, gridRow: r+1, gridColumn: c+1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              {safeData && <Star />}
            </div>
          );
        })}

        <BaseArea color="#4dff4d" r={1} c={1} />
        <BaseArea color="#ffd24d" r={1} c={10} />
        <BaseArea color="#ff4d4d" r={10} c={1} />
        <BaseArea color="#4d4dff" r={10} c={10} />

        <CenterGoal />

        {room.players.map((player, pIndex) =>
          player.pieces.map((pos, pieceIndex) => {
            const { r, c } = getGridPosition(pIndex, pieceIndex, pos);
            const canClick = isMyTurn && room.turn === pIndex && room.lastDice !== null;
            return (
              <div
                key={`${pIndex}-${pieceIndex}`}
                onClick={() => canClick && socket.emit("move-piece", { roomId, pieceIndex, userId })}
                style={{
                  gridRow: r + 1, gridColumn: c + 1, zIndex: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: canClick ? "pointer" : "default"
                }}
              >
                <Piece color={colors[pIndex]} canClick={canClick} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
