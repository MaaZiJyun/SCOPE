
import json
from pathlib import Path
from typing import Dict, Tuple, List

import numpy as np
from app.env.vars.edge import Edge
from app.env.vars.node import Node
from app.services.network_service import LinkSnapshot
from app.entities.satellite_entity import SatelliteEntity
from app.models.api_dict.pj import ProjectDict

class EntityCol:
    def __init__(self, input: ProjectDict):
        self.nodes = []
        self.edges = []
        self.nodes_dict: Dict[Tuple[int, int], SatelliteEntity] = {}
        self.edges_dict: Dict[Tuple[Tuple[int, int], Tuple[int, int]], LinkSnapshot] = {}
        self.N_SAT = input.constellation.number_of_sat_per_planes
        self.N_PLANE = input.constellation.number_of_planes
        
    def reset(self, sats: List[SatelliteEntity], edges: List[LinkSnapshot]):
        self.nodes_dict.clear()
        self.edges_dict.clear()
        self.N_SAT = 0
        self.N_PLANE = 0
        self.load(sats, edges)

    def load(self, sats: List[SatelliteEntity], edges: List[LinkSnapshot]):
        self.nodes = sats
        self.edges = edges
        self._convert()

    def _convert(self):
        index_map = {}
        for n in self.nodes:
            p = n.plane
            o = n.order
            self.nodes_dict[(p, o)] = n
            index_map[n.id] = (p, o)

        for e in self.edges:
            uid = e.src
            vid = e.dst
            if e.src not in index_map or e.dst not in index_map:
                continue
            self.edges_dict[(index_map[uid], index_map[vid])] = e
            self.edges_dict[(index_map[vid], index_map[uid])] = e
        self.N_SAT = max(o for (p, o) in self.nodes_dict.keys()) + 1 if self.nodes_dict else 0
        self.N_PLANE = max(p for (p, o) in self.nodes_dict.keys()) + 1 if self.nodes_dict else 0
        
    def get_nodes(self) -> List[SatelliteEntity]:
        return list(self.nodes_dict.values())
    
    def get_edges(self) -> List[LinkSnapshot]:
        return list(self.edges_dict.values())
    
    def get_node_keys(self) -> List[Tuple[int, int]]:
        return list(self.nodes_dict.keys())
    
    def get_edge_keys(self) -> List[Tuple[Tuple[int, int], Tuple[int, int]]]:
        return list(self.edges_dict.keys())

    def connected(self, u, v):
        return (u, v) in self.edges_dict
