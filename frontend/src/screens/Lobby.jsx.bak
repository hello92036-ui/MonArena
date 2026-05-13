import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { io } from "socket.io-client";
import { parseEther } from "viem";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://monarena.onrender.com";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ENTRY_FEE = "1";
const ABI = [{ inputs: [{ internalType: "bytes32", name: "roomId", type: "bytes32" }], name: "bet", outputs: [], stateMutability: "payable", type: "function" }];

function toBytes32(str) {
  const hex = Array.from(str.slice(0,32).padEnd(32,"\0")).map(c=>c.charCodeAt(0).toString(16).padStart(2,"0")).join("");
  return `0x${hex}`;
}

export function Lobby({ onNavigate, onJoinRoom }) {
  const { address } = useAccount();
  const [tab, setTab] = useState("main");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const pendingRoomRef = useRef(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (isSuccess && pendingRoomRef.current) {
      const { roomId, room, action } = pendingRoomRef.current;
      socketRef.current?.emit(action === "create" ? "create-room" : "join-room", { roomId, userId: address });
      onJoinRoom(room);
      pendingRoomRef.current = null;
    }
  }, [isSuccess]);

  const handleCreate = () => {
    const roomId = `room_${Date.now()}`;
    const room = { id: roomId, _resolvedId: roomId, name: `${address?.slice(0,6)}'s Arena`, entryFee: ENTRY_FEE };
    pendingRoomRef.current = { roomId, room, action: "create" };
    writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "bet", args: [toBytes32(roomId)], value: parseEther(ENTRY_FEE) });
  };

  const handleJoin = () => {
    const roomId = joinCode.trim();
    if (!roomId) { setError("Enter a room code!"); return; }
    const room = { id: roomId, _resolvedId: roomId, name: "Arena", entryFee: ENTRY_FEE };
    pendingRoomRef.current = { roomId, room, action: "join" };
    setError("");
    writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "bet", args: [toBytes32(roomId)], value: parseEther(ENTRY_FEE) });
  };

  return (
    <div style={{ minHeight: "100svh", background: "hsl(36 100% 96%)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>MonArena</span>
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{address?.slice(0,6)}...{address?.slice(-4)}</div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 40px" }}>

        {tab === "main" && (
          <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, marginBottom: 6 }}>The Arena</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Entry fee: {ENTRY_FEE} MON per player</div>
            </div>
            <button onClick={() => setTab("create")}
              style={{ width: "100%", padding: "20px", borderRadius: 16, border: "none", background: "linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))", color: "white", fontWeight: 800, fontSize: 18, cursor: "pointer" }}>
              🎲 Create Room
            </button>
            <button onClick={() => setTab("join")}
              style={{ width: "100%", padding: "20px", borderRadius: 16, border: "2px solid hsl(36 30% 82%)", background: "white", color: "var(--ink)", fontWeight: 800, fontSize: 18, cursor: "pointer" }}>
              🔗 Join Room
            </button>
          </div>
        )}

        {tab === "create" && (
          <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
            <button onClick={() => setTab("main")} style={{ background: "none", border: "none", color: "var(--muted)", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", fontSize: 14 }}>← Back</button>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create Room</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Pay {ENTRY_FEE} MON to create. Share the code with your opponent.</div>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid hsl(36 30% 87%)", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Entry Fee</div>
              <div style={{ fontWeight: 800, fontSize: 28, color: "var(--coral)" }}>{ENTRY_FEE} MON</div>
            </div>
            <button onClick={handleCreate} disabled={isPending}
              style={{ width: "100%", padding: "18px", borderRadius: 16, border: "none", background: isPending ? "#999" : "linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))", color: "white", fontWeight: 800, fontSize: 16, cursor: isPending ? "not-allowed" : "pointer" }}>
              {isPending ? "Confirm in Wallet..." : "Pay & Create Room"}
            </button>
          </div>
        )}

        {tab === "join" && (
          <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
            <button onClick={() => setTab("main")} style={{ background: "none", border: "none", color: "var(--muted)", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", fontSize: 14 }}>← Back</button>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Join Room</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Enter the room code from your opponent.</div>
            </div>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Enter room code..."
              style={{ width: "100%", padding: "16px", borderRadius: 12, border: "2px solid hsl(36 30% 82%)", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)", background: "white", boxSizing: "border-box", outline: "none" }}
            />
            {error && <div style={{ color: "#FF5A5F", fontSize: 13, fontWeight: 700 }}>{error}</div>}
            <button onClick={handleJoin} disabled={isPending || !joinCode.trim()}
              style={{ width: "100%", padding: "18px", borderRadius: 16, border: "none", background: isPending ? "#999" : "linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))", color: "white", fontWeight: 800, fontSize: 16, cursor: isPending ? "not-allowed" : "pointer" }}>
              {isPending ? "Confirm in Wallet..." : "Pay & Join Room"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
