import { COMMON_PATH, HOME_STRETCHES, BASE_POSITIONS } from './gridMap';

export default function Board({ room, socket, roomId, userId }) {
  if (!room) return <div style={{marginTop: 20}}>Connecting to Arena...</div>;

  const colors = ["#ff4d4d", "#4dff4d", "#ffd24d", "#4d4dff"];
  const START_OFFSETS = [0, 13, 26, 39];
  const SAFE_CELLS = [
    {r:13, c:6, color: "#ffcccc"}, {r:6, c:1, color: "#ccffcc"}, 
    {r:1, c:8, color: "#ffffcc"}, {r:8, c:13, color: "#ccccff"},
    {r:8, c:2, color: "#e6e6e6"}, {r:2, c:6, color: "#e6e6e6"},
    {r:6, c:12, color: "#e6e6e6"}, {r:12, c:8, color: "#e6e6e6"}
  ];

  const getGridPosition = (playerIndex, pieceIndex, pos) => {
    if (pos === -1) return BASE_POSITIONS[playerIndex][pieceIndex];
    if (pos === 57) return { r: 7, c: 7 }; // Goal
    
    // Logic: 0-50 are perimeter steps (51 total cells)
    if (pos < 51) {
      const globalPos = (pos + START_OFFSETS[playerIndex]) % 52;
      return COMMON_PATH[globalPos];
    }
    
    // Logic: 51-56 are home stretch steps
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
          
          // Background Color Logic for Home Stretches
          if (safeData) bg = safeData.color;
          else if (r === 7 && c >= 1 && c <= 6) bg = "#ccffcc"; // Green
          else if (c === 7 && r >= 1 && r <= 6) bg = "#ffffcc"; // Yellow
          else if (r === 7 && c >= 8 && c <= 13) bg = "#ccccff"; // Blue
          else if (c === 7 && r >= 8 && r <= 13) bg = "#ffcccc"; // Red

          return <div key={i} style={{ backgroundColor: bg, gridRow: r+1, gridColumn: c+1, display: "flex", justifyContent: "center", alignItems: "center", color: "#ccc" }}>{safeData ? "★" : ""}</div>;
        })}

        {/* Bases & Finish */}
        <div style={{gridArea: "1 / 1 / 7 / 7", background: "#4dff4d", zIndex: 2, border: "2px solid #333"}}></div>
        <div style={{gridArea: "1 / 10 / 7 / 16", background: "#ffd24d", zIndex: 2, border: "2px solid #333"}}></div>
        <div style={{gridArea: "10 / 1 / 16 / 7", background: "#ff4d4d", zIndex: 2, border: "2px solid #333"}}></div>
        <div style={{gridArea: "10 / 10 / 16 / 16", background: "#4d4dff", zIndex: 2, border: "2px solid #333"}}></div>
        <div style={{gridArea: "7 / 7 / 10 / 10", background: "gold", zIndex: 2, display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold"}}>GOAL</div>

        {/* Pieces */}
        {room.players.map((player, pIndex) =>
          player.pieces.map((pos, pieceIndex) => {
            const { r, c } = getGridPosition(pIndex, pieceIndex, pos);
            const canClick = isMyTurn && room.turn === pIndex && room.lastDice !== null;
            return (
              <div
                key={`${pIndex}-${pieceIndex}`}
                onClick={() => canClick && socket.emit("move-piece", { roomId, pieceIndex, userId })}
                style={{
                  gridRow: r + 1, gridColumn: c + 1, backgroundColor: colors[pIndex], borderRadius: "50%",
                  margin: "15%", border: "2px solid #000", zIndex: 10, cursor: canClick ? "pointer" : "default",
                  boxShadow: canClick ? "0 0 8px 2px white" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"
                }}
              >
                {pieceIndex + 1}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
