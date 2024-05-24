#!/bin/bash
cd /home/pi/ihech

git fetch
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

BACKEND_IMAGE="jonasblum/ihech-backend:$LOCAL"
FRONTEND_IMAGE="jonasblum/ihech-frontend:$LOCAL"

export VITE_API_URL=https://backend-ihech.jonas-blum.ch

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Changes detected, updating and restarting the container..."
    git reset --hard origin/main

    sleep 5

    docker build -t $BACKEND_IMAGE ./backend
    docker push $BACKEND_IMAGE

    docker build -t $FRONTEND_IMAGE ./frontend --build-arg VITE_API_URL=$VITE_API_URL
    docker push $FRONTEND_IMAGE

    /usr/local/bin/kubectl set image deployment/ihech-backend ihech-backend=$BACKEND_IMAGE
    /usr/local/bin/kubectl set image deployment/ihech-frontend ihech-frontend=$FRONTEND_IMAGE

    echo "Deployment updated successfully."
else
    echo "No changes detected."
fi
