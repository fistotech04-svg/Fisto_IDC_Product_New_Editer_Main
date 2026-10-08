import { resolveUploadsPath } from "../utils/supabaseUtils";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
const HDRI_BASE_URL = `${BACKEND_URL}/hdri`;

export const builtInHdris = [
  {
    id: "day_forest",
    aliases: ["day_078"],
    name: "Day Forest",
    category: "Day",
    preview: `${HDRI_BASE_URL}/Day_forest/DayEnvironmentHDRI078_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Day_forest/DayEnvironmentHDRI078_2K_HDR.exr`,
  },
  {
    id: "day_outdoor",
    aliases: ["day_064"],
    name: "Day Outdoor",
    category: "Day",
    preview: `${HDRI_BASE_URL}/Day_outdoor/DayEnvironmentHDRI064_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Day_outdoor/DayEnvironmentHDRI064_2K_HDR.exr`,
  },
  {
    id: "day_street",
    aliases: ["day_089"],
    name: "Day Street",
    category: "Day",
    preview: `${HDRI_BASE_URL}/Day_street/DayEnvironmentHDRI089_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Day_street/DayEnvironmentHDRI089_2K_HDR.exr`,
  },
  {
    id: "evening_outdoor",
    aliases: ["evening_003"],
    name: "Evening Outdoor",
    category: "Evening",
    preview: `${HDRI_BASE_URL}/Evening_outdoor/EveningEnvironmentHDRI003_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Evening_outdoor/EveningEnvironmentHDRI003_2K_HDR.exr`,
  },
  {
    id: "evening_sky",
    aliases: ["evening_sky_047b"],
    name: "Evening Sky",
    category: "Evening",
    preview: `${HDRI_BASE_URL}/Evening_sky/EveningSkyHDRI047B_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Evening_sky/EveningSkyHDRI047B_2K_HDR.exr`,
  },
  {
    id: "evening_sunset",
    aliases: ["evening_sky_046b"],
    name: "Evening Sunset",
    category: "Evening",
    preview: `${HDRI_BASE_URL}/Evening_sunset/EveningSkyHDRI046B_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Evening_sunset/EveningSkyHDRI046B_2K_HDR.exr`,
  },
  {
    id: "indoor_auditorium",
    aliases: ["indoor_019"],
    name: "Indoor Auditorium",
    category: "Indoor",
    preview: `${HDRI_BASE_URL}/Indoor_auditorium/IndoorEnvironmentHDRI019_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Indoor_auditorium/IndoorEnvironmentHDRI019_2K_HDR.exr`,
  },
  {
    id: "indoor_hall",
    aliases: ["indoor_021"],
    name: "Indoor Hall",
    category: "Indoor",
    preview: `${HDRI_BASE_URL}/Indoor_hall/IndoorEnvironmentHDRI021_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Indoor_hall/IndoorEnvironmentHDRI021_2K_HDR.exr`,
  },
  {
    id: "indoor_room",
    aliases: ["indoor_023"],
    name: "Indoor Room",
    category: "Indoor",
    preview: `${HDRI_BASE_URL}/Indoor_room/IndoorEnvironmentHDRI023_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Indoor_room/IndoorEnvironmentHDRI023_2K_HDR.exr`,
  },
  {
    id: "indoor_subway",
    aliases: ["indoor_006"],
    name: "Indoor Subway",
    category: "Indoor",
    preview: `${HDRI_BASE_URL}/Indoor_subway/IndoorEnvironmentHDRI006_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Indoor_subway/IndoorEnvironmentHDRI006_2K_HDR.exr`,
  },
  {
    id: "night_outdoor",
    aliases: ["night_007"],
    name: "Night Outdoor",
    category: "Night",
    preview: `${HDRI_BASE_URL}/Night_outdoor/NightEnvironmentHDRI007_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Night_outdoor/NightEnvironmentHDRI007_2K_HDR.exr`,
  },
  {
    id: "night_sky",
    aliases: ["night_sky_003"],
    name: "Night Sky",
    category: "Night",
    preview: `${HDRI_BASE_URL}/Night_sky/NightSkyHDRI003_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Night_sky/NightSkyHDRI003_2K_HDR.exr`,
  },
  {
    id: "night_sky_stars",
    aliases: ["night_sky_012"],
    name: "Night Sky Stars",
    category: "Night",
    preview: `${HDRI_BASE_URL}/Night_sky_stars/NightSkyHDRI012_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Night_sky_stars/NightSkyHDRI012_2K_HDR.exr`,
  },
  {
    id: "night_street",
    aliases: ["night_010"],
    name: "Night Street",
    category: "Night",
    preview: `${HDRI_BASE_URL}/Night_street/NightEnvironmentHDRI010_2K_TONEMAPPED.jpg`,
    file: `${HDRI_BASE_URL}/Night_street/NightEnvironmentHDRI010_2K_HDR.exr`,
  },
];

// In-memory cache for database-fetched HDRIs
let cachedHdris = [...builtInHdris];
let isFetchingHdris = false;

export const fetchHdris = async (forceRefresh = false) => {
  if (isFetchingHdris) return cachedHdris;
  if (!forceRefresh && cachedHdris.length > 0 && cachedHdris !== builtInHdris) {
    // If already loaded and not forcing refresh
  }
  isFetchingHdris = true;
  try {
    const response = await fetch(`${BACKEND_URL}/api/presets/hdri`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.hdris) && data.hdris.length > 0) {
        const normalized = data.hdris.map((item) => ({
          ...item,
          preview: resolveUploadsPath(item.preview),
          file: resolveUploadsPath(item.file),
        }));
        cachedHdris = normalized;
        // Also update builtInHdris array in place for components importing it directly
        builtInHdris.length = 0;
        builtInHdris.push(...normalized);
      }
    }
  } catch (err) {
    console.warn("[HDRI Data] Backend presets fetch failed, using fallback builtInHdris:", err.message);
  } finally {
    isFetchingHdris = false;
  }
  return cachedHdris;
};

// Initial background fetch
if (typeof window !== "undefined") {
  fetchHdris();
}

