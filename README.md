# WebRTC Video Conferencing Application

A real-time video conferencing application built with WebRTC, Node.js, and Socket.IO.

## Features

- Real-time video and audio communication
- Screen sharing
- Chat functionality
- Raise hand feature
- Private messaging
- Room-based meetings
- Participant management

## Prerequisites

- Node.js (v18 or higher)
- Docker
- Kubernetes cluster
- Git

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/samithaagrapala/webrtc-app.git
cd webrtc-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Docker Deployment

1. Build the Docker image:
```bash
docker build -t webrtc-app:latest .
```

2. Run the container:
```bash
docker run -p 3000:3000 webrtc-app:latest
```

## Kubernetes Deployment

1. Apply the Kubernetes manifests:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

2. Check the deployment status:
```bash
kubectl get pods
kubectl get services
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The workflow:

1. Builds and tests the application
2. Creates a Docker image
3. Pushes the image to GitHub Container Registry
4. Deploys to Kubernetes

The workflow is triggered on:
- Push to main branch
- Pull requests to main branch

## Project Structure

```
webrtc-app/
├── public/           # Static files and frontend code
├── k8s/             # Kubernetes manifests
│   ├── deployment.yaml
│   └── service.yaml
├── .github/         # GitHub Actions workflow
│   └── workflows/
│       └── deploy.yml
├── server.js        # Backend server
├── package.json     # Project dependencies
└── Dockerfile       # Docker configuration
```

## Environment Variables

- `PORT`: Server port (default: 3000)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.