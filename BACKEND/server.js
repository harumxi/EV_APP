const http = require('http');
const { Server } = require("socket.io");

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Store user sockets: userId -> socketId
const userSockets = {}; 

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle registration (User logs in/opens app)
  socket.on("register", (userId) => {
    userSockets[userId] = socket.id;
    socket.userId = userId; // Store on socket object
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Handle location updates
  socket.on("update_location", (data) => {
    console.log(`📍 Update from User ${socket.userId}:`, data);
    // data = { lat, lng }
    // Broadcast to friends who are watching this user
    // In a real app, you'd look up friends in DB. 
    // For now, we can broadcast to everyone or implement rooms.
    // friends_map.html emits 'watch_friend', let's use rooms.
    
    // Actually, friends_map.html emits 'watch_friend' with friend's ID.
    // So if User A watches User B, User A joins room "watch_B".
    // When User B updates location, we emit to room "watch_B".
    
    if (socket.userId) {
        // Broadcast to anyone watching this user
        io.to(`watch_${socket.userId}`).emit("friend_moved", {
            userId: socket.userId,
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date()
        });
    }
  });

  // Handle watching a friend
  socket.on("watch_friend", (friendId) => {
      socket.join(`watch_${friendId}`);
      console.log(`Socket ${socket.id} is watching User ${friendId}`);
  });

  // Handle SOS
  socket.on("sos_signal", (data) => {
      // Broadcast SOS to everyone (or specific contacts)
      io.emit("sos_alert", {
          userId: socket.userId,
          name: data.name,
          lat: data.lat,
          lng: data.lng
      });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Cleanup if needed
  });
});

httpServer.listen(3000, () => {
  console.log("✅ Socket.IO Server running on port 3000");
});