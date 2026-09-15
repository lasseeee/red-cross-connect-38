// Browser-safe sample data for the Oslo Red Cross matching prototype.
// Participants are only ever placed at their district (bydel) centre.

export type TravelMode = "car" | "transit" | "bike";

export type District = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Rough radius of the district in metres, used for the blurred area circle. */
  radius: number;
};

export const DISTRICTS: District[] = [
  { id: "sentrum", name: "Sentrum", lat: 59.9127, lng: 10.7461, radius: 900 },
  { id: "gamle-oslo", name: "Gamle Oslo", lat: 59.9075, lng: 10.7745, radius: 1400 },
  { id: "grunerlokka", name: "Grünerløkka", lat: 59.9245, lng: 10.7605, radius: 1100 },
  { id: "sagene", name: "Sagene", lat: 59.9375, lng: 10.7565, radius: 1100 },
  { id: "st-hanshaugen", name: "St. Hanshaugen", lat: 59.9295, lng: 10.7385, radius: 1000 },
  { id: "frogner", name: "Frogner", lat: 59.9205, lng: 10.7095, radius: 1300 },
  { id: "ullern", name: "Ullern", lat: 59.9245, lng: 10.6485, radius: 1600 },
  { id: "vestre-aker", name: "Vestre Aker", lat: 59.9535, lng: 10.6845, radius: 1900 },
  { id: "nordre-aker", name: "Nordre Aker", lat: 59.9575, lng: 10.7605, radius: 1800 },
  { id: "bjerke", name: "Bjerke", lat: 59.9445, lng: 10.8265, radius: 1500 },
  { id: "grorud", name: "Grorud", lat: 59.9605, lng: 10.8815, radius: 1500 },
  { id: "stovner", name: "Stovner", lat: 59.9615, lng: 10.9265, radius: 1600 },
  { id: "alna", name: "Alna", lat: 59.9295, lng: 10.8595, radius: 1800 },
  { id: "ostensjo", name: "Østensjø", lat: 59.8935, lng: 10.8265, radius: 1700 },
  { id: "nordstrand", name: "Nordstrand", lat: 59.8705, lng: 10.8085, radius: 1800 },
  { id: "sondre-nordstrand", name: "Søndre Nordstrand", lat: 59.8365, lng: 10.8215, radius: 2200 },
];

export const districtById = (id: string) =>
  DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0]!;

export const ACTIVITIES = [
  "Visiting friend",
  "Walking companion",
  "Homework help",
  "Language practice",
  "Digital help",
  "Grocery help",
] as const;

export type Activity = (typeof ACTIVITIES)[number];

export type Volunteer = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  activities: Activity[];
  languages: string[];
  availability: string[];
  modes: TravelMode[];
  capacity: number;
  assigned: number;
};

export type Participant = {
  id: string;
  name: string;
  districtId: string;
  needs: Activity[];
  languages: string[];
  availability: string[];
  note: string;
  waitingSinceDays: number;
  status: "waiting" | "matched";
  matchedVolunteerId?: string;
};

export const VOLUNTEERS: Volunteer[] = [
  {
    id: "v1",
    name: "Ingrid Halvorsen",
    address: "Thorvald Meyers gate 42, 0555 Oslo",
    lat: 59.9251,
    lng: 10.7592,
    activities: ["Visiting friend", "Walking companion"],
    languages: ["Norwegian", "English"],
    availability: ["Weekday evenings", "Saturday"],
    modes: ["transit", "bike"],
    capacity: 2,
    assigned: 0,
  },
  {
    id: "v2",
    name: "Mahmoud Baraka",
    address: "Trondheimsveien 118, 0570 Oslo",
    lat: 59.9319,
    lng: 10.7749,
    activities: ["Language practice", "Homework help"],
    languages: ["Norwegian", "Arabic", "English"],
    availability: ["Weekday evenings"],
    modes: ["transit", "car"],
    capacity: 3,
    assigned: 1,
  },
  {
    id: "v3",
    name: "Kari Sæther",
    address: "Slemdalsveien 70, 0370 Oslo",
    lat: 59.9481,
    lng: 10.6968,
    activities: ["Visiting friend", "Digital help"],
    languages: ["Norwegian"],
    availability: ["Weekday daytime"],
    modes: ["car"],
    capacity: 2,
    assigned: 0,
  },
  {
    id: "v4",
    name: "Jonas Lie",
    address: "Ekebergveien 210, 1162 Oslo",
    lat: 59.8631,
    lng: 10.7959,
    activities: ["Walking companion", "Grocery help"],
    languages: ["Norwegian", "English"],
    availability: ["Saturday", "Sunday"],
    modes: ["car", "bike"],
    capacity: 1,
    assigned: 0,
  },
  {
    id: "v5",
    name: "Sofia Nowak",
    address: "Stovner senter 3, 0985 Oslo",
    lat: 59.9612,
    lng: 10.9257,
    activities: ["Homework help", "Language practice"],
    languages: ["Norwegian", "Polish", "English"],
    availability: ["Weekday evenings", "Saturday"],
    modes: ["transit"],
    capacity: 2,
    assigned: 0,
  },
  {
    id: "v6",
    name: "Per Kristian Dahl",
    address: "Grefsenveien 44, 0485 Oslo",
    lat: 59.9497,
    lng: 10.7729,
    activities: ["Visiting friend", "Grocery help"],
    languages: ["Norwegian"],
    availability: ["Weekday daytime", "Friday"],
    modes: ["car", "transit"],
    capacity: 3,
    assigned: 2,
  },
  {
    id: "v7",
    name: "Amina Yusuf",
    address: "Furusetveien 12, 1053 Oslo",
    lat: 59.9333,
    lng: 10.8865,
    activities: ["Language practice", "Visiting friend"],
    languages: ["Norwegian", "Somali", "English"],
    availability: ["Weekday evenings"],
    modes: ["transit", "bike"],
    capacity: 2,
    assigned: 0,
  },
  {
    id: "v8",
    name: "Elias Berg",
    address: "Bygdøy allé 21, 0262 Oslo",
    lat: 59.9174,
    lng: 10.7091,
    activities: ["Digital help", "Homework help"],
    languages: ["Norwegian", "English", "Spanish"],
    availability: ["Weekday evenings", "Sunday"],
    modes: ["bike", "transit"],
    capacity: 2,
    assigned: 1,
  },
  {
    id: "v9",
    name: "Liv Andersen",
    address: "Oppsalveien 24, 0685 Oslo",
    lat: 59.8981,
    lng: 10.8433,
    activities: ["Walking companion", "Visiting friend"],
    languages: ["Norwegian"],
    availability: ["Weekday daytime", "Saturday"],
    modes: ["car", "bike"],
    capacity: 2,
    assigned: 0,
  },
  {
    id: "v10",
    name: "Tobias Nilsen",
    address: "Sandakerveien 24, 0473 Oslo",
    lat: 59.9382,
    lng: 10.7614,
    activities: ["Grocery help", "Digital help"],
    languages: ["Norwegian", "English"],
    availability: ["Saturday", "Sunday"],
    modes: ["bike", "transit"],
    capacity: 1,
    assigned: 0,
  },
  {
    id: "v11",
    name: "Hanne Vik",
    address: "Holmliaveien 8, 1255 Oslo",
    lat: 59.8402,
    lng: 10.8168,
    activities: ["Visiting friend", "Homework help"],
    languages: ["Norwegian", "English"],
    availability: ["Weekday evenings", "Saturday"],
    modes: ["transit", "car"],
    capacity: 3,
    assigned: 1,
  },
  {
    id: "v12",
    name: "Nikolai Rasmussen",
    address: "Ullernchausseen 60, 0379 Oslo",
    lat: 59.9264,
    lng: 10.6449,
    activities: ["Walking companion", "Digital help"],
    languages: ["Norwegian", "Russian"],
    availability: ["Weekday daytime"],
    modes: ["car"],
    capacity: 2,
    assigned: 0,
  },
];

