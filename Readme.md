# ConstellationSimulation

Lightweight satellite constellation simulator and visualizer:
- Backend: FastAPI simulation core (satellite dynamics, footprints, network/links, services).
- Frontend: React + @react-three/fiber visualizer (camera, satellite, coverage).
- Designed for research / prototyping of coverage, GSD, ISLs and mission scheduling.

## Requirements
- macOS or Linux
- Python 3.9+
- Node.js 16+ / npm or yarn

## Quick start (development)

### Backend
1. Open a terminal in the backend folder and create a venv:
```bash
cd backend
python3 -m venv .venv
ource .venv/bin/activate
pip install -r requirements.txt
```

2. Run FastAPI (development, with reload):
```bash
# ensure working dir is backend so imports resolve
cd backend
# if you get ModuleNotFoundError, run with PYTHONPATH
uvicorn app.main:app --reload --host localhost --port 8000
```

3. Open API docs:
- Swagger: http://localhost/docs
- ReDoc: http://localhost:8000/redoc

4. If there is installed any new package, please remember to call:
```bash
pip freeze > requirements.txt
# or
/path/to/venv/bin/pip freeze > requirements.txt
```

### Frontend
1. In a separate terminal
```bash
cd frontend
npm install
# common start commands (try one)
npm run dev     # if using Vite
# or
npm start       # if using CRA
```
2. Open the dev server
usually http://localhost:3000 or as printed by the dev server.