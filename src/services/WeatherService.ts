import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  private static cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.apiKey = env.OPENWEATHERMAP_API_KEY || '';
  }

  async getCurrentWeather(lat: number, lon: number) {
    if (!this.apiKey) {
      throw new Error('OPENWEATHERMAP_API_KEY is not configured');
    }

    // Round coordinates to ~1.1km precision to maximize cache hits in the same city
    const roundedLat = lat.toFixed(2);
    const roundedLon = lon.toFixed(2);
    const cacheKey = `${roundedLat},${roundedLon}`;

    const cached = WeatherService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          lat: roundedLat,
          lon: roundedLon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const data = response.data as any;
      const weatherData = {
        temp: data.main.temp,
        condition: data.weather[0]?.main,
        description: data.weather[0]?.description
      };

      // Save to cache
      WeatherService.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

      return weatherData;
    } catch (error: any) {
      logger.error('Error fetching weather data: ' + error.message);
      throw new Error('Failed to fetch weather data');
    }
  }
}
