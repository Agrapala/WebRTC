# WebRTC Video Conferencing Application

A real-time video conferencing application built with WebRTC, Node.js, and Socket.io.

## Features

- Real-time video and audio communication
- Screen sharing
- Chat functionality
- Raise hand feature
- Room-based video calls
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/webrtc-video-conferencing.git
cd webrtc-video-conferencing
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server.js
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Docker Deployment

1. Build the Docker image:
```bash
docker build -t webrtc-video-conferencing:latest .
```

2. Run the container:
```bash
docker run -p 3000:3000 webrtc-video-conferencing:latest
```

## Kubernetes Deployment

1. Apply Kubernetes manifests:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Project Structure

```
webrtc-video-conferencing/
├── public/              # Static files
│   ├── index.html      # Main HTML file
│   ├── style.css       # Styles
│   └── script.js       # Client-side JavaScript
├── server.js           # Server code
├── package.json        # Project dependencies
├── Dockerfile          # Docker configuration
└── k8s/                # Kubernetes manifests
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.