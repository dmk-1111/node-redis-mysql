#Requirement dependencies:
```
npm install && npm i express mysql2 redis ejs dotenv && npm i -D nodemon
```

#Set up MySql Docker's container
```
sudo docker pull mysql:8.0

sudo docker run --name mysql-container --network app-network -e MYSQL_ROOT_PASSWORD=xxx -p 3306:3306 -d mysql:8.0
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
