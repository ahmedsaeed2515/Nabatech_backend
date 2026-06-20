import { WeatherService } from '../../../services/WeatherService';
import axios from 'axios';
import { env } from '../../../config/env';
import redisClient from '../../../config/redis';

jest.mock('axios');
jest.mock('../../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  }
}));

describe('[UNIT] WeatherService - Phase 5', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    jest.clearAllMocks();
    env.OPENWEATHERMAP_API_KEY = 'test_api_key';
    weatherService = new WeatherService();
  });

  it('PASS: Should fetch current weather and cache it', async () => {
    const mockData = {
      main: { temp: 25 },
      weather: [{ main: 'Clear', description: 'clear sky' }]
    };
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockData });
    (redisClient?.get as jest.Mock).mockResolvedValueOnce(null);

    const result = await weatherService.getCurrentWeather(30.04, 31.23);

    expect(result.temp).toBe(25);
    expect(result.condition).toBe('Clear');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(redisClient?.set).toHaveBeenCalled();
  });

  it('PASS: Should return cached weather if available', async () => {
    const cachedData = { temp: 22, condition: 'Clouds', description: 'scattered clouds' };
    (redisClient?.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));

    const result = await weatherService.getCurrentWeather(30.04, 31.23);

    expect(result.temp).toBe(22);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('FAIL: Should throw error if API fails', async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (redisClient?.get as jest.Mock).mockResolvedValueOnce(null);

    await expect(weatherService.getCurrentWeather(30.04, 31.23)).rejects.toThrow('Failed to fetch weather data');
  });

  it('FAIL: Should throw error if API key is missing', async () => {
    env.OPENWEATHERMAP_API_KEY = '';
    weatherService = new WeatherService();

    await expect(weatherService.getCurrentWeather(30.04, 31.23)).rejects.toThrow('OPENWEATHERMAP_API_KEY is not configured');
  });

  it('PASS: Should fetch 7-day forecast and cache it', async () => {
    const mockData = {
      list: [
        {
          dt_txt: '2023-01-01 12:00:00',
          main: { temp: 20, humidity: 50 },
          weather: [{ main: 'Rain', description: 'light rain' }],
          rain: { '3h': 2.5 },
          wind: { speed: 5 }
        }
      ]
    };
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockData });
    (redisClient?.get as jest.Mock).mockResolvedValueOnce(null);

    const result = await weatherService.get7DayForecast(30.04, 31.23);

    expect(result.length).toBe(1);
    expect(result[0].temp).toBe(20);
    expect(result[0].condition).toBe('Rain');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(redisClient?.set).toHaveBeenCalled();
  });
});
