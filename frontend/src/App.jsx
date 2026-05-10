import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { WalletModal } from "./components/WalletModal.jsx";
import { Lobby } from "./screens/Lobby.jsx";
import { GameRoom } from "./screens/GameRoom.jsx";
import { Profile } from "./screens/Profile.jsx";
import { MatchHistory } from "./screens/MatchHistory.jsx";
import { MySquad } from "./screens/MySquad.jsx";
import { LoginScreen } from "./screens/LoginScreen.jsx";

export default function App() {
  const { isConnected } = useAccount();
  const [screen, setScreen] = useState("login");
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  const handleConnected = () => {
    setWalletOpen(false);
    setScreen("lobby");
  };

  const handleNavigate = (key) => setScreen(key);

  const handleJoinRoom = (room) => {
    setActiveRoom(room);
    setScreen("game");
  };

  const handleLeaveGame = () => {
    setScreen("lobby");
    setActiveRoom(null);
  };

  const handleDisconnect = () => {
    setScreen("login");
  };

  return (
    <>
      {screen === "login" && (
        <LoginScreen onConnectClick={() => setWalletOpen(true)} />
      )}
      {screen === "lobby" && (
        <Lobby onNavigate={handleNavigate} onJoinRoom={handleJoinRoom} />
      )}
      {screen === "game" && (
        <GameRoom room={activeRoom} onLeave={handleLeaveGame} />
      )}
      {screen === "profile" && (
        <Profile onNavigate={handleNavigate} onDisconnect={handleDisconnect} />
      )}
      {screen === "history" && (
        <MatchHistory onNavigate={handleNavigate} />
      )}
      {screen === "squad" && (
        <MySquad onNavigate={handleNavigate} />
      )}
      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnected={handleConnected}
      />
    </>
  );
}
