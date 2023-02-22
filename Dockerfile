FROM node:18-alpine

VOLUME /app
WORKDIR /app

CMD ["npm", "run", "run"]
