#!/bin/bash

# Navigate to the directory of your app
cd /home/ec2-user/personal-website || exit

# Build the React app (if needed)
npm install
npm run build

# Restart Nginx (if you need to restart it)
sudo systemctl reload nginx
