const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active rooms and participants
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Join room with user metadata
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    // Add user to room with metadata
    rooms.get(roomId).set(userId, { 
      userName,
      socketId: socket.id
    });
    
    // Get all users in the room
    const users = Array.from(rooms.get(roomId).entries()).map(([id, data]) => ({
      userId: id,
      userName: data.userName
    }));
    
    // Notify the new user about existing participants
    socket.emit('existing-users', users.filter(user => user.userId !== userId));
    
    // Notify others about the new user
    socket.to(roomId).emit('user-connected', userId, userName);
    
    // Send system message about new user joining
    io.to(roomId).emit('chat-message', {
      userId: 'system',
      userName: 'System',
      message: `${userName} has joined the meeting`,
      timestamp: new Date().toISOString()
    });
    
    // Update participants list for everyone in the room
    io.to(roomId).emit('update-participants', users);
    
    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
  });

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    if (data.to) {
      // Send to specific user
      const targetUser = rooms.get(data.roomId)?.get(data.to);
      if (targetUser) {
        io.to(targetUser.socketId).emit('signal', {
          from: data.from,
          signal: data.signal,
          roomId: data.roomId
        });
      }
    } else {
      // Broadcast to all in room except sender
      socket.to(data.roomId).emit('signal', {
        from: data.from,
        signal: data.signal,
        roomId: data.roomId
      });
    }
  });

  // Handle chat messages
  socket.on('chat-message', (messageData, roomId) => {
    console.log('Received chat message:', messageData, 'in room:', roomId);
    const participants = rooms.get(roomId);
    if (participants) {
      // Send to everyone in the room including sender
      io.to(roomId).emit('chat-message', messageData);
      console.log('Broadcasting message to room:', roomId, 'from user:', messageData.userName);
    }
  });

  // Handle raise hand
  socket.on('raise-hand', (data) => {
    const { roomId, userId, userName, timestamp } = data;
    console.log('Raise hand event:', data);
    
    // Notify everyone in the room about the raised hand
    io.to(roomId).emit('hand-raised', {
      userId: userId,
      userName: userName,
      timestamp: timestamp
    });
  });

  // Handle lower hand
  socket.on('lower-hand', (data) => {
    const { roomId, userId, userName, timestamp } = data;
    console.log('Lower hand event:', data);
    
    // Notify everyone in the room about the lowered hand
    io.to(roomId).emit('hand-lowered', {
      userId: userId,
      userName: userName,
      timestamp: timestamp
    });
  });

  // Add this to your socket.io connection handler:
  socket.on('private-message', (data) => {
    const { toUserId, message, roomId } = data;
    const participants = rooms.get(roomId);
    
    if (participants) {
      const senderData = participants.get(socket.id);
      const recipientData = participants.get(toUserId);
      
      if (senderData && recipientData) {
        const messageData = {
          fromUserId: socket.id,
          fromUserName: senderData.userName,
          toUserId: toUserId,
          message: message,
          timestamp: new Date().toISOString(),
          isPrivate: true
        };
        
        // Send to recipient
        io.to(recipientData.socketId).emit('private-message', messageData);
        
        // Send back to sender for their own chat UI
        socket.emit('private-message', {
          ...messageData,
          isSelf: true
        });
      }
    }
  });

  // Handle participant leaving
  socket.on('leave-room', (roomId) => {
    if (rooms.has(roomId)) {
      const userName = rooms.get(roomId).get(socket.id)?.userName;
      rooms.get(roomId).delete(socket.id);
      
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
      
      socket.to(roomId).emit('user-disconnected', socket.id);
      
      // Send system message about user leaving
      if (userName) {
        io.to(roomId).emit('chat-message', {
          userId: 'system',
          userName: 'System',
          message: `${userName} has left the meeting`,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`User left room ${roomId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    // Clean up rooms when user disconnects
    rooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        const userName = participants.get(socket.id)?.userName;
        participants.delete(socket.id);
        if (participants.size === 0) {
          rooms.delete(roomId);
        }
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // Send system message about user leaving
        if (userName) {
          io.to(roomId).emit('chat-message', {
            userId: 'system',
            userName: 'System',
            message: `${userName} has left the meeting`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});