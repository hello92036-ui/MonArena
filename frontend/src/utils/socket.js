import { io } from "socket.io-client";

console.log("SOCKET INIT");

const socket = io("http://127.0.0.1:8080", {
  transports: ["polling", "websocket"],
  timeout: 20000
});

socket.on("connect", () => {
  console.log("CONNECTED:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("CONNECT ERROR:", err.message);
});

export default socket;
