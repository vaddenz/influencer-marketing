sudo docker run -d \
  --name <project>-postgres \
  --platform linux/arm64 \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_USER=rootuser \
  -e POSTGRES_DB=develop \
  -p <port>:5432 \
  -v <project>-postgres:/var/lib/postgresql/data \
  postgres:15