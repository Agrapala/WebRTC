// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const joinModal = document.getElementById('joinModal');
const userNameInput = document.getElementById('userName');
const roomInput = document.getElementById('roomInput');
const joinButton = document.getElementById('joinButton');
const muteButton = document.getElementById('muteButton');
const cameraButton = document.getElementById('cameraButton');
const screenShareButton = document.getElementById('screenShareButton');
const chatButton = document.getElementById('chatButton');
const sidebar = document.getElementById('sidebar');
const chatSection = document.getElementById('chatSection');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const leaveButton = document.getElementById('leaveButton');
const roomIdSpan = document.getElementById('roomId');
const copyMeetingIdButton = document.getElementById('copyMeetingId');
const raiseHandButton = document.getElementById('raiseHandButton');

// State variables
let localStream;
let screenStream;
let peers = {};
let currentRoom;
let userName;
let isScreenSharing = false;
let myPeerId = null;
let isHandRaised = false;
let raisedHands = new Set();

// Initialize Socket.IO
const socket = io();

// Initialize PeerJS
const peer = new Peer({
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  }
});

peer.on('open', (id) => {
  myPeerId = id;
  console.log('My peer ID is:', id);
});

peer.on('error', (err) => {
  console.error('PeerJS error:', err);
});

// Show join modal on page load
joinModal.classList.add('active');

// Initialize sidebar sections
chatSection.classList.add('hidden');

// Join meeting handler
joinButton.addEventListener('click', () => {
  userName = userNameInput.value.trim();
  const roomId = roomInput.value.trim();
  
  if (userName && roomId) {
    joinMeeting(roomId);
  } else {
    alert('Please enter both your name and a meeting ID');
  }
});

// Join meeting function
async function joinMeeting(roomId) {
  try {
    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // Hide join modal
    joinModal.classList.remove('active');
    
    // Update room ID display
    roomIdSpan.textContent = roomId;
    currentRoom = roomId;

    // Add local video
    addVideoStream(myPeerId, localStream, userName);

    // Join room with PeerJS ID
    socket.emit('join-room', roomId, myPeerId, userName);

    // Send welcome message
    const welcomeMessage = {
      userId: 'system',
      userName: 'System',
      message: `Welcome to the meeting, ${userName}!`,
      timestamp: new Date().toISOString()
    };
    socket.emit('chat-message', welcomeMessage, currentRoom);
  } catch (error) {
    console.error('Error accessing media devices:', error);
    alert('Error accessing camera and microphone. Please make sure you have granted the necessary permissions.');
  }
}

// Handle incoming connections
peer.on('call', (call) => {
  call.answer(localStream);
  call.on('stream', (remoteStream) => {
    addVideoStream(call.peer, remoteStream);
  });
  
  call.on('close', () => {
    removeVideoStream(call.peer);
  });
  
  peers[call.peer] = call;
});

// Socket event handlers
socket.on('existing-users', (users) => {
  console.log('Existing users:', users);
  users.forEach(user => {
    connectToPeer(user.userId, user.userName);
  });
});

socket.on('user-connected', (userId, userName) => {
  console.log('User connected:', userId, userName);
  if (userId !== myPeerId) {
    connectToPeer(userId, userName);
  }
});

socket.on('user-disconnected', (userId) => {
  console.log('User disconnected:', userId);
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
  removeVideoStream(userId);
});

socket.on('signal', (data) => {
  if (data.from && peers[data.from]) {
    peers[data.from].signal(data.signal);
  }
});

// Connect to a peer
function connectToPeer(userId, userName) {
  if (userId === myPeerId || peers[userId]) return;
  
  const call = peer.call(userId, localStream);
  call.on('stream', (remoteStream) => {
    addVideoStream(userId, remoteStream, userName);
  });
  
  call.on('close', () => {
    removeVideoStream(userId);
  });
  
  call.on('error', (err) => {
    console.error('Peer call error:', err);
  });
  
  peers[userId] = call;
}

