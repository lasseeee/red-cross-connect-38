import {
  districtById,
  type Gender,
  type Interest,
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

/** Weights add up to 1 so the match score reads as a percentage. */
const WEIGHTS = {
  activity: 0.3,
  availability: 0.18,
  language: 0.12,
  travel: 0.1,
  interests: 0.1,
  gender: 0.08,
  smoking: 0.07,
  pets: 0.05,
} as const;

export type MatchFactor = { key: string; label: string; value: number; weight: number };

export type Suggestion = {
  volunteer: Volunteer;
  km: number;
  minutes: number;
  activityOverlap: string[];
  languageOverlap: string[];
  availabilityOverlap: string[];
  interestOverlap: Interest[];
  hasCapacity: boolean;
  /** 0-100 overall fit. */
  percent: number;
  factors: MatchFactor[];
  genderPreferenceMet: boolean;
  smokingOk: boolean;
  petsOk: boolean;
};

export type SuggestOptions = {
  mode: TravelMode;
  maxMinutes: number;
  maxKm: number;
  requireActivity: boolean;
  interest: Interest | "any";
  gender: Gender | "any";
  ageMin: number;
  ageMax: number;
  nonSmokersOnly: boolean;
  respectGenderPreference: boolean;
  petFriendlyOnly: boolean;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function suggestVolunteers(
  participant: Participant,
  volunteers: Volunteer[],
  opts: SuggestOptions,
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
      const interestOverlap = volunteer.interests.filter((i) =>
        participant.interests.includes(i),
      );
      const hasCapacity = volunteer.assigned < volunteer.capacity;

      const genderPreferenceMet =
        participant.prefersGender === "any" ||
        participant.prefersGender === volunteer.gender;
      const smokingOk = !(participant.wantsNonSmoker && volunteer.smoker);
      const petsOk = !participant.hasPets || volunteer.okWithPets;

      const factors: MatchFactor[] = [
        {
          key: "activity",
          label: "Activity",
          value: clamp01(activityOverlap.length / Math.max(1, participant.needs.length)),
          weight: WEIGHTS.activity,
        },
        {
          key: "availability",
          label: "Availability",
          value: clamp01(
            availabilityOverlap.length / Math.max(1, participant.availability.length),
          ),
          weight: WEIGHTS.availability,
        },
        {
          key: "language",
          label: "Language",
          value: languageOverlap.length > 0 ? 1 : 0,
          weight: WEIGHTS.language,
        },
        {
          key: "travel",
          label: "Travel time",
          value: clamp01(1 - minutes / Math.max(10, opts.maxMinutes)),
          weight: WEIGHTS.travel,
        },
        {
          key: "interests",
          label: "Shared interests",
          value: clamp01(interestOverlap.length / 2),
          weight: WEIGHTS.interests,
        },
        {
          key: "gender",
          label: "Gender preference",
          value: genderPreferenceMet ? 1 : 0,
          weight: WEIGHTS.gender,
        },
        {
          key: "smoking",
          label: "Smoking",
          value: smokingOk ? 1 : 0,
          weight: WEIGHTS.smoking,
        },
        { key: "pets", label: "Pets", value: petsOk ? 1 : 0, weight: WEIGHTS.pets },
      ];

      const base = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
      // A volunteer without free capacity is still shown, but ranks lower.
      const percent = Math.round(base * 100 * (hasCapacity ? 1 : 0.85));

      return {
        volunteer,
        km,
        minutes,
        activityOverlap,
        languageOverlap,
        availabilityOverlap,
        interestOverlap,
        hasCapacity,
        percent,
        factors,
        genderPreferenceMet,
        smokingOk,
        petsOk,
      };
    })
    .filter((s) => {
      const v = s.volunteer;
      return (
        s.minutes <= opts.maxMinutes &&
        s.km <= opts.maxKm &&
        (!opts.requireActivity || s.activityOverlap.length > 0) &&
        (opts.interest === "any" || v.interests.includes(opts.interest)) &&
        (opts.gender === "any" || v.gender === opts.gender) &&
        v.age >= opts.ageMin &&
        v.age <= opts.ageMax &&
        (!opts.nonSmokersOnly || !v.smoker) &&
        (!opts.respectGenderPreference || s.genderPreferenceMet) &&
        (!opts.petFriendlyOnly || v.okWithPets)
      );
    })
    .sort((a, b) => b.percent - a.percent || a.minutes - b.minutes);
}
