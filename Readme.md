#Requirement dependencies:
```
npm install && npm i express pg redis ejs dotenv && npm i -D nodemon
```

#Set up MySql Docker's container
```
sudo docker pull postgres:14

sudo docker run --network node-db-redis_app-network -p 5433:5432 --name postgres-xxx -e POSTGRES_PASSWORD=xxx -d postgres:14
```

#Execute into Postgres SQL:
```
sudo docker exec -it postgres_docker_container_name psql -U postgres
```

#Set up Redis Docker's container
```
sudo docker pull redis:8

sudo docker run -d \
  --name redis-container \
  --network app-network \
  -p 6379:6379 \
  -v redis-data:/data \
  --restart unless-stopped \
  redis:8 \
  redis-server --appendonly yes

sudo docker exec -it redis-container redis-cli

```

#Set up Tailwind CSS
```
npm install tailwindcss @tailwindcss/cli

npx @tailwindcss/cli -i ./public/css/input/input.css -o ./public/css/output/output.css --watch
```