// Add video stream to grid
function addVideoStream(userId, stream, name) {
  // Check if video element already exists
  const existingContainer = document.getElementById(`video-${userId}`);
  if (existingContainer) {
    const video = existingContainer.querySelector('video');
    video.srcObject = stream;
    // Update the name if it's different
    const nameTag = existingContainer.querySelector('.participant-name');
    if (nameTag && name) {
      nameTag.textContent = name;
    }
    return;
  }

  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';
  videoContainer.id = `video-${userId}`;

  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsinline = true;
  
  if (userId === myPeerId) {
    video.muted = true;
  }

  const nameTag = document.createElement('div');
  nameTag.className = 'participant-name';
  nameTag.textContent = name || 'Unknown User';

  videoContainer.appendChild(video);
  videoContainer.appendChild(nameTag);
  videoGrid.appendChild(videoContainer);

  // Adjust grid layout based on number of participants
  adjustVideoGridLayout();
}

function removeVideoStream(userId) {
  const videoContainer = document.getElementById(`video-${userId}`);
  if (videoContainer) {
    videoContainer.remove();
    adjustVideoGridLayout();
  }
}

function adjustVideoGridLayout() {
  const videoContainers = document.querySelectorAll('.video-container');
  const count = videoContainers.length;
  
  if (count <= 2) {
    videoGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
  } else if (count <= 4) {
    videoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
  } else {
    videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
  }
}

// Toggle mute
muteButton.addEventListener('click', () => {
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    muteButton.classList.toggle('active');
    muteButton.innerHTML = audioTrack.enabled ? 
      '<i class="fas fa-microphone"></i>' : 
      '<i class="fas fa-microphone-slash"></i>';
  }
});

// Toggle camera
cameraButton.addEventListener('click', () => {
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    cameraButton.classList.toggle('active');
    cameraButton.innerHTML = videoTrack.enabled ? 
      '<i class="fas fa-video"></i>' : 
      '<i class="fas fa-video-slash"></i>';
  }
});

// Toggle screen sharing
screenShareButton.addEventListener('click', async () => {
  try {
    if (!isScreenSharing) {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      const videoTrack = screenStream.getVideoTracks()[0];
      const currentVideoTrack = localStream.getVideoTracks()[0];
      currentVideoTrack.stop();
      localStream.removeTrack(currentVideoTrack);
      localStream.addTrack(videoTrack);
      
      videoTrack.onended = () => {
        stopScreenSharing();
      };
      
      isScreenSharing = true;
      screenShareButton.classList.add('active');
      
      // Replace track in all peer connections
      Object.keys(peers).forEach(userId => {
        const sender = peers[userId].peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    } else {
      stopScreenSharing();
    }
  } catch (error) {
    console.error('Error sharing screen:', error);
  }
});

// Stop screen sharing
function stopScreenSharing() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    const currentVideoTrack = localStream.getVideoTracks()[0];
    currentVideoTrack.stop();
    localStream.removeTrack(currentVideoTrack);
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        const newVideoTrack = stream.getVideoTracks()[0];
        localStream.addTrack(newVideoTrack);
        
        // Replace track in all peer connections
        Object.keys(peers).forEach(userId => {
          const sender = peers[userId].peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        });
        
        stream.getTracks().forEach(track => {
          if (track.kind === 'video' && track !== newVideoTrack) {
            track.stop();
          }
        });
      });
  }
  
  isScreenSharing = false;
  screenShareButton.classList.remove('active');
}

// Toggle chat
chatButton.addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const chatSection = document.getElementById('chatSection');

  if (sidebar && chatSection) {
    sidebar.classList.toggle('active');
    chatSection.classList.toggle('hidden');
    
    // Scroll to bottom when chat is opened
    if (!chatSection.classList.contains('hidden')) {
      const messages = document.getElementById('messages');
      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
    }
  }
});

