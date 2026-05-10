# AgentPlanet Traefik Gateway

This directory contains the Dockerfile and configuration for the Traefik reverse proxy.

## Setup

1.  **Build the Image:**

    ```bash
    docker build -t agentplanet-traefik .
    ```

2.  **Run the Container:**

    You need to ensure the container is on the same Docker network as your `frontend` and `backend` containers.
    You also need to mount a volume for `acme.json` to persist SSL certificates.

    ```bash
    # Create the acme.json file on host first
    touch acme.json
    chmod 600 acme.json

    docker run -d \
      --name traefik \
      --network your-app-network \
      -p 80:80 \
      -p 443:443 \
      -v $(pwd)/acme.json:/etc/traefik/acme.json \
      agentplanet-traefik
    ```

## Configuration

-   **traefik.yml**: Main configuration (EntryPoints, CertResolver).
-   **dynamic.yml**: Routing rules.
    -   `agentplanet.io` & `agentplanet.com.cn` -> `frontend:3000`
    -   `/api/v1` -> `backend:3000`
