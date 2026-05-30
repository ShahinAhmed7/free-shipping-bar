FROM node:20-alpine
RUN apk add --no-cache openssl
EXPOSE 3000
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV CACHE_BUST=3
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
RUN npm run build
CMD ["npm", "run", "docker-start"]
