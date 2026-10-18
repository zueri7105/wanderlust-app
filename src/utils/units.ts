export function formatTemperature(
  tempStringOrNum: string | number,
  unitSystem?: 'metric' | 'imperial'
): string {
  const currentUnit = unitSystem || (localStorage.getItem('wanderlust_app_settings')
    ? JSON.parse(localStorage.getItem('wanderlust_app_settings')!).unitSystem
    : 'metric');

  if (typeof tempStringOrNum === 'number') {
    if (currentUnit === 'imperial') {
      const fahrenheit = Math.round(tempStringOrNum * 1.8 + 32);
      return `${fahrenheit}°F`;
    }
    return `${tempStringOrNum}°C`;
  }

  // Parse strings like "13°C – 22°C (55°F – 72°F)" or "20°C"
  const str = String(tempStringOrNum);
  if (currentUnit === 'imperial') {
    // If string already contains Fahrenheit in parens, prioritize it or convert
    if (str.includes('°F')) {
      const fMatch = str.match(/\(([^)]*°F[^)]*)\)/);
      if (fMatch) return fMatch[1];
    }
    // Convert any °C numbers to °F
    return str.replace(/(\d+)\s*°C/g, (_, c) => {
      const f = Math.round(Number(c) * 1.8 + 32);
      return `${f}°F`;
    });
  }

  // Metric (°C)
  // Strip any parenthetical Fahrenheit if present or keep clean °C
  return str.replace(/\s*\([^)]*°F[^)]*\)/g, '');
}