// Send chat message
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message && currentRoom) {
    const messageData = {
      userId: myPeerId,
      userName: userName,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    // Emit the message to the server
    socket.emit('chat-message', messageData, currentRoom);
    
    // Add the message to the local chat
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="message-sender">You</span>
        <span class="message-time">${formatTime(messageData.timestamp)}</span>
      </div>
      <div class="message-content">${message}</div>
    `;
    
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Clear the input
    messageInput.value = '';
  }
});

// Handle chat messages
socket.on('chat-message', (data) => {
  console.log('Received chat message:', data);

  const isCurrentUser = data.userId === myPeerId;
  const isSystemMessage = data.userId === 'system';

  // Don't add the message if it's from the current user (we already added it)
  if (isCurrentUser && !isSystemMessage) return;

  const messageElement = document.createElement('div');
  messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
  
  // Different formatting for system messages
  if (isSystemMessage) {
    messageElement.innerHTML = `
      <div class="message-content system">${data.message}</div>
      <small class="message-time">${formatTime(data.timestamp)}</small>
    `;
  } else {
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="message-sender">${isCurrentUser ? 'You' : data.userName}</span>
        <span class="message-time">${formatTime(data.timestamp)}</span>
      </div>
      <div class="message-content">${data.message}</div>
    `;
  }
  
  // Add message to the chat container
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

// Format time helper function
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Copy meeting ID
copyMeetingIdButton.addEventListener('click', () => {
  navigator.clipboard.writeText(currentRoom)
    .then(() => {
      copyMeetingIdButton.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyMeetingIdButton.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);
    })
    .catch(error => console.error('Error copying meeting ID:', error));
});

// Leave meeting
leaveButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to leave the meeting?')) {
    socket.emit('leave-room', currentRoom);
    window.location.reload();
  }
});

// Handle raise hand button click
raiseHandButton.addEventListener('click', () => {
  if (currentRoom) {
    isHandRaised = !isHandRaised;
    if (isHandRaised) {
      socket.emit('raise-hand', {
        roomId: currentRoom,
        userId: myPeerId,
        userName: userName,
        timestamp: new Date().toISOString()
      });
      raiseHandButton.classList.add('active');
      // Add raised hand indicator to local video
      const localVideoContainer = document.querySelector(`#video-${myPeerId}`);
      if (localVideoContainer) {
        localVideoContainer.classList.add('hand-raised');
      }
    } else {
      socket.emit('lower-hand', {
        roomId: currentRoom,
        userId: myPeerId,
        userName: userName,
        timestamp: new Date().toISOString()
      });
      raiseHandButton.classList.remove('active');
      // Remove raised hand indicator from local video
      const localVideoContainer = document.querySelector(`#video-${myPeerId}`);
      if (localVideoContainer) {
        localVideoContainer.classList.remove('hand-raised');
      }
    }
  }
});

// Handle hand raised event
socket.on('hand-raised', (data) => {
  console.log('Hand raised event received:', data);
  raisedHands.add(data.userId);
  
  // Add raised hand indicator to the video
  const videoContainer = document.querySelector(`#video-${data.userId}`);
  if (videoContainer) {
    videoContainer.classList.add('hand-raised');
  }
  
  // Add system message
  const messageElement = document.createElement('div');
  messageElement.className = 'message system';
  messageElement.innerHTML = `
    <div class="message-content system">
      <i class="fas fa-hand-paper"></i> ${data.userName} raised their hand
    </div>
    <small class="message-time">${formatTime(data.timestamp)}</small>
  `;
  
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

// Handle hand lowered event
socket.on('hand-lowered', (data) => {
  console.log('Hand lowered event received:', data);
  raisedHands.delete(data.userId);
  
  // Remove raised hand indicator from the video
  const videoContainer = document.querySelector(`#video-${data.userId}`);
  if (videoContainer) {
    videoContainer.classList.remove('hand-raised');
  }
  
  // Add system message
  const messageElement = document.createElement('div');
  messageElement.className = 'message system';
  messageElement.innerHTML = `
    <div class="message-content system">
      <i class="fas fa-hand-paper"></i> ${data.userName} lowered their hand
    </div>
    <small class="message-time">${formatTime(data.timestamp)}</small>
  `;
  
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

// Add Enter key support for sending messages
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});