#!/bin/bash
cd /home/pi/ihech

git fetch
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

BACKEND_IMAGE="jonasblum/ihech-backend2:latest"
FRONTEND_IMAGE="jonasblum/ihech-frontend2:latest"

BACKEND_DEPLOYMENT="ihech-be2"
FRONTEND_DEPLOYMENT="ihech-fe2"

export VITE_API_URL=https://backend2-ihech.jonas-blum.ch

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Changes detected, updating and restarting the container..."
    git reset --hard origin/main

    docker build -t $BACKEND_IMAGE ./backend
    docker push $BACKEND_IMAGE

    docker build -t $FRONTEND_IMAGE ./frontend --build-arg VITE_API_URL=$VITE_API_URL
    docker push $FRONTEND_IMAGE

    sleep 5

    /usr/local/bin/kubectl set image deployment/$BACKEND_DEPLOYMENT $BACKEND_DEPLOYMENT=$BACKEND_IMAGE
    /usr/local/bin/kubectl set image deployment/$FRONTEND_DEPLOYMENT $FRONTEND_DEPLOYMENT=$FRONTEND_IMAGE

    /usr/local/bin/kubectl rollout restart deployment/$BACKEND_DEPLOYMENT
    /usr/local/bin/kubectl rollout restart deployment/$FRONTEND_DEPLOYMENT

    echo "Deployment updated successfully."
else
    echo "No changes detected."
fi
