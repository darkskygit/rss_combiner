FROM node:10.12-alpine as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:10.12-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
COPY --from=builder /usr/src/app/node_modules node_modules
COPY --from=builder /usr/src/app/*.js ./
COPY --from=builder /usr/src/app/package.json .
VOLUME /usr/src/app
CMD node index.js