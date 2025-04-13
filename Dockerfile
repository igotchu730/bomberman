# 1. Use official Node.js base image
FROM node:18

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy only package files
COPY package*.json ./

# 4. Install Node dependencies
RUN npm install

# 5. Copy the rest of project files. 
# Copying everything from local project folder into the /app directory inside the container
COPY . .

# 6. Build the frontend (this creates the dist/ folder)
RUN npm run build

# 7. Expose the port that the server uses
EXPOSE 3000

# 8. Start the app
CMD ["node", "app.js"]
