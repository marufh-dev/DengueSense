/**
 * High-precision Geolocation and Administrative Boundary Utilities
 * DengueSense National Telemetry Directorate
 */

// Haversine distance formula between two geographic coordinates
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray-casting point-in-polygon test for a 2D ring: pt = [lon, lat]
function pointInRing(pt, ring) {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Test if point is inside GeoJSON Polygon or MultiPolygon
export function pointInGeometry(pt, geom) {
  if (!geom || !geom.coordinates) return false;

  if (geom.type === "Polygon") {
    // Must be inside outer ring
    if (!pointInRing(pt, geom.coordinates[0])) return false;
    // And not inside any inner rings (holes)
    for (let h = 1; h < geom.coordinates.length; h++) {
      if (pointInRing(pt, geom.coordinates[h])) return false;
    }
    return true;
  }

  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (pointInRing(pt, poly[0])) {
        let inHole = false;
        for (let h = 1; h < poly.length; h++) {
          if (pointInRing(pt, poly[h])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
    return false;
  }

  return false;
}

/**
 * Match a geographic coordinate to a Bangladesh district using:
 * 1. Mathematical Point-in-Polygon against official ADM2 GeoJSON boundaries (exact)
 * 2. Proximity Haversine centroid distance as a boundary fallback
 */
export function matchDistrictByCoordinates(lat, lon, geojson, districtsList = []) {
  if (!districtsList || districtsList.length === 0) return null;

  const pt = [lon, lat];

  // 1. Point-in-Polygon Check (Exact administrative boundary test)
  if (geojson && Array.isArray(geojson.features)) {
    for (const feat of geojson.features) {
      if (pointInGeometry(pt, feat.geometry)) {
        const code = feat.properties?.district_code;
        const nameEn = feat.properties?.name_en;

        const match = districtsList.find(
          (d) =>
            (code && d.district_code === code) ||
            (nameEn && d.name_en?.toLowerCase() === nameEn?.toLowerCase())
        );

        if (match) {
          return {
            district: match,
            method: "polygon_exact",
            distanceKm: 0,
            properties: feat.properties,
          };
        }
      }
    }
  }

  // 2. Proximity Fallback: Closest district centroid
  let closest = null;
  let minDistance = Infinity;

  for (const d of districtsList) {
    if (d.centroid_lat && d.centroid_lon) {
      const dist = calculateDistanceKm(lat, lon, d.centroid_lat, d.centroid_lon);
      if (dist < minDistance) {
        minDistance = dist;
        closest = d;
      }
    }
  }

  if (closest) {
    return {
      district: closest,
      method: "proximity",
      distanceKm: minDistance,
    };
  }

  return null;
}

/**
 * Query OpenStreetMap Nominatim for local subdistrict / thana / neighbourhood
 */
export async function fetchSubdistrictName(lat, lon) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en,bn",
        },
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};

    // Pick most descriptive sub-district/area name
    const localArea =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.quarter ||
      addr.city_district ||
      addr.town ||
      addr.village ||
      addr.county ||
      null;

    const postalCode = addr.postcode ? `(${addr.postcode})` : "";
    return localArea ? `${localArea} ${postalCode}`.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Request high-accuracy GPS coordinates from hardware device
 * Provides 15s timeout to allow GPS satellite/Wi-Fi lock and user permission click
 */
export function requestDeviceGps(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 10,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        ...options,
      }
    );
  });
}
