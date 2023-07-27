# Using node as base image
FROM node:18-alpine

# Create add dir
WORKDIR /usr/src/app
dok
# Copying package.json and package-lock.json
COPY package*.json .

# Installing all dependecies
RUN npm install

# Copying all project files into container
COPY . .

# Opening port on which app will work
EXPOSE 3001

# Running app
CMD ["npm","start"]
