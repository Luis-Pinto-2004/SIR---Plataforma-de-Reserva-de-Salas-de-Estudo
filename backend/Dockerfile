FROM node:20-alpine

# Needed for TLS connections (MongoDB Atlas) and SRV lookups in some environments.
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY package.json ./

# If you add a lockfile later, Docker will still work.
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
