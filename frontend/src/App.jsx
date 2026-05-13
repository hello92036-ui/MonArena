import { useState } from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { LoginScreen } from "./screens/LoginScreen";
import { Lobby } from "./screens/Lobby";
import { GameRoom } from "./screens/GameRoom";
import { TopBar } from "./components/TopBar";
import { BottomNav } from "./components/BottomNav";
import { MatchHistory } from "./screens/MatchHistory";
import { MySquad } from "./screens/MySquad";
import { Profile } from "./screens/Profile";

export default function App() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const [tab, setTab] = useState("lobby");
  const [activeRoom, setActiveRoom] = useState(null);

  if (!isConnected) return <LoginScreen onConnectClick={() => open()} />;

  if (activeRoom) return <GameRoom room={activeRoom} onLeave={() => setActiveRoom(null)} />;

  const renderTab = () => {
    switch (tab) {
      case "lobby":   return <Lobby onNavigate={setTab} onJoinRoom={setActiveRoom} />;
      case "history": return <MatchHistory />;
      case "squad":   return <MySquad />;
      case "profile": return <Profile />;
      default:        return <Lobby onNavigate={setTab} onJoinRoom={setActiveRoom} />;
    }
  };

  return (
    <div style={{ minHeight: "100svh", background: "hsl(36 100% 96%)", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <TopBar onProfileClick={() => setTab("profile")} />
      <div style={{ flex: 1, paddingTop: 56, paddingBottom: 64, overflowY: "auto" }}>
        {renderTab()}
      </div>
      <BottomNav current={tab} onChange={setTab} />
    </div>
  );
}
