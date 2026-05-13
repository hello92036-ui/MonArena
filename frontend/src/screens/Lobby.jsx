import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { io } from "socket.io-client";

const BACKEND_URL = "https://monarena.onrender.com";

export function Lobby({ onNavigate, onJoinRoom }) {
  const { address } = useAccount();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;
    socket.on("connect", () => setLoading(false));
    socket.on("roomsUpdated", (updatedRooms) => setRooms(updatedRooms));
    socket.on("disconnect", () => setLoading(true));
    return () => socket.disconnect();
  }, []);

  const handleCreate = () => {
    const roomId = `room_${Date.now()}`;
    const room = { id: roomId, name: `${address?.slice(0,6)}'s Arena`, entryFee: 1 };
    socketRef.current?.emit("create-room", { roomId, userId: address });
    onJoinRoom(room);
  };

  return (
    <div style={{ padding: "20px", color: "var(--ink)", maxWidth: "500px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px" }}>The Arena</h1>
      </header>
      <button onClick={handleCreate}
        style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "var(--ink)", color: "white", fontWeight: "800", border: "none", marginBottom: "20px", cursor: "pointer" }}>
        + Create New Match
      </button>
      <h3 style={{ marginBottom: "12px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Live Matches</h3>
      {loading ? <p>Scanning Arena...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rooms.length === 0 && <p style={{ color: "var(--muted)" }}>No matches found. Create one!</p>}
          {rooms.map(room => (
            <div key={room.id} style={{ background: "white", padding: "15px", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700" }}>{room.name}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>Entry: {room.entryFee} MON</div>
              </div>
              <button onClick={() => onJoinRoom(room)}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "var(--coral)", color: "white", border: "none", fontWeight: "700", cursor: "pointer" }}>
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
