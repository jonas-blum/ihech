# Interactive Hierarchically Expandable Heatmap

## Running App Locally

### Backend

1. `cd backend`
2. `source projectenv/bin/activate` (after `python -m venv projectenv` and `pip install -r requirements.txt`)
3. `flask run --debug`

### Frontend

1. `cd frontend`
2. `pnpm dev` (after `pnpm install`)

## Docker

1. Set the `VITE_API_URL` to the backend URL in an .env file or by typing `export VITE_API_URL=...`
2. Run docker-compose up --build to start the frontend and backend