export const PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    name: "Deltaker A-104",
    districtId: "gamle-oslo",
    needs: ["Visiting friend"],
    languages: ["Norwegian"],
    availability: ["Weekday evenings"],
    note: "Lives alone, wants weekly company and short walks.",
    waitingSinceDays: 21,
    status: "waiting",
  },
  {
    id: "p2",
    name: "Deltaker A-112",
    districtId: "stovner",
    needs: ["Homework help"],
    languages: ["Norwegian", "Polish"],
    availability: ["Weekday evenings"],
    note: "Two children in 5th and 7th grade, needs maths support.",
    waitingSinceDays: 9,
    status: "waiting",
  },
  {
    id: "p3",
    name: "Deltaker A-118",
    districtId: "alna",
    needs: ["Language practice"],
    languages: ["Somali", "Norwegian"],
    availability: ["Weekday evenings"],
    note: "Recently arrived, wants weekly Norwegian conversation.",
    waitingSinceDays: 34,
    status: "waiting",
  },
  {
    id: "p4",
    name: "Deltaker A-121",
    districtId: "nordstrand",
    needs: ["Walking companion", "Grocery help"],
    languages: ["Norwegian"],
    availability: ["Saturday"],
    note: "Reduced mobility, needs company for short outdoor walks.",
    waitingSinceDays: 5,
    status: "waiting",
  },
  {
    id: "p5",
    name: "Deltaker A-126",
    districtId: "sagene",
    needs: ["Digital help"],
    languages: ["Norwegian"],
    availability: ["Weekday daytime"],
    note: "Wants help with phone, banking app and public services online.",
    waitingSinceDays: 14,
    status: "waiting",
  },
  {
    id: "p6",
    name: "Deltaker A-131",
    districtId: "sondre-nordstrand",
    needs: ["Visiting friend"],
    languages: ["Norwegian", "English"],
    availability: ["Weekday evenings", "Saturday"],
    note: "Isolated after illness, prefers visits at home.",
    waitingSinceDays: 42,
    status: "waiting",
  },
  {
    id: "p7",
    name: "Deltaker A-137",
    districtId: "frogner",
    needs: ["Walking companion"],
    languages: ["Norwegian"],
    availability: ["Weekday daytime"],
    note: "Retired, would like a walking partner twice a week.",
    waitingSinceDays: 11,
    status: "waiting",
  },
  {
    id: "p8",
    name: "Deltaker A-140",
    districtId: "ostensjo",
    needs: ["Grocery help", "Digital help"],
    languages: ["Norwegian"],
    availability: ["Saturday", "Sunday"],
    note: "Needs practical help with shopping every other week.",
    waitingSinceDays: 18,
    status: "waiting",
  },
  {
    id: "p9",
    name: "Deltaker A-145",
    districtId: "grorud",
    needs: ["Language practice", "Homework help"],
    languages: ["Arabic", "Norwegian"],
    availability: ["Weekday evenings"],
    note: "Father of three, wants to practise Norwegian with family.",
    waitingSinceDays: 27,
    status: "waiting",
  },
  {
    id: "p10",
    name: "Deltaker A-150",
    districtId: "vestre-aker",
    needs: ["Visiting friend", "Digital help"],
    languages: ["Norwegian"],
    availability: ["Weekday daytime", "Friday"],
    note: "Widowed last year, wants regular contact.",
    waitingSinceDays: 7,
    status: "waiting",
  },
];
