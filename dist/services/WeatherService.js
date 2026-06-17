"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
        this.apiKey = env_1.env.OPENWEATHERMAP_API_KEY || '';
    }
    async getCurrentWeather(lat, lon) {
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
            WeatherService.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
            return weatherData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching weather data: ' + error.message);
            throw new Error('Failed to fetch weather data');
        }
    }
}
exports.WeatherService = WeatherService;
WeatherService.cache = new Map();
