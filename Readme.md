# S.C.O.P.E.

Satellite-ground Collaborative Observation Performance Evaluator, Light and easy visualization for LEO satellite experiments.

Lightweight satellite constellation simulator and visualizer:
- Backend: FastAPI simulation core (satellite dynamics, footprints, network/links, services).
- Frontend: React + @react-three/fiber visualizer (camera, satellite, coverage).
- Designed for research / prototyping of coverage, GSD, ISLs and mission scheduling.

## Requirements
- macOS or Linux
- Python 3.9+
- Node.js 16+ / npm or yarn

## Quick start (development)

### some big files needed to be downloaded at first

Those images under dirctory `/frontend/public/planet_texture/` with big sizes has been put in the google drive:
https://drive.google.com/drive/folders/1hnm2OJi4xMqYI2_2qalkP7uyBbpCmDb1?usp=sharing,
click the link to download before run the simulator.

```bash
public
│   └── planet_texture
│       ├── clouds_texture_hd.jpg
│       ├── earth_texture_hd.jpg
│       ├── earth_obj_texture.png
│       └── earth_texture.jpg
```

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