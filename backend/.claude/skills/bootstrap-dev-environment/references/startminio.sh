sudo docker run -d \
  --name <project>-minio \
  -e MINIO_ROOT_USER=rootuser \
  -e MINIO_ROOT_PASSWORD=<password> \
  -p <port>:9000 \
  -p <port2>:9001 \
  -v <project>-minio:/data \
  minio/minio server /data --console-address ":9001"
