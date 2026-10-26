FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY dist ./dist
COPY .env ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/boot.js"]
