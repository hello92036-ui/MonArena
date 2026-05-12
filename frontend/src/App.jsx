import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { parseEther, stringToHex } from "viem";
import socket from "./utils/socket";
import Board from "./Board";
import abi from "./abi.json";

const CONTRACT_ADDRESS = "0xd320b75Eb0889daf9Ff081bb2051082aa6275683";

export default function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);
  const [winData, setWinData] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { writeContractAsync, data: hash } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isConnected || !address) return;
    
    // Recovery Logic: If page refreshes, ask server for room state
    const savedRoom = localStorage.getItem("monarena_room");
    if (savedRoom) {
      setRoomId(savedRoom);
      socket.emit("join-room", { roomId: savedRoom, userId: address });
    }

    socket.on("room-update", (data) => {
      console.log("Syncing State:", data.started ? "PLAYING" : "LOBBY");
      setRoom(data);
      localStorage.setItem("monarena_room", data.roomId);
    });

    socket.on("game-won", (data) => { setWinData(data); });

    return () => {
      socket.off("room-update");
      socket.off("game-won");
    };
  }, [isConnected, address]);

  const handleBet = async (action, id) => {
    setIsPending(true);
    setPendingAction(action);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "bet",
        args: [stringToHex(id, { size: 32 })],
        value: parseEther("1"),
        gas: 500000n,
      });
    } catch (e) { alert("Bet failed"); setIsPending(false); }
  };

  useEffect(() => {
    if (txConfirmed && isPending) {
      socket.emit(pendingAction === "create" ? "create-room" : "join-room", { roomId, userId: address });
      setIsPending(false);
      setPendingAction(null);
    }
  }, [txConfirmed]);

  if (!isConnected) return <div style={{textAlign:"center", padding:"50px", color:"white"}}><button onClick={() => open()}>Connect Wallet</button></div>;

  return (
    <div style={{ padding: "10px", background: "#111", color: "white", minHeight: "100vh" }}>
      <div style={{display:"flex", justifyContent:"space-between", background:"#222", padding:"10px", borderRadius:"8px", marginBottom:"10px"}}>
        <span>{address.substring(0,6)}...</span>
        <div style={{display:"flex", gap:"5px"}}>
            <button onClick={async () => {
                await writeContractAsync({ address: CONTRACT_ADDRESS, abi, functionName: "withdraw" });
            }} style={{background:"#22c55e", fontSize:"10px"}}>Withdraw</button>
            <button onClick={() => disconnect()} style={{background:"#ff4d4d", fontSize:"10px"}}>Exit</button>
        </div>
      </div>

      {winData ? (
        <div style={{textAlign:"center", padding:"20px", background:"#333"}}>
          <h2>{winData.winner === address ? "🏆 YOU WON!" : "💀 DEFEAT"}</h2>
          {winData.winner === address && <button onClick={() => {/* claim logic */}} style={{background:"gold"}}>CLAIM MON</button>}
          <button onClick={() => { localStorage.removeItem("monarena_room"); window.location.reload(); }}>Home</button>
        </div>
      ) : (
        <>
          {!room && (
            <div style={{display:"flex", gap:"10px", marginBottom:"20px"}}>
                <button onClick={() => { const id="room-"+Math.floor(Math.random()*9000); setRoomId(id); handleBet("create", id); }}>Create</button>
                <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID" style={{width:"80px"}}/>
                <button onClick={() => handleBet("join", roomId)}>Join</button>
            </div>
          )}

          {room && !room.started && (
            <div style={{padding:"20px", background:"#222", borderRadius:"8px", textAlign:"center", marginBottom:"20px"}}>
               <h3>Lobby: {room.roomId}</h3>
               <p>Players: {room.players.length} / 4</p>
               {address === room.host && room.players.length >= 2 && (
                 <button onClick={() => socket.emit("start-game", { roomId: room.roomId, userId: address })} style={{background:"gold", color:"black"}}>START MATCH</button>
               )}
               <button onClick={() => { localStorage.removeItem("monarena_room"); window.location.reload(); }} style={{marginTop:"10px", background:"#444"}}>Leave</button>
            </div>
          )}

          {room && room.started && (
            <>
              <div style={{display:"flex", justifyContent:"center", gap:"10px", marginBottom:"10px"}}>
                <button onClick={() => socket.emit("roll-dice", { roomId: room.roomId, userId: address })} style={{background:"white", color:"black"}}>Roll Dice</button>
              </div>
              <Board room={room} socket={socket} roomId={room.roomId} userId={address} />
            </>
          )}
        </>
      )}
    </div>
  );
}
