import {
  districtById,
  type Participant,
  type TravelMode,
  type Volunteer,
} from "@/data/oslo";

/** Straight-line distance in km. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Estimated door-to-door travel time in minutes, per mode.
 * Detour factor accounts for the road/route network being longer than a
 * straight line; the fixed term covers parking, waiting for a bus, etc.
 */
const MODE_MODEL: Record<
  TravelMode,
  { speedKmh: number; detour: number; fixedMin: number; label: string }
> = {
  car: { speedKmh: 27, detour: 1.35, fixedMin: 6, label: "Car" },
  transit: { speedKmh: 18, detour: 1.45, fixedMin: 11, label: "Public transport" },
  bike: { speedKmh: 15, detour: 1.25, fixedMin: 3, label: "Bike" },
};

export const MODES: TravelMode[] = ["car", "transit", "bike"];
export const modeLabel = (m: TravelMode) => MODE_MODEL[m].label;

export function travelEstimate(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: TravelMode,
) {
  const m = MODE_MODEL[mode];
  const straight = haversineKm(from, to);
  const routeKm = straight * m.detour;
  const minutes = m.fixedMin + (routeKm / m.speedKmh) * 60;
  return { km: routeKm, minutes: Math.round(minutes) };
}

export type Suggestion = {
  volunteer: Volunteer;
  km: number;
  minutes: number;
  activityOverlap: string[];
  languageOverlap: string[];
  availabilityOverlap: string[];
  hasCapacity: boolean;
  score: number;
};

export function suggestVolunteers(
  participant: Participant,
  volunteers: Volunteer[],
  opts: { mode: TravelMode; maxMinutes: number; maxKm: number; requireActivity: boolean },
): Suggestion[] {
  const area = districtById(participant.districtId);

  return volunteers
    .map((volunteer) => {
      const { km, minutes } = travelEstimate(volunteer, area, opts.mode);
      const activityOverlap = volunteer.activities.filter((a) =>
        participant.needs.includes(a),
      );
      const languageOverlap = volunteer.languages.filter((l) =>
        participant.languages.includes(l),
      );
      const availabilityOverlap = volunteer.availability.filter((a) =>
        participant.availability.includes(a),
      );
      const hasCapacity = volunteer.assigned < volunteer.capacity;

      const score =
        activityOverlap.length * 34 +
        availabilityOverlap.length * 18 +
        languageOverlap.length * 10 +
        (hasCapacity ? 12 : 0) +
        Math.max(0, 30 - minutes) +
        (volunteer.modes.includes(opts.mode) ? 8 : 0);

      return {
        volunteer,
        km,
        minutes,
        activityOverlap,
        languageOverlap,
        availabilityOverlap,
        hasCapacity,
        score: Math.round(score),
      };
    })
    .filter(
      (s) =>
        s.minutes <= opts.maxMinutes &&
        s.km <= opts.maxKm &&
        (!opts.requireActivity || s.activityOverlap.length > 0),
    )
    .sort((a, b) => b.score - a.score || a.minutes - b.minutes);
}
