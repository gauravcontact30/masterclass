/**
 * The nearest major city to a visit's approximate (IP-derived) coordinates, for the Super Admin's new-user location
 * cards. IP coordinates are a city or network centroid, so this answers "which big city is this near", not where
 * someone lives. Major Indian cities first (most learners), then regional hubs elsewhere. No network calls.
 */
type City = [name: string, region: string, country: string, lat: number, lon: number];

export const MAJOR_CITIES: City[] = [
  ["Delhi", "Delhi", "IN", 28.61, 77.21], ["Mumbai", "Maharashtra", "IN", 19.08, 72.88], ["Bengaluru", "Karnataka", "IN", 12.97, 77.59],
  ["Hyderabad", "Telangana", "IN", 17.39, 78.49], ["Chennai", "Tamil Nadu", "IN", 13.08, 80.27], ["Kolkata", "West Bengal", "IN", 22.57, 88.36],
  ["Pune", "Maharashtra", "IN", 18.52, 73.86], ["Ahmedabad", "Gujarat", "IN", 23.02, 72.57], ["Jaipur", "Rajasthan", "IN", 26.91, 75.79],
  ["Lucknow", "Uttar Pradesh", "IN", 26.85, 80.95], ["Kanpur", "Uttar Pradesh", "IN", 26.45, 80.33], ["Nagpur", "Maharashtra", "IN", 21.15, 79.09],
  ["Indore", "Madhya Pradesh", "IN", 22.72, 75.86], ["Bhopal", "Madhya Pradesh", "IN", 23.26, 77.41], ["Patna", "Bihar", "IN", 25.59, 85.14],
  ["Surat", "Gujarat", "IN", 21.17, 72.83], ["Vadodara", "Gujarat", "IN", 22.31, 73.18], ["Rajkot", "Gujarat", "IN", 22.30, 70.80],
  ["Visakhapatnam", "Andhra Pradesh", "IN", 17.69, 83.22], ["Vijayawada", "Andhra Pradesh", "IN", 16.51, 80.65], ["Coimbatore", "Tamil Nadu", "IN", 11.02, 76.96],
  ["Madurai", "Tamil Nadu", "IN", 9.93, 78.12], ["Kochi", "Kerala", "IN", 9.93, 76.27], ["Thiruvananthapuram", "Kerala", "IN", 8.52, 76.94],
  ["Kozhikode", "Kerala", "IN", 11.26, 75.78], ["Mysuru", "Karnataka", "IN", 12.30, 76.64], ["Mangaluru", "Karnataka", "IN", 12.91, 74.86],
  ["Hubballi", "Karnataka", "IN", 15.36, 75.12], ["Chandigarh", "Chandigarh", "IN", 30.73, 76.78], ["Ludhiana", "Punjab", "IN", 30.90, 75.86],
  ["Amritsar", "Punjab", "IN", 31.63, 74.87], ["Jalandhar", "Punjab", "IN", 31.33, 75.58], ["Dehradun", "Uttarakhand", "IN", 30.32, 78.03],
  ["Shimla", "Himachal Pradesh", "IN", 31.10, 77.17], ["Srinagar", "Jammu and Kashmir", "IN", 34.08, 74.80], ["Jammu", "Jammu and Kashmir", "IN", 32.73, 74.86],
  ["Agra", "Uttar Pradesh", "IN", 27.18, 78.01], ["Varanasi", "Uttar Pradesh", "IN", 25.32, 82.97], ["Prayagraj", "Uttar Pradesh", "IN", 25.44, 81.85],
  ["Meerut", "Uttar Pradesh", "IN", 28.98, 77.71], ["Noida", "Uttar Pradesh", "IN", 28.54, 77.39], ["Ghaziabad", "Uttar Pradesh", "IN", 28.67, 77.45],
  ["Gorakhpur", "Uttar Pradesh", "IN", 26.76, 83.37], ["Bareilly", "Uttar Pradesh", "IN", 28.37, 79.43], ["Gurugram", "Haryana", "IN", 28.46, 77.03],
  ["Faridabad", "Haryana", "IN", 28.41, 77.32], ["Jodhpur", "Rajasthan", "IN", 26.24, 73.02], ["Udaipur", "Rajasthan", "IN", 24.59, 73.71],
  ["Kota", "Rajasthan", "IN", 25.21, 75.86], ["Bikaner", "Rajasthan", "IN", 28.02, 73.31], ["Gwalior", "Madhya Pradesh", "IN", 26.22, 78.18],
  ["Jabalpur", "Madhya Pradesh", "IN", 23.18, 79.99], ["Raipur", "Chhattisgarh", "IN", 21.25, 81.63], ["Ranchi", "Jharkhand", "IN", 23.34, 85.31],
  ["Jamshedpur", "Jharkhand", "IN", 22.80, 86.20], ["Dhanbad", "Jharkhand", "IN", 23.80, 86.43], ["Bhubaneswar", "Odisha", "IN", 20.30, 85.82],
  ["Cuttack", "Odisha", "IN", 20.46, 85.88], ["Guwahati", "Assam", "IN", 26.14, 91.74], ["Siliguri", "West Bengal", "IN", 26.73, 88.40],
  ["Durgapur", "West Bengal", "IN", 23.52, 87.31], ["Gaya", "Bihar", "IN", 24.79, 85.00], ["Muzaffarpur", "Bihar", "IN", 26.12, 85.39],
  ["Nashik", "Maharashtra", "IN", 20.00, 73.79], ["Aurangabad", "Maharashtra", "IN", 19.88, 75.34], ["Kolhapur", "Maharashtra", "IN", 16.70, 74.24],
  ["Solapur", "Maharashtra", "IN", 17.66, 75.91], ["Thane", "Maharashtra", "IN", 19.22, 72.98], ["Panaji", "Goa", "IN", 15.49, 73.83],
  ["Tiruchirappalli", "Tamil Nadu", "IN", 10.79, 78.70], ["Salem", "Tamil Nadu", "IN", 11.66, 78.15], ["Puducherry", "Puducherry", "IN", 11.94, 79.81],
  ["Warangal", "Telangana", "IN", 17.97, 79.59], ["Guntur", "Andhra Pradesh", "IN", 16.31, 80.44], ["Tirupati", "Andhra Pradesh", "IN", 13.63, 79.42],
  ["Imphal", "Manipur", "IN", 24.82, 93.94], ["Shillong", "Meghalaya", "IN", 25.58, 91.89], ["Agartala", "Tripura", "IN", 23.83, 91.29],
  ["Aizawl", "Mizoram", "IN", 23.73, 92.72], ["Kohima", "Nagaland", "IN", 25.67, 94.11], ["Itanagar", "Arunachal Pradesh", "IN", 27.08, 93.61],
  ["Gangtok", "Sikkim", "IN", 27.33, 88.61], ["Port Blair", "Andaman and Nicobar Islands", "IN", 11.62, 92.73],
  ["Kathmandu", "Bagmati", "NP", 27.72, 85.32], ["Dhaka", "Dhaka", "BD", 23.81, 90.41], ["Colombo", "Western", "LK", 6.93, 79.86],
  ["Karachi", "Sindh", "PK", 24.86, 67.01], ["Lahore", "Punjab", "PK", 31.55, 74.34], ["Dubai", "Dubai", "AE", 25.20, 55.27],
  ["Abu Dhabi", "Abu Dhabi", "AE", 24.45, 54.38], ["Doha", "Doha", "QA", 25.29, 51.53], ["Riyadh", "Riyadh", "SA", 24.71, 46.68],
  ["Singapore", "Singapore", "SG", 1.35, 103.82], ["Kuala Lumpur", "Kuala Lumpur", "MY", 3.14, 101.69], ["Bangkok", "Bangkok", "TH", 13.76, 100.50],
  ["Jakarta", "Jakarta", "ID", -6.21, 106.85], ["Hong Kong", "Hong Kong", "HK", 22.32, 114.17], ["Tokyo", "Tokyo", "JP", 35.68, 139.69],
  ["Sydney", "New South Wales", "AU", -33.87, 151.21], ["Melbourne", "Victoria", "AU", -37.81, 144.96], ["London", "England", "GB", 51.51, -0.13],
  ["Manchester", "England", "GB", 53.48, -2.24], ["Paris", "Île-de-France", "FR", 48.86, 2.35], ["Berlin", "Berlin", "DE", 52.52, 13.40],
  ["Frankfurt", "Hesse", "DE", 50.11, 8.68], ["Amsterdam", "North Holland", "NL", 52.37, 4.90], ["Dublin", "Leinster", "IE", 53.35, -6.26],
  ["New York", "New York", "US", 40.71, -74.01], ["San Francisco", "California", "US", 37.77, -122.42], ["Los Angeles", "California", "US", 34.05, -118.24],
  ["Seattle", "Washington", "US", 47.61, -122.33], ["Chicago", "Illinois", "US", 41.88, -87.63], ["Dallas", "Texas", "US", 32.78, -96.80],
  ["Ashburn", "Virginia", "US", 39.04, -77.49], ["Toronto", "Ontario", "CA", 43.65, -79.38], ["Vancouver", "British Columbia", "CA", 49.28, -123.12],
  ["Nairobi", "Nairobi", "KE", -1.29, 36.82], ["Lagos", "Lagos", "NG", 6.52, 3.38], ["Johannesburg", "Gauteng", "ZA", -26.20, 28.05],
  ["São Paulo", "São Paulo", "BR", -23.55, -46.63], ["Mexico City", "Mexico City", "MX", 19.43, -99.13],
];

