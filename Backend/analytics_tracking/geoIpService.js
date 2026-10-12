// Backend/analytics_tracking/geoIpService.js
import geoip from "geoip-lite";

const countryNameMap = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  SG: "Singapore",
  AE: "United Arab Emirates",
  JP: "Japan",
  NL: "Netherlands",
  BR: "Brazil",
  IT: "Italy",
  ES: "Spain",
  ID: "Indonesia",
  MY: "Malaysia",
  SA: "Saudi Arabia",
  ZA: "South Africa",
  KR: "South Korea",
  MX: "Mexico"
};

// State mapping for India (ISO 3166-2:IN codes to full state names)
const indiaStates = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CT: "Chhattisgarh",
  CG: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TG: "Telangana",
  TR: "Tripura",
  UT: "Uttarakhand",
  UK: "Uttarakhand",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
  AN: "Andaman and Nicobar",
  CH: "Chandigarh",
  DH: "Dadra and Nagar Haveli",
  DD: "Daman and Diu",
  DL: "Delhi",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry"
};

// State mapping for United States (2-letter postal codes)
const usStates = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia"
};

// Canada Provinces
const canadaProvinces = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", ON: "Ontario",
  PE: "Prince Edward Island", QC: "Quebec", SK: "Saskatchewan",
  NT: "Northwest Territories", NU: "Nunavut", YT: "Yukon"
};

// Australia States
const australiaStates = {
  NSW: "New South Wales", QLD: "Queensland", SA: "South Australia",
  TAS: "Tasmania", VIC: "Victoria", WA: "Western Australia",
  ACT: "Australian Capital Territory", NT: "Northern Territory"
};

/**
 * Resolve 2-letter region code into human-friendly full State/Province name
 */
export const resolveStateName = (countryCode = "", regionCode = "") => {
  if (!regionCode) return "";
  const code = regionCode.trim().toUpperCase();
  const country = (countryCode || "").trim().toUpperCase();

  if (country === "IN") return indiaStates[code] || code;
  if (country === "US") return usStates[code] || code;
  if (country === "CA") return canadaProvinces[code] || code;
  if (country === "AU") return australiaStates[code] || code;

  return code;
};

/**
 * Extract the true client IP address from express request
 */
export const extractClientIp = (req) => {
  if (!req) return "127.0.0.1";

  // Cloudflare Header
  if (req.headers["cf-connecting-ip"]) {
    return req.headers["cf-connecting-ip"].trim();
  }

  // X-Real-IP Header
  if (req.headers["x-real-ip"]) {
    return req.headers["x-real-ip"].trim();
  }

  // Standard X-Forwarded-For Header (first IP in comma-separated list)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const list = forwarded.split(",");
    if (list.length > 0 && list[0].trim()) {
      return list[0].trim();
    }
  }

  // Fallback to socket remoteAddress
  let ip = req.socket?.remoteAddress || req.connection?.remoteAddress || "127.0.0.1";
  
  // Normalize IPv6 mapped IPv4 addresses (e.g. ::ffff:192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  return ip;
};

/**
 * Check if an IP address is a private / local loopback address
 */
export const isPrivateOrLocalIp = (ip) => {
  if (!ip) return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  );
};

/**
 * Resolve IP into Geographic Information using local GeoIP database (Country, State, City)
 */
export const resolveIpLocation = (ip) => {
  if (!ip || isPrivateOrLocalIp(ip)) {
    // For local dev / testing, provide a clean fallback
    return {
      ip: ip || "127.0.0.1",
      country: "Local / Development",
      countryCode: "LOCAL",
      state: "Local State",
      region: "LOCAL",
      city: "Localhost",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      latitude: 0,
      longitude: 0
    };
  }

  try {
    const geo = geoip.lookup(ip);
    if (!geo) {
      return {
        ip,
        country: "Unknown",
        countryCode: "UN",
        state: "Unknown",
        region: "",
        city: "Unknown",
        timezone: "UTC",
        latitude: 0,
        longitude: 0
      };
    }

    const countryCode = geo.country || "UN";
    const countryName = countryNameMap[countryCode] || countryCode;
    const regionCode = geo.region || "";
    const stateName = resolveStateName(countryCode, regionCode) || "Unknown";

    return {
      ip,
      country: countryName,
      countryCode: countryCode,
      state: stateName,
      region: regionCode,
      city: geo.city || "Unknown",
      timezone: geo.timezone || "UTC",
      latitude: geo.ll && geo.ll[0] ? geo.ll[0] : 0,
      longitude: geo.ll && geo.ll[1] ? geo.ll[1] : 0
    };
  } catch (err) {
    console.error("[GeoIP Lookup Error]:", err.message);
    return {
      ip,
      country: "Unknown",
      countryCode: "UN",
      state: "Unknown",
      region: "",
      city: "Unknown",
      timezone: "UTC",
      latitude: 0,
      longitude: 0
    };
  }
};
