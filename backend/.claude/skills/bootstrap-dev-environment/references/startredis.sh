sudo docker run -d \
  --name <project>-redis \
  -e REDIS_PASSWORD=<password> \
  -p <port>:6379 \
  -v <project>-redis:/data \
  redis:7 redis-server --requirepass <password>
