import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityLevel } from '../services/carparkService';

interface CarparkMapProps {
  carparks: Carpark[];
  vehicleType: VehicleType;
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userCoords: [number, number] | null;
}

const DISTRICT_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  'Marina Bay & CBD': { center: [1.285, 103.854], zoom: 14 },
  'Orchard & Tanglin': { center: [1.303, 103.834], zoom: 15 },
  'Central (Bishan/Toa Payoh)': { center: [1.345, 103.849], zoom: 14 },
  'East (Tampines/Changi)': { center: [1.356, 103.965], zoom: 13 },
  'West (Jurong/Clementi)': { center: [1.325, 103.745], zoom: 13 },
  'North (Woodlands/Yishun)': { center: [1.433, 103.815], zoom: 13 },
  'North-East (Serangoon/Punggol)': { center: [1.378, 103.887], zoom: 13 },
  'All Singapore': { center: [1.3521, 103.8198], zoom: 12 },
};

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  vehicleType,
  selectedCarpark,
  onSelectCarpark,
  userCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Singapore coordinates
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
    });

    // High clarity CartoDB Positron tiles for sleek modern UI
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Layer group for carpark markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindTooltip('Your Location', { direction: 'top', offset: [0, -10] });
      userMarkerRef.current = marker;
    }
  }, [userCoords]);

  // Update carpark markers when carparks or vehicleType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      const { status, availableLots } = getAvailabilityLevel(cp, vehicleType);

      // Determine styling according to availability status
      let bgClass = 'bg-emerald-600 text-white';
      let borderClass = 'border-emerald-700';

      if (status === 'critical') {
        bgClass = 'bg-amber-500 text-white';
        borderClass = 'border-amber-600';
      } else if (status === 'full') {
        bgClass = 'bg-rose-600 text-white';
        borderClass = 'border-rose-700';
      }

      const isSelected = selectedCarpark?.id === cp.id;

      // Custom HTML Pin displaying exact lots number
      const markerHtml = `
        <div class="cursor-pointer group flex flex-col items-center">
          <div class="px-2 py-1 rounded-full text-xs font-bold font-mono tabular-nums shadow-md border ${bgClass} ${borderClass} flex items-center gap-1 ${
        isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'hover:scale-105'
      } transition-transform">
            <span>${availableLots}</span>
            <span class="text-[9px] font-sans uppercase opacity-90">lots</span>
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-1 ${bgClass}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: markerHtml,
        iconSize: [52, 28],
        iconAnchor: [26, 28],
      });

      const marker = L.marker(cp.coordinates, { icon: customIcon });

      // Interactive popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 w-64 bg-white text-slate-900 text-xs';
      popupContent.innerHTML = `
        <div class="font-bold text-sm text-slate-900 mb-1 leading-tight">${cp.name}</div>
        <div class="text-slate-500 mb-2">${cp.address}</div>
        <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg mb-2 border border-slate-100">
          <span class="text-slate-600 font-medium">Available Lots:</span>
          <span class="text-base font-bold font-mono tabular-nums ${
            status === 'full' ? 'text-rose-600' : status === 'critical' ? 'text-amber-600' : 'text-emerald-600'
          }">${availableLots} <span class="text-xs font-normal text-slate-400">/ ${cp.lots[vehicleType]?.total || cp.lots.car.total}</span></span>
        </div>
        <div class="text-[11px] text-slate-500 mb-3">
          <span class="font-medium text-slate-700">Rates:</span> ${cp.rates.weekdayDay.rate}
        </div>
        <button id="view-details-${cp.id}" class="w-full py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition-colors text-center cursor-pointer">
          View Rates & Calculator
        </button>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-${cp.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCarpark(cp);
          };
        }
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      markersLayer.addLayer(marker);
    });
  }, [carparks, vehicleType, selectedCarpark, onSelectCarpark]);

  // Center on selected carpark
  useEffect(() => {
    if (selectedCarpark && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(selectedCarpark.coordinates, 15, {
        duration: 1.2,
      });
    }
  }, [selectedCarpark]);

  const handleFlyToDistrict = (districtName: string) => {
    const config = DISTRICT_COORDS[districtName];
    if (config && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(config.center, config.zoom, {
        duration: 1.0,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Map Fast-Jump District Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 max-w-[90%] pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-1">
          <button
            onClick={() => handleFlyToDistrict('Orchard & Tanglin')}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            Orchard
          </button>
          <button
            onClick={() => handleFlyToDistrict('Marina Bay & CBD')}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            Marina Bay / CBD
          </button>
          <button
            onClick={() => handleFlyToDistrict('Central (Bishan/Toa Payoh)')}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            Central HDB
          </button>
          <button
            onClick={() => handleFlyToDistrict('East (Tampines/Changi)')}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            East / Changi
          </button>
          <button
            onClick={() => handleFlyToDistrict('West (Jurong/Clementi)')}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            West / Jurong
          </button>
          <button
            onClick={() => handleFlyToDistrict('North (Woodlands/Yishun)')}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            North
          </button>
          <button
            onClick={() => handleFlyToDistrict('All Singapore')}
            className="px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Reset Island
          </button>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-3 z-[1000] pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
          <span>&gt; 35% Lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>12% - 35% Lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
          <span>&lt; 12% / Full</span>
        </div>
      </div>

      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
