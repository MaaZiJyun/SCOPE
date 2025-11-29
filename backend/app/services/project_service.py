import math
import os
import re
import pickle
import uuid
from app.models.api_dict.mi import MissionDict
from app.models.api_dict.gs import GroundStationDict
from app.models.api_dict.roi import ROIDict
from app.models.api_dict.sat import SatelliteDict
from models.constellation_model import ConstellationModel
from models.camera_model import CameraModel
from app.models.api_dict.pj import ProjectDict

def is_invalid_id(id: str) -> bool:
    return (len(id) == 32 and all(c in '0123456789abcdefABCDEF' for c in id))
    
def detect_update(input: ProjectDict) -> ProjectDict:
    try:
        co, hd, exp, gs, rs, ss = input.constellation, input.hardware, input.experiment, input.ground_stations, input.rois, input.satellites
        ms = exp.missions
        co_id = co.id if co.id else uuid.uuid4().hex

        camera = CameraModel.from_dict(hd)
        
        constellation = ConstellationModel.from_dict(co)
        # print("Updated constellation:")
        # print("Inclination:", constellation.inclination_deg)
        # print("Num Planes:", constellation.num_planes)
        # print("Sats per Plane:", constellation.sats_per_plane)
        # print("Total Sats:", len(constellation.satellites))

        for s in constellation.satellites:
            s.camera = camera
        # print(f"Satellite inclination: {math.degrees(constellation.satellites[0].inc):.2f}°")

        orbital_period = constellation.satellites[0].op if constellation.satellites else None
        time_slot = constellation.satellites[0]._ts() if constellation.satellites else None
        
        # len_consistency = len(constellation.satellites) == len(ss)
        
        # if ss is None or not len_consistency:
        #     sats = [
        #         SatelliteDict(
        #             # id=uuid.uuid4().hex if not is_invalid_id(s.id) else s.id, name=s.motion.name, order=s.order, plane=s.plane,
        #             id=s.id, name=s.motion.name, order=s.order, plane=s.plane,
        #             tle1=s.tle1text, tle2=s.tle2text
        #         )
        #         for s in constellation.satellites
        #     ]
        # else:
        #     sats = [
        #         SatelliteDict(
        #             # id=uuid.uuid4().hex if not is_invalid_id(s.id) else s.id, constellationId=co_id, name=s.name, order=s.order, plane=s.plane,
        #             id=s.id, constellationId=co_id, name=s.name, order=s.order, plane=s.plane,
        #             tle1=s.tle1, tle2=s.tle2
        #         )
        #         for s in ss
        #     ]
        ss = constellation.satellites
        sats = [
            SatelliteDict(
                # id=uuid.uuid4().hex if not is_invalid_id(s.id) else s.id, constellationId=co_id, name=s.name, order=s.order, plane=s.plane,
                id=s.id, name=s.motion.name, order=s.order, plane=s.plane,
                tle1=s.tle1text, tle2=s.tle2text
            )
            for s in ss
        ]
        
        # print(f"Satellite 0: {sats[0].tle2}")
        
        gs = [
            GroundStationDict(
                id=uuid.uuid4().hex if not is_invalid_id(g.id) else g.id, projectId=input.id, name=g.name, location=g.location
            )
            for g in gs
        ]
        
        rs = [
            ROIDict(
                id=uuid.uuid4().hex if not is_invalid_id(r.id) else r.id, projectId=input.id, name=r.name, length=r.length, width=r.width, location=r.location
            )
            for r in rs
        ]
        
        ms = [
            MissionDict(
                id=uuid.uuid4().hex if not is_invalid_id(m.id) else m.id, projectId=input.id, name=m.name,
                targetId=m.target_id, sourceNodeId=m.source_node_id, endNodeId=m.end_node_id,
                startTime=m.start_time, endTime=m.end_time, duration=m.duration
            )
            for m in ms
        ]

        return input.model_copy(update={
            "constellation": co.model_copy(update={"orbital_period": orbital_period, "id": co_id}),
            "experiment": exp.model_copy(update={"time_slot": time_slot, "missions": ms}),
            "satellites": sats,
            "ground_stations": gs,
            "rois": rs
        })
        
    except Exception as e:
        import traceback
        print(f"[Update failed: {e}")
        traceback.print_exc()

# New methods, the data will be stored in local storage
def save_project_to_pkl(input: ProjectDict) -> str:
    """
    Save the input ProjectDict to 'projects/{id}.pkl'.
    If input.id is None, generate a new uuid and assign it.
    If input.id exists, overwrite the file.
    Returns the file path.
    """
    # Assign new id if not present
    project_id = input.id
    if project_id is None or not project_id:
        project_id = uuid.uuid4().hex
        input.id = project_id  # Set the id field
    save_dir = "projects"
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, f"{project_id}.pkl")
    with open(file_path, "wb") as f:
        pickle.dump(input, f)
    return project_id

def delete_project_pkl(project_id: str) -> bool:
    """
    Delete the project pickle file by project_id.
    Returns True if deleted, False if file does not exist.
    """
    file_path = os.path.join("projects", f"{project_id}.pkl")
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False

def load_project_from_pkl(project_id: str) -> ProjectDict:
    """
    Load a ProjectDict object from 'projects/{id}.pkl' by project_id.
    Returns the ProjectDict instance.
    Raises FileNotFoundError if the file does not exist.
    """
    file_path = os.path.join("projects", f"{project_id}.pkl")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Project file not found: {file_path}")
    with open(file_path, "rb") as f:
        # project = pickle.load(f)
        project = _safe_pickle_load(f)
    return project

def load_all_projects_from_pkl() -> list[ProjectDict]:
    """
    Load all ProjectDict objects from the 'projects' directory.
    Returns a list of ProjectDict instances.
    """
    try:
    
        projects = []
        projects_dir = "projects"
        if not os.path.exists(projects_dir):
            return projects
        for filename in os.listdir(projects_dir):
            if filename.endswith(".pkl"):
                file_path = os.path.join(projects_dir, filename)
                with open(file_path, "rb") as f:
                    project = _safe_pickle_load(f)
                    projects.append(project)
    except Exception as e:
        import traceback
        print(f"[Update failed: {e}")
        traceback.print_exc()
    return projects

def _safe_pickle_load(f):
    """
    Try normal pickle.load, fallback to a RenamingUnpickler that maps
    historical module names (e.g. 'models') to current modules.
    """
    try:
        return pickle.load(f)
    except ModuleNotFoundError:
        class RenamingUnpickler(pickle.Unpickler):
            MAP = {
                "models": "old_models.basemodels",
                "models.basemodels": "old_models.basemodels",
                "models.constellation": "old_models.constellation",
                # add more mappings if needed
            }

            def find_class(self, module, name):
                new_module = self.MAP.get(module, module)
                return super().find_class(new_module, name)

        f.seek(0)
        return RenamingUnpickler(f).load()



