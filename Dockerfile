FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env .

RUN npm run build

# Ensure the build output is present
RUN ls -la /usr/src/app/dist

EXPOSE 4000

CMD ["node", "dist/server.js"]
