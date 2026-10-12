// Backend/analytics_tracking/deviceService.js

/**
 * Parse user agent to extract device type, browser, and operating system
 */
export const parseUserAgent = (userAgentString = "") => {
  const ua = (userAgentString || "").toLowerCase();

  // 1. Device Type
  let type = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    type = "Tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    type = "Mobile";
  }

  // 2. Operating System
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "ChromeOS";

  // 3. Browser
  let browser = "Unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";

  return {
    type,
    browser,
    os,
    userAgent: userAgentString ? userAgentString.substring(0, 300) : ""
  };
};
