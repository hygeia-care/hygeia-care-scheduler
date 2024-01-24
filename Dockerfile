FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY bin/ ./bin
COPY public/ ./public
COPY routes/ ./routes
COPY models/ ./models
COPY tests/ ./tests
COPY app.js .

EXPOSE 3336

CMD npm start

