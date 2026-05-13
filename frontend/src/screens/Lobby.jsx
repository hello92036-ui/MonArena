import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { io } from "socket.io-client";
import { parseEther } from "viem";

const BACKEND_URL = "https://monarena.onrender.com";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ENTRY_FEE = "1";

const ABI = [
  { inputs: [{ internalType: "bytes32", name: "roomId", type: "bytes32" }], name: "bet", outputs: [], stateMutability: "payable", type: "function" },
];

function roomIdToBytes32(roomId) {
  const hex = Buffer.from(roomId.slice(0, 32).padEnd(32, "\0")).toString("hex");
  return `0x${hex}`;
}

export function Lobby({ onNavigate, onJoinRoom }) {
  const { address } = useAccount();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const socketRef = useRef(null);

  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;
    socket.on("connect", () => setLoading(false));
    socket.on("roomsUpdated", (updatedRooms) => setRooms(updatedRooms));
    socket.on("disconnect", () => setLoading(true));
    return () => socket.disconnect();
  }, []);

  // After tx confirmed, enter the room
  useEffect(() => {
    if (txConfirmed && pendingRoom && pendingAction) {
      const { roomId, room } = pendingRoom;
      if (pendingAction === "create") {
        socketRef.current?.emit("create-room", { roomId, userId: address });
      } else {
        socketRef.current?.emit("join-room", { roomId, userId: address });
      }
      onJoinRoom(room);
      setPendingRoom(null);
      setPendingAction(null);
    }
  }, [txConfirmed]);

  const handleCreate = () => {
    const roomId = `room_${Date.now()}`;
    const room = { id: roomId, _resolvedId: roomId, name: `${address?.slice(0, 6)}'s Arena`, entryFee: ENTRY_FEE };
    setPendingRoom({ roomId, room });
    setPendingAction("create");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "bet",
      args: [roomIdToBytes32(roomId)],
      value: parseEther(ENTRY_FEE),
    });
  };

  const handleJoin = (room) => {
    setPendingRoom({ roomId: room.id, room });
    setPendingAction("join");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "bet",
      args: [roomIdToBytes32(room.id)],
      value: parseEther(String(room.entryFee || ENTRY_FEE)),
    });
  };

  return (
    <div style={{ padding: "20px", color: "var(--ink)", maxWidth: "500px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px" }}>The Arena</h1>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--muted)" }}>Entry Fee</div>
          <div style={{ fontWeight: "800", color: "var(--coral)" }}>{ENTRY_FEE} MON</div>
        </div>
      </header>

      <button onClick={handleCreate} disabled={isTxPending}
        style={{ width: "100%", padding: "16px", borderRadius: "12px", background: isTxPending ? "#999" : "var(--ink)", color: "white", fontWeight: "800", border: "none", marginBottom: "20px", cursor: isTxPending ? "not-allowed" : "pointer" }}>
        {isTxPending && pendingAction === "create" ? "Approving Transaction..." : "+ Create New Match (1 MON)"}
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
              <button onClick={() => handleJoin(room)} disabled={isTxPending}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "var(--coral)", color: "white", border: "none", fontWeight: "700", cursor: "pointer" }}>
                {isTxPending && pendingAction === "join" ? "..." : "Join"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
