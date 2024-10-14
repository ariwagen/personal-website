#!/bin/bash

# Navigate to the directory of your app
cd /home/ec2-user/personal-website || exit

# Pull the latest code from the main branch
git pull origin main

# Build the React app (if needed)
npm install
npm run build

# Restart Nginx (if you need to restart it)
sudo systemctl reload nginx