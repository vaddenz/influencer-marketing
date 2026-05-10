FROM traefik:v3.3

COPY traefik.yml /etc/traefik/traefik.yml
COPY dynamic.yml /etc/traefik/dynamic.yml

# Ensure acme.json exists and has correct permissions
RUN touch /etc/traefik/acme.json && chmod 600 /etc/traefik/acme.json
