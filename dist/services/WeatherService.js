"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const redis_1 = __importDefault(require("../config/redis"));
class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
        this.CACHE_TTL_SEC = 30 * 60; // 30 minutes in seconds
        this.apiKey = env_1.env.OPENWEATHERMAP_API_KEY || '';
    }
    async getCurrentWeather(lat, lon) {
        if (!this.apiKey) {
            throw new Error('OPENWEATHERMAP_API_KEY is not configured');
        }
        // Round coordinates to ~1.1km precision to maximize cache hits in the same city
        const roundedLat = lat.toFixed(2);
        const roundedLon = lon.toFixed(2);
        const cacheKey = `weather:${roundedLat},${roundedLon}`;
        if (redis_1.default) {
            const cached = await redis_1.default.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        else {
            const cached = WeatherService.memoryCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
                return cached.data;
            }
        }
        try {
            const response = await axios_1.default.get(this.baseUrl, {
                params: {
                    lat: roundedLat,
                    lon: roundedLon,
                    appid: this.apiKey,
                    units: 'metric'
                }
            });
            const data = response.data;
            const weatherData = {
                temp: data.main.temp,
                condition: data.weather[0]?.main,
                description: data.weather[0]?.description
            };
            // Save to cache
            if (redis_1.default) {
                await redis_1.default.set(cacheKey, JSON.stringify(weatherData), 'EX', this.CACHE_TTL_SEC);
            }
            else {
                WeatherService.memoryCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
            }
            return weatherData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching weather data: ' + error.message);
            throw new Error('Failed to fetch weather data');
        }
    }
    async get7DayForecast(lat, lon) {
        if (!this.apiKey) {
            throw new Error('OPENWEATHERMAP_API_KEY is not configured');
        }
        const roundedLat = lat.toFixed(2);
        const roundedLon = lon.toFixed(2);
        const cacheKey = `forecast:${roundedLat},${roundedLon}`;
        if (redis_1.default) {
            const cached = await redis_1.default.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        else {
            const cached = WeatherService.memoryCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
                return cached.data;
            }
        }
        try {
            const response = await axios_1.default.get('https://api.openweathermap.org/data/2.5/forecast', {
                params: {
                    lat: roundedLat,
                    lon: roundedLon,
                    appid: this.apiKey,
                    units: 'metric',
                    cnt: 7
                }
            });
            const list = response.data.list || [];
            const forecastData = list.map((d) => ({
                date: d.dt_txt,
                temp: d.main.temp,
                humidity: d.main.humidity,
                condition: d.weather[0]?.main,
                description: d.weather[0]?.description,
                rainMm: d.rain?.['3h'] || 0,
                windSpeed: d.wind?.speed || 0
            }));
            if (redis_1.default) {
                await redis_1.default.set(cacheKey, JSON.stringify(forecastData), 'EX', this.CACHE_TTL_SEC);
            }
            else {
                WeatherService.memoryCache.set(cacheKey, { data: forecastData, timestamp: Date.now() });
            }
            return forecastData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching weather forecast: ' + error.message);
            throw new Error('Failed to fetch weather forecast');
        }
    }
}
exports.WeatherService = WeatherService;
WeatherService.memoryCache = new Map();