/** Great-circle distance in kilometres. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180, dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const same = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" }) === 0;
/** Beyond this the nearest listed city is not meaningfully "nearby". */
const MAX_KM = 400;

/**
 * The nearest major city other than the visitor's own (a Pune visitor is "near Mumbai", not "near Pune"), with its
 * distance, or null without coordinates or when nothing listed lies within MAX_KM.
 */
export function nearbyCity(latitude: number | null | undefined, longitude: number | null | undefined, ownCity?: string | null) {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  let best: { name: string; region: string; country: string; km: number } | null = null;
  for (const [name, region, country, lat, lon] of MAJOR_CITIES) {
    const km = distanceKm(latitude, longitude, lat, lon);
    // The visitor's own city: by name, or a listed city whose centre is within 15 km of the visitor's coordinates.
    if ((ownCity && same(name, ownCity)) || km < 15) continue;
    if (km <= MAX_KM && (!best || km < best.km)) best = { name, region, country, km: Math.round(km) };
  }
  return best;
}

/** ISO 3166-2:IN subdivision codes, as the hosting platform sends them, to state and union territory names. */
const INDIAN_STATES: Record<string, string> = {
  AN: "Andaman and Nicobar Islands", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CH: "Chandigarh", CT: "Chhattisgarh", CG: "Chhattisgarh",
  DH: "Dadra and Nagar Haveli and Daman and Diu", DN: "Dadra and Nagar Haveli and Daman and Diu", DD: "Dadra and Nagar Haveli and Daman and Diu", DL: "Delhi", GA: "Goa", GJ: "Gujarat",
  HP: "Himachal Pradesh", HR: "Haryana", JH: "Jharkhand", JK: "Jammu and Kashmir", KA: "Karnataka", KL: "Kerala", LA: "Ladakh", LD: "Lakshadweep",
  MH: "Maharashtra", ML: "Meghalaya", MN: "Manipur", MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", OD: "Odisha", PB: "Punjab",
  PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim", TG: "Telangana", TS: "Telangana", TN: "Tamil Nadu", TR: "Tripura", UP: "Uttar Pradesh",
  UT: "Uttarakhand", UK: "Uttarakhand", WB: "West Bengal",
};

/** A readable state name: Indian ISO codes expanded, anything else as sent. */
export function stateLabel(region: string | null | undefined, country: string | null | undefined) {
  if (!region) return null;
  return country?.toUpperCase() === "IN" ? INDIAN_STATES[region.toUpperCase()] ?? region : region;
}
