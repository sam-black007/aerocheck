import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LiveTrafficFlight } from '../lib/live-traffic';
import type { ResolvedLocation } from '../lib/live-weather';

interface MapWeatherSummary {
  description: string;
  temperature: number;
  visibility: number;
  windSpeed: number;
}

interface OperationsMapProps {
  center: ResolvedLocation | null;
  flights?: LiveTrafficFlight[];
  radiusNm?: number;
  selectedFlightId?: string | null;
  weatherSummary?: MapWeatherSummary | null;
  onFlightSelect?: (flightId: string) => void;
}

const DEFAULT_CENTER: [number, number] = [20, 0];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCenterPopup(center: ResolvedLocation, weatherSummary?: MapWeatherSummary | null): string {
  const weatherRows = weatherSummary
    ? `
        <div class="map-popup-grid">
          <div><span>Temp</span><strong>${weatherSummary.temperature} deg C</strong></div>
          <div><span>Wind</span><strong>${weatherSummary.windSpeed} mph</strong></div>
          <div><span>Vis</span><strong>${weatherSummary.visibility} km</strong></div>
          <div><span>Cond</span><strong>${escapeHtml(weatherSummary.description)}</strong></div>
        </div>
      `
    : '';

  return `
    <div class="map-popup">
      <div class="map-popup-title">${escapeHtml(center.name)}</div>
      <div class="map-popup-subtitle">${center.lat.toFixed(4)}, ${center.lon.toFixed(4)}</div>
      ${weatherRows}
    </div>
  `;
}

function buildFlightPopup(flight: LiveTrafficFlight): string {
  return `
    <div class="map-popup">
      <div class="map-popup-title">${escapeHtml(flight.callsign)}</div>
      <div class="map-popup-subtitle">${escapeHtml(flight.registration)} | ${escapeHtml(flight.aircraftType)}</div>
      <div class="map-popup-grid">
        <div><span>Altitude</span><strong>${flight.altitudeFeet == null ? 'Ground' : `${flight.altitudeFeet.toLocaleString()} ft`}</strong></div>
        <div><span>Speed</span><strong>${flight.speedKnots} kt</strong></div>
        <div><span>Heading</span><strong>${flight.heading} deg</strong></div>
        <div><span>Range</span><strong>${flight.distanceNm} nm</strong></div>
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
  const statusClass =
    flight.emergency !== 'none' ? 'emergency' : flight.isOnGround ? 'ground' : 'airborne';

  return L.divIcon({
    className: 'flight-marker-icon',
    html: `
      <div class="flight-marker ${statusClass} ${isSelected ? 'selected' : ''}" style="--heading:${flight.heading}deg">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 2L20 12H28L21 18L24 29L16 22L8 29L11 18L4 12H12L16 2Z" />
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function OperationsMap({
  center,
  flights = [],
  radiusNm,
  selectedFlightId = null,
  weatherSummary = null,
  onFlightSelect,
}: OperationsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const weatherDescription = weatherSummary?.description ?? null;
  const weatherTemperature = weatherSummary?.temperature ?? null;
  const weatherVisibility = weatherSummary?.visibility ?? null;
  const weatherWindSpeed = weatherSummary?.windSpeed ?? null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    overlayLayerRef.current = L.layerGroup().addTo(map);
    map.setView(DEFAULT_CENTER, 2);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      overlayLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (!center) {
      map.setView(DEFAULT_CENTER, 2);
      return;
    }

    const target = L.latLng(center.lat, center.lon);
    const bounds = target.toBounds((radiusNm ?? 14) * 1852 * 2.8);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: radiusNm ? 11 : 13 });
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [center, radiusNm]);

  useEffect(() => {
    const map = mapRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!map || !overlayLayer) {
      return;
    }

    overlayLayer.clearLayers();

    if (!center) {
      return;
    }

    const centerLatLng = L.latLng(center.lat, center.lon);

    if (radiusNm) {
      L.circle(centerLatLng, {
        radius: radiusNm * 1852,
        color: '#38bdf8',
        weight: 1.2,
        dashArray: '10 8',
        fillColor: '#0f172a',
        fillOpacity: 0.12,
      }).addTo(overlayLayer);
    }

    L.marker(centerLatLng, { icon: createCenterIcon(), zIndexOffset: 1000 })
      .bindPopup(buildCenterPopup(center, weatherSummary))
      .addTo(overlayLayer);

    const selectedFlight = flights.find((flight) => flight.id === selectedFlightId) ?? null;
    if (selectedFlight) {
      L.polyline(
        [
          centerLatLng,
          L.latLng(selectedFlight.latitude, selectedFlight.longitude),
        ],
        {
          color: '#7dd3fc',
          opacity: 0.5,
          weight: 1.4,
          dashArray: '8 8',
        }
      ).addTo(overlayLayer);
    }

    flights.slice(0, 180).forEach((flight) => {
      const marker = L.marker([flight.latitude, flight.longitude], {
        icon: createFlightIcon(flight, flight.id === selectedFlightId),
      })
        .bindPopup(buildFlightPopup(flight))
        .addTo(overlayLayer);

      marker.on('click', () => {
        onFlightSelect?.(flight.id);
      });
    });
  }, [
    center,
    flights,
    onFlightSelect,
    radiusNm,
    selectedFlightId,
    weatherDescription,
    weatherTemperature,
    weatherVisibility,
    weatherWindSpeed,
  ]);

  return (
    <div className="aviation-map">
      <div ref={containerRef} className="h-full min-h-[24rem] w-full" />
      {!center && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm uppercase tracking-[0.28em] text-slate-300">
          Acquiring location map
        </div>
      )}
    </div>
  );
}
