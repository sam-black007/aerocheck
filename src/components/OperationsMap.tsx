import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { LiveTrafficFlight } from '../lib/live-traffic';
import type { ResolvedLocation } from '../lib/live-weather';
import type { CloudLayer } from '../types';

interface MapWeatherSummary {
  description: string;
  temperature: number;
  visibility: number;
  windSpeed: number;
  windDirection?: number;
}

interface OperationsMapProps {
  center: ResolvedLocation | null;
  flights?: LiveTrafficFlight[];
  radiusNm?: number;
  selectedFlightId?: string | null;
  weatherSummary?: MapWeatherSummary | null;
  onFlightSelect?: (flightId: string) => void;
  cloudLayers?: CloudLayer[];
  showCloudOverlay?: boolean;
  showFlightRoute?: boolean;
  mapStyle?: 'osm' | 'satellite' | 'dark';
}

const DEFAULT_CENTER: [number, number] = [20, 0];

const AIRCRAFT_SVG_ICONS: Record<string, string> = {
  narrowbody: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4L8 18H14V28H18V18H24L16 4Z" fill="currentColor"/></svg>`,
  widebody: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 2L6 16H12V28H20V16H26L16 2Z" fill="currentColor"/><rect x="8" y="18" width="4" height="2" fill="currentColor" opacity="0.5"/><rect x="20" y="18" width="4" height="2" fill="currentColor" opacity="0.5"/></svg>`,
  regional: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4L10 16H14V26H18V16H22L16 4Z" fill="currentColor"/></svg>`,
  ga: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 6L10 18H14V24H18V18H22L16 6Z" fill="currentColor"/><rect x="11" y="20" width="3" height="2" fill="currentColor" opacity="0.6"/><rect x="18" y="20" width="3" height="2" fill="currentColor" opacity="0.6"/></svg>`,
  helicopter: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="16" cy="20" rx="5" ry="3" fill="currentColor"/><path d="M4 14H28M16 10V20M13 24L16 28L19 24" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
  turboprop: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4L8 16H14V26H18V16H24L16 4Z" fill="currentColor"/><circle cx="10" cy="22" r="2" fill="currentColor" opacity="0.7"/><circle cx="22" cy="22" r="2" fill="currentColor" opacity="0.7"/></svg>`,
  default: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4L10 16H14V26H18V16H22L16 4Z" fill="currentColor"/></svg>`,
};

