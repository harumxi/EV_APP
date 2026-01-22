/* ==========================================
   REAL-TIME FRIEND MAP SERVER (Node.js)
   Run: node socket_server.js
   ========================================== */

const io = require("socket.io")(3000, {
    cors: {
        origin: "*", // Allow connections from your XAMPP frontend
        methods: ["GET", "POST"]
    }
});

console.log("📍 Socket Server running on port 3000");

io.on("connection", (socket) => {
    // 1. REGISTER: User connects and identifies themselves
    socket.on("register", (userId) => {
        socket.userId = userId;
        console.log(`User ${userId} connected`);
    });

    // 2. WATCH: User wants to see updates from a specific friend
    socket.on("watch_friend", (friendId) => {
        // Join a room named after the friend's ID
        // When that friend moves, they will emit to this room
        const roomName = `track_${friendId}`;
        socket.join(roomName);
        console.log(`User ${socket.userId} is watching ${friendId}`);
    });

    // 3. UPDATE: User moves
    socket.on("update_location", (data) => {
        if (!socket.userId) return;
        
        // Broadcast to everyone watching this user
        const roomName = `track_${socket.userId}`;
        io.to(roomName).emit("friend_moved", {
            userId: socket.userId,
            lat: data.lat,
            lng: data.lng,
            timestamp: Date.now()
        });
    });

    // 4. SOS: User triggers emergency
    socket.on("sos_signal", (data) => {
        if (!socket.userId) return;
        
        // Broadcast to everyone watching this user (friends)
        const roomName = `track_${socket.userId}`;
        io.to(roomName).emit("sos_alert", {
            userId: socket.userId,
            name: data.name || "Friend",
            lat: data.lat,
            lng: data.lng,
            timestamp: Date.now()
        });
        console.log(`🚨 SOS triggered by User ${socket.userId}`);
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.userId} disconnected`);
    });
});