"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
var axios_1 = __importDefault(require("axios"));
var env_1 = require("../config/env");
var logger_1 = require("../utils/logger");
var redis_1 = __importDefault(require("../config/redis"));
var WeatherService = /** @class */ (function () {
    function WeatherService() {
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
        this.CACHE_TTL_SEC = 30 * 60; // 30 minutes in seconds
        this.apiKey = env_1.env.OPENWEATHERMAP_API_KEY || '';
    }
    WeatherService.prototype.getCurrentWeather = function (lat, lon) {
        return __awaiter(this, void 0, void 0, function () {
            var roundedLat, roundedLon, cacheKey, cached, cached, response, data, weatherData, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.apiKey) {
                            throw new Error('OPENWEATHERMAP_API_KEY is not configured');
                        }
                        roundedLat = lat.toFixed(2);
                        roundedLon = lon.toFixed(2);
                        cacheKey = "weather:".concat(roundedLat, ",").concat(roundedLon);
                        if (!redis_1.default) return [3 /*break*/, 2];
                        return [4 /*yield*/, redis_1.default.get(cacheKey)];
                    case 1:
                        cached = _c.sent();
                        if (cached)
                            return [2 /*return*/, JSON.parse(cached)];
                        return [3 /*break*/, 3];
                    case 2:
                        cached = WeatherService.memoryCache.get(cacheKey);
                        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
                            return [2 /*return*/, cached.data];
                        }
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 8, , 9]);
                        return [4 /*yield*/, axios_1.default.get(this.baseUrl, {
                                params: {
                                    lat: roundedLat,
                                    lon: roundedLon,
                                    appid: this.apiKey,
                                    units: 'metric'
                                }
                            })];
                    case 4:
                        response = _c.sent();
                        data = response.data;
                        weatherData = {
                            temp: data.main.temp,
                            condition: (_a = data.weather[0]) === null || _a === void 0 ? void 0 : _a.main,
                            description: (_b = data.weather[0]) === null || _b === void 0 ? void 0 : _b.description
                        };
                        if (!redis_1.default) return [3 /*break*/, 6];
                        return [4 /*yield*/, redis_1.default.set(cacheKey, JSON.stringify(weatherData), 'EX', this.CACHE_TTL_SEC)];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        WeatherService.memoryCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
                        _c.label = 7;
                    case 7: return [2 /*return*/, weatherData];
                    case 8:
                        error_1 = _c.sent();
                        logger_1.logger.error('Error fetching weather data: ' + error_1.message);
                        throw new Error('Failed to fetch weather data');
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    WeatherService.prototype.get7DayForecast = function (lat, lon) {
        return __awaiter(this, void 0, void 0, function () {
            var roundedLat, roundedLon, cacheKey, cached, cached, response, list, forecastData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.apiKey) {
                            throw new Error('OPENWEATHERMAP_API_KEY is not configured');
                        }
                        roundedLat = lat.toFixed(2);
                        roundedLon = lon.toFixed(2);
                        cacheKey = "forecast:".concat(roundedLat, ",").concat(roundedLon);
                        if (!redis_1.default) return [3 /*break*/, 2];
                        return [4 /*yield*/, redis_1.default.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached)
                            return [2 /*return*/, JSON.parse(cached)];
                        return [3 /*break*/, 3];
                    case 2:
                        cached = WeatherService.memoryCache.get(cacheKey);
                        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
                            return [2 /*return*/, cached.data];
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 8, , 9]);
                        return [4 /*yield*/, axios_1.default.get('https://api.openweathermap.org/data/2.5/forecast', {
                                params: {
                                    lat: roundedLat,
                                    lon: roundedLon,
                                    appid: this.apiKey,
                                    units: 'metric',
                                    cnt: 7
                                }
                            })];
                    case 4:
                        response = _a.sent();
                        list = response.data.list || [];
                        forecastData = list.map(function (d) {
                            var _a, _b, _c, _d;
                            return ({
                                date: d.dt_txt,
                                temp: d.main.temp,
                                humidity: d.main.humidity,
                                condition: (_a = d.weather[0]) === null || _a === void 0 ? void 0 : _a.main,
                                description: (_b = d.weather[0]) === null || _b === void 0 ? void 0 : _b.description,
                                rainMm: ((_c = d.rain) === null || _c === void 0 ? void 0 : _c['3h']) || 0,
                                windSpeed: ((_d = d.wind) === null || _d === void 0 ? void 0 : _d.speed) || 0
                            });
                        });
                        if (!redis_1.default) return [3 /*break*/, 6];
                        return [4 /*yield*/, redis_1.default.set(cacheKey, JSON.stringify(forecastData), 'EX', this.CACHE_TTL_SEC)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        WeatherService.memoryCache.set(cacheKey, { data: forecastData, timestamp: Date.now() });
                        _a.label = 7;
                    case 7: return [2 /*return*/, forecastData];
                    case 8:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error fetching weather forecast: ' + error_2.message);
                        throw new Error('Failed to fetch weather forecast');
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    WeatherService.memoryCache = new Map();
    return WeatherService;
}());
exports.WeatherService = WeatherService;