function getAircraftCategory(type: string): string {
  const t = type.toLowerCase();
  if (['B737', 'A320', 'A321', 'A319', 'B717', 'E190', 'E195', 'B757', 'B767'].some(x => t.includes(x))) return 'narrowbody';
  if (['B777', 'B787', 'A350', 'A330', 'B747', 'B767'].some(x => t.includes(x))) return 'widebody';
  if (['CRJ', 'E-JET', 'ATR', 'DH8', 'SF34', 'DHC', 'CN35'].some(x => t.includes(x))) return 'turboprop';
  if (['C172', 'C182', 'PIPER', 'CESSNA', 'BEECH', 'MUSTANG'].some(x => t.includes(x))) return 'ga';
  if (['HELI', 'ROTOR', 'EC13', 'AS35', 'B206'].some(x => t.includes(x))) return 'helicopter';
  if (['A340', 'A380', 'B744'].some(x => t.includes(x))) return 'widebody';
  return 'default';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCenterPopup(center: ResolvedLocation, weatherSummary?: MapWeatherSummary | null): string {
  const weatherRows = weatherSummary ? `
    <div class="map-popup-grid">
      <div><span>Temp</span><strong>${weatherSummary.temperature}°C</strong></div>
      <div><span>Wind</span><strong>${weatherSummary.windSpeed} mph</strong></div>
      <div><span>Vis</span><strong>${weatherSummary.visibility} km</strong></div>
      <div><span>Cond</span><strong>${escapeHtml(weatherSummary.description)}</strong></div>
    </div>
  ` : '';

  return `
    <div class="map-popup">
      <div class="map-popup-title">${escapeHtml(center.name)}</div>
      <div class="map-popup-subtitle">${center.lat.toFixed(4)}, ${center.lon.toFixed(4)}</div>
      ${weatherRows}
    </div>
  `;
}

function buildFlightPopup(flight: LiveTrafficFlight): string {
  const altitude = flight.altitudeFeet == null ? 'Ground' : `${flight.altitudeFeet.toLocaleString()} ft`;
  const status = flight.emergency !== 'none' ? 'EMERGENCY' : flight.isOnGround ? 'On Ground' : 'Airborne';
  const statusColor = flight.emergency !== 'none' ? '#f87171' : flight.isOnGround ? '#fbbf24' : '#34d399';

  return `
    <div class="map-popup">
      <div class="map-popup-title" style="color: ${statusColor}">${escapeHtml(flight.callsign)}</div>
      <div class="map-popup-subtitle">${escapeHtml(flight.registration)} | ${escapeHtml(flight.aircraftType)}</div>
      <div style="margin-top: 8px; padding: 8px; background: rgba(56,189,248,0.1); border-radius: 8px;">
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Status</div>
        <div style="font-size: 12px; font-weight: 600; color: ${statusColor}; margin-top: 2px;">${status}</div>
      </div>
      <div class="map-popup-grid">
        <div><span>Altitude</span><strong>${altitude}</strong></div>
        <div><span>Speed</span><strong>${flight.speedKnots} kt</strong></div>
        <div><span>Heading</span><strong>${flight.heading}°</strong></div>
        <div><span>Range</span><strong>${flight.distanceNm} nm</strong></div>
        <div><span>Squawk</span><strong>${flight.squawk}</strong></div>
        <div><span>Operator</span><strong>${escapeHtml(flight.operator.split(' ')[0])}</strong></div>
      </div>
    </div>
  `;
}

function createCenterIcon() {
  return L.divIcon({
    className: 'current-location-icon',
    html: '<div class="current-location-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function createFlightIcon(flight: LiveTrafficFlight, isSelected: boolean) {
  const statusClass = flight.emergency !== 'none' ? 'emergency' : flight.isOnGround ? 'ground' : 'airborne';
  const category = getAircraftCategory(flight.aircraftType);
  const svgPath = AIRCRAFT_SVG_ICONS[category] || AIRCRAFT_SVG_ICONS.default;
  const size = category === 'widebody' ? 36 : category === 'helicopter' ? 30 : 32;
  const glowColor = flight.emergency !== 'none' ? 'rgba(248, 113, 113, 0.6)' : isSelected ? 'rgba(248, 250, 252, 0.8)' : 'rgba(56, 189, 248, 0.5)';

  return L.divIcon({
    className: 'flight-marker-icon',
    html: `
      <div class="flight-marker ${statusClass} ${isSelected ? 'selected' : ''}" style="--heading:${flight.heading}deg; filter: drop-shadow(0 0 ${isSelected ? 16 : 10}px ${glowColor});">
        ${svgPath}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function CloudOverlay({ windSpeed }: { windSpeed: number }) {
  const [clouds, setClouds] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; speed: number }>>([]);

  useEffect(() => {
    const initialClouds = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 80 + Math.random() * 120,
      opacity: 0.15 + Math.random() * 0.2,
      speed: 0.02 + Math.random() * 0.03,
    }));
    setClouds(initialClouds);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setClouds(prev => prev.map(cloud => {
        let newX = cloud.x + cloud.speed * (windSpeed / 5);
        if (newX > 110) newX = -15;
        return { ...cloud, x: newX };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [windSpeed]);

  return (
    <div className="cloud-overlay">
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="cloud-particle"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            width: cloud.size,
            height: cloud.size * 0.5,
            opacity: cloud.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function OperationsMap({
  center,
  flights = [],
  radiusNm,
  selectedFlightId = null,
  weatherSummary = null,
  onFlightSelect,
  cloudLayers = [],
  showCloudOverlay = false,
  showFlightRoute = true,
  mapStyle = 'osm',
}: OperationsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const weatherDescription = weatherSummary?.description ?? null;
  const weatherTemperature = weatherSummary?.temperature ?? null;
  const weatherVisibility = weatherSummary?.visibility ?? null;
  const weatherWindSpeed = weatherSummary?.windSpeed ?? null;
  const weatherWindDirection = weatherSummary?.windDirection ?? null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      zoomControlPosition: 'bottomright',
    });

    // OpenStreetMap - clear and visible
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 1,
      attribution: '&copy; OpenStreetMap',
    });

    // Dark mode layer (CartoDB Dark Matter)
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      opacity: 1,
      attribution: '&copy; CARTO',
    });

    // Satellite layer
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 1,
      attribution: '&copy; Esri',
    });

    // Store layers
    (map as any).tileLayers = { osm: osmLayer, dark: darkLayer, satellite: satelliteLayer };
    
    // Add default layer based on style prop
    if (mapStyle === 'dark') {
      darkLayer.addTo(map);
      (map as any).currentTileLayer = 'dark';
    } else if (mapStyle === 'satellite') {
      satelliteLayer.addTo(map);
      (map as any).currentTileLayer = 'satellite';
    } else {
      osmLayer.addTo(map);
      (map as any).currentTileLayer = 'osm';
    }

    overlayLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    map.setView(DEFAULT_CENTER, 2);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      overlayLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!center) {
      map.setView(DEFAULT_CENTER, 2);
      return;
    }

    const target = L.latLng(center.lat, center.lon);
    const bounds = target.toBounds((radiusNm ?? 14) * 1852 * 2.8);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: radiusNm ? 9 : 13 });
    window.setTimeout(() => map.invalidateSize(), 100);
  }, [center, radiusNm]);

  useEffect(() => {
    const map = mapRef.current;
    const overlayLayer = overlayLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !overlayLayer || !routeLayer) return;

    overlayLayer.clearLayers();
    routeLayer.clearLayers();

    if (!center) return;

    const centerLatLng = L.latLng(center.lat, center.lon);

    if (radiusNm) {
      L.circle(centerLatLng, {
        radius: radiusNm * 1852,
        color: '#38bdf8',
        weight: 2,
        dashArray: '12 8',
        fillColor: '#0f172a',
        fillOpacity: 0.05,
      }).addTo(overlayLayer);

      for (let i = 1; i <= 3; i++) {
        L.circle(centerLatLng, {
          radius: (radiusNm * 1852 * i) / 3,
          color: 'rgba(56, 189, 248, 0.1)',
          weight: 1,
          dashArray: '4 8',
          fillOpacity: 0,
        }).addTo(overlayLayer);
      }
    }

    L.marker(centerLatLng, { icon: createCenterIcon(), zIndexOffset: 1000 })
      .bindPopup(buildCenterPopup(center, weatherSummary))
      .addTo(overlayLayer);

    const selectedFlight = flights.find(f => f.id === selectedFlightId) ?? null;
    if (selectedFlight && showFlightRoute) {
      L.polyline(
        [centerLatLng, L.latLng(selectedFlight.latitude, selectedFlight.longitude)],
        {
          color: '#7dd3fc',
          opacity: 0.7,
          weight: 2,
          dashArray: '10 6',
        }
      ).addTo(routeLayer);

      L.circle(L.latLng(selectedFlight.latitude, selectedFlight.longitude), {
        radius: 5000,
        color: '#7dd3fc',
        weight: 1,
        fillColor: 'rgba(56, 189, 248, 0.15)',
        fillOpacity: 0.3,
      }).addTo(routeLayer);
    }

    flights.slice(0, 200).forEach(flight => {
      const isSelected = flight.id === selectedFlightId;
      const marker = L.marker([flight.latitude, flight.longitude], {
        icon: createFlightIcon(flight, isSelected),
      })
        .bindPopup(buildFlightPopup(flight), { maxWidth: 280 })
        .addTo(overlayLayer);

      marker.on('click', () => onFlightSelect?.(flight.id));
    });

  }, [center, flights, onFlightSelect, radiusNm, selectedFlightId, weatherDescription, weatherTemperature, weatherVisibility, weatherWindSpeed, showFlightRoute]);

  return (
    <div className="aviation-map">
      <div ref={containerRef} className="h-full min-h-[28rem] w-full" />
      {showCloudOverlay && weatherWindSpeed !== null && (
        <CloudOverlay windSpeed={weatherWindSpeed} />
      )}
      {!center && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm uppercase tracking-[0.28em] text-slate-300">
          Acquiring location map
        </div>
      )}
    </div>
  );
}
