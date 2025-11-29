
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createRoot } from "react-dom/client";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useMapEvents } from "react-leaflet"; // Static import for hook
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LatLonAlt } from "../types";

// Dynamically import react-leaflet components to avoid SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (latlon: LatLonAlt) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lon: e.latlng.lng, alt: 0 });
    },
  });
  return null;
}

// Map Picker Modal Component
interface MapPickerModalProps {
  visible: boolean;
  onConfirm: (latlon: LatLonAlt | null) => void;
  onCancel: () => void;
}

const MapPickerModal = ({ visible, onConfirm, onCancel }: MapPickerModalProps) => {
  const [selectedLocation, setSelectedLocation] = useState<LatLonAlt | null>(null);

  if (!visible) return null;

  return (
    <>
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <div className="fixed inset-0 flex justify-center items-center z-50 p-6">
        <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Select Location</h3>
            <button onClick={onCancel} title="Close" className="hover:text-gray-300">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="h-96 mb-4">
            <MapContainer
              center={[0, 0]}
              zoom={2}
              style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
              className="border border-gray-600"
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
              />
              <MapClickHandler onLocationSelect={setSelectedLocation} />
              {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lon]} />
              )}
            </MapContainer>
          </div>
          {selectedLocation && (
            <p className="mb-4 text-gray-300">
              Selected: Lat <span className="font-semibold text-white">{selectedLocation.lat.toFixed(4)}</span>°, 
              Lon <span className="font-semibold text-white">{selectedLocation.lon.toFixed(4)}</span>°, 
              Alt <span className="font-semibold text-white">{selectedLocation.alt}</span> m
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedLocation)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-200 flex items-center gap-1 text-gray-900 transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Function to open the map picker and return selected coordinates
export function openMapPicker(): Promise<LatLonAlt | null> {
  return new Promise((resolve) => {
    // Ensure DOM is ready
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const modalContainer = document.createElement("div");
    document.body.appendChild(modalContainer);

    const root = createRoot(modalContainer);

    const handleConfirm = (latlon: LatLonAlt | null) => {
      root.unmount();
      modalContainer.remove();
      resolve(latlon);
    };

    const handleCancel = () => {
      root.unmount();
      modalContainer.remove();
      resolve(null);
    };

    root.render(
      <MapPickerModal
        visible={true}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
}
