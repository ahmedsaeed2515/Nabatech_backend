import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import redisClient from '../config/redis';

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  private static memoryCache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly CACHE_TTL_SEC = 30 * 60; // 30 minutes in seconds

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
    const cacheKey = `weather:${roundedLat},${roundedLon}`;

    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } else {
      const cached = WeatherService.memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
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
      if (redisClient) {
        await redisClient.set(cacheKey, JSON.stringify(weatherData), 'EX', this.CACHE_TTL_SEC);
      } else {
        WeatherService.memoryCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
      }

      return weatherData;
    } catch (error: any) {
      logger.error('Error fetching weather data: ' + error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  async get7DayForecast(lat: number, lon: number) {
    if (!this.apiKey) {
      throw new Error('OPENWEATHERMAP_API_KEY is not configured');
    }

    const roundedLat = lat.toFixed(2);
    const roundedLon = lon.toFixed(2);
    const cacheKey = `forecast:${roundedLat},${roundedLon}`;

    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } else {
      const cached = WeatherService.memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat: roundedLat,
          lon: roundedLon,
          appid: this.apiKey,
          units: 'metric',
          cnt: 7
        }
      });

      const list = (response.data as any).list || [];
      const forecastData = list.map((d: any) => ({
        date: d.dt_txt,
        temp: d.main.temp,
        humidity: d.main.humidity,
        condition: d.weather[0]?.main,
        description: d.weather[0]?.description,
        rainMm: d.rain?.['3h'] || 0,
        windSpeed: d.wind?.speed || 0
      }));

      if (redisClient) {
        await redisClient.set(cacheKey, JSON.stringify(forecastData), 'EX', this.CACHE_TTL_SEC);
      } else {
        WeatherService.memoryCache.set(cacheKey, { data: forecastData, timestamp: Date.now() });
      }

      return forecastData;
    } catch (error: any) {
      logger.error('Error fetching weather forecast: ' + error.message);
      throw new Error('Failed to fetch weather forecast');
    }
  }
}


