/**
 * ==============================================================================
 * R & L STUDIO - DOHA, QATAR LIVE CLOCK & WEATHER WIDGET (js/weather-clock.js)
 * ==============================================================================
 * 1. Live Time Zone Clock:
 *    - Uses Intl.DateTimeFormat with timeZone: 'Asia/Qatar'
 *    - Real-time digital clock updating every 1000ms (AST / UTC+3)
 * 2. Dynamic Weather Widget:
 *    - Real-time weather data for Doha, Qatar via Open-Meteo API
 *    - Current temperature (°C) and contextual weather icons / condition text
 *    - Caches locally & updates periodically
 * ==============================================================================
 */

// WMO Weather interpretation codes (WMO code -> icon & description)
export function getWeatherDetails(code, isDay = 1) {
  switch (code) {
    case 0:
      return { icon: isDay ? '☀️' : '🌙', desc: isDay ? 'Clear Sky' : 'Clear Night' };
    case 1:
      return { icon: isDay ? '🌤️' : '☁️', desc: 'Mainly Clear' };
    case 2:
      return { icon: isDay ? '⛅' : '☁️', desc: 'Partly Cloudy' };
    case 3:
      return { icon: '☁️', desc: 'Overcast' };
    case 45:
    case 48:
      return { icon: '🌫️', desc: 'Foggy' };
    case 51:
    case 53:
    case 55:
      return { icon: '🌦️', desc: 'Light Drizzle' };
    case 61:
    case 63:
    case 65:
      return { icon: '🌧️', desc: 'Rain' };
    case 71:
    case 73:
    case 75:
      return { icon: '🌨️', desc: 'Snow Flurries' };
    case 80:
    case 81:
    case 82:
      return { icon: '🌦️', desc: 'Rain Showers' };
    case 95:
    case 96:
    case 99:
      return { icon: '⛈️', desc: 'Thunderstorm' };
    default:
      return { icon: isDay ? '☀️' : '🌙', desc: 'Fair' };
  }
}

class DohaLiveWidgets {
  constructor() {
    this.clockInterval = null;
    this.weatherTimer = null;
    this.cachedWeather = null;
    this.timeFormatter = null;

    try {
      this.timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Qatar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.warn('[Doha Clock] Intl timeZone fallback:', e);
    }
  }

  init() {
    this.startClock();
    this.fetchWeather();
    
    // Refresh weather every 10 minutes (600,000 ms)
    this.weatherTimer = setInterval(() => {
      this.fetchWeather();
    }, 10 * 60 * 1000);
  }

  startClock() {
    this.updateClockElements();
    this.clockInterval = setInterval(() => {
      this.updateClockElements();
    }, 1000);
  }

  updateClockElements() {
    let formattedTime = '';
    const now = new Date();

    if (this.timeFormatter) {
      formattedTime = this.timeFormatter.format(now);
    } else {
      // Fallback manual UTC+3 offset
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const dohaTime = new Date(utc + 3 * 3600000);
      formattedTime = dohaTime.toLocaleTimeString('en-US', { hour12: true });
    }

    const clockEls = document.querySelectorAll('.doha-clock-time, [data-doha-clock]');
    clockEls.forEach(el => {
      el.textContent = formattedTime;
    });
  }

  async fetchWeather() {
    // Check localStorage cache to avoid redundant calls within 5 minutes
    try {
      const cached = localStorage.getItem('rl_doha_weather_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        if (age < 5 * 60 * 1000 && parsed.data) {
          this.applyWeatherData(parsed.data);
          return;
        }
      }
    } catch (_) {}

    try {
      // Doha, Qatar coordinates: 25.2854° N, 51.5310° E
      const endpoint = 'https://api.open-meteo.com/v1/forecast?latitude=25.2854&longitude=51.5310&current_weather=true';
      const res = await fetch(endpoint, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Weather HTTP status: ${res.status}`);
      
      const json = await res.json();
      if (json && json.current_weather) {
        const weather = json.current_weather;
        const details = getWeatherDetails(weather.weathercode, weather.is_day);
        const weatherPayload = {
          temp: Math.round(weather.temperature),
          tempExact: weather.temperature,
          icon: details.icon,
          desc: details.desc,
          windspeed: weather.windspeed,
          isDay: weather.is_day
        };

        this.applyWeatherData(weatherPayload);

        try {
          localStorage.setItem('rl_doha_weather_cache', JSON.stringify({
            timestamp: Date.now(),
            data: weatherPayload
          }));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[Doha Weather] Open-Meteo fetch failed:', err);
      // Fallback default for Doha climate
      this.applyWeatherData({
        temp: 32,
        icon: '☀️',
        desc: 'Sunny'
      });
    }
  }

  applyWeatherData(data) {
    this.cachedWeather = data;
    
    // Update temperature elements
    document.querySelectorAll('.doha-weather-temp, [data-doha-temp]').forEach(el => {
      el.textContent = `${data.temp}°C`;
    });

    // Update icon elements
    document.querySelectorAll('.doha-weather-icon, [data-doha-icon]').forEach(el => {
      el.textContent = data.icon;
    });

    // Update description elements
    document.querySelectorAll('.doha-weather-desc, [data-doha-desc]').forEach(el => {
      el.textContent = data.desc;
    });

    // Update title tooltips on weather badges
    document.querySelectorAll('#dohaWeatherWidget, .doha-weather-badge').forEach(badge => {
      badge.setAttribute('title', `Doha, Qatar: ${data.temp}°C, ${data.desc}`);
    });
  }

  destroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.weatherTimer) clearInterval(this.weatherTimer);
  }
}

export const liveWidgets = new DohaLiveWidgets();

// Auto-run if running in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => liveWidgets.init());
  } else {
    liveWidgets.init();
  }
  window.RL_WEATHER_CLOCK = liveWidgets;
}
