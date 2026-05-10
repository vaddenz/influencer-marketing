# NextJS Frontend

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser.

## Build

```bash
yarn build
```

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - Backend API base URL (default: '')
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` - Umami website ID

## Docker Deployment

### 1. Create Network

Create a shared network for frontend, backend, and traefik containers.

```bash
docker network create PROJECTNAME-net
```

### 2. Build Frontend Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://HOSTNAME/api/v1 \
  --build-arg NEXT_PUBLIC_UMAMI_WEBSITE_ID=<website-id> \
  -t PROJECTNAME-frontend .
```

### 3. Run Frontend Container

Run the frontend container on the shared network.

```bash
docker run -d \
  --name frontend \
  --network PROJECTNAME-net \
  --restart unless-stopped \
  PROJECTNAME-frontend
```

> **Note:** The container exposes port 3000 internally. It will be accessed via Traefik.

### 4. Traefik Gateway

The project includes a Traefik configuration to handle routing and SSL termination for domains.
See [traefik/README.md](./traefik/README.md) for detailed instructions on setting up the Traefik gateway.

Quick start for Traefik:

```bash
cd traefik
docker build -t PROJECTNAME-traefik .

# Create acme.json for SSL certificates
touch acme.json && chmod 600 acme.json

# Run Traefik
docker run -d \
  --name traefik \
  --network PROJECTNAME-net \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/acme.json:/etc/traefik/acme.json \
  -v /var/run/docker.sock:/var/run/docker.sock \
  PROJECTNAME-traefik
```
