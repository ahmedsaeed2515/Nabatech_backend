import { setupTestDB, loginUser } from '../setup';
import ZoneModel, { ZoneType } from '../../models/zone_model';
import GardenModel from '../../models/garden_model';
import UserModel from '../../models/user_model';
import WeatherAlertModel, { AlertSeverity } from '../../models/weather_alert_model';
import { WeatherCron } from '../../crons/WeatherCron';
import axios from 'axios';
import * as admin from 'firebase-admin';

// 1. Mock Axios to return freezing temperature
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// 2. Mock Firebase Admin to capture push notification attempts
jest.mock('firebase-admin', () => {
  const sendMock = jest.fn().mockResolvedValue('projects/nabatech/messages/mock123');
  return {
    messaging: jest.fn(() => ({
      send: sendMock,
    })),
  };
});

setupTestDB();

describe('Weather Alerts E2E', () => {
  let userId: string;

  beforeAll(async () => {
    const userResult = await loginUser('weather@example.com');
    userId = userResult.user._id.toString();

    // 2. Create User with OUTDOOR zone and coordinates, and FCM Token
    await UserModel.updateOne({ _id: userId }, {
      latitude: 45.0,
      longitude: -75.0,
      fcmToken: 'mock-fcm-token-123'
    });

    const garden = await GardenModel.create({
      user: userId,
      name: 'Weather Garden',
      location: 'Outside'
    });

    await ZoneModel.create({
      user: userId,
      garden: garden._id,
      name: 'Open Balcony',
      type: ZoneType.OUTDOOR
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Manually invoke WeatherCron - Should detect freezing temp, create CRITICAL alert, and send Push Notification', async () => {
    // Setup Axios to return 2°C
    mockedAxios.get.mockResolvedValue({
      data: {
        main: { temp: 2 }, // 2°C
        weather: [{ description: 'freezing rain' }]
      }
    });

    // 3. Manually invoke Worker Logic
    await WeatherCron.execute();

    // 4. Assert WeatherAlert was created
    const alerts = await WeatherAlertModel.find({ user: userId });
    expect(alerts.length).toBe(1);
    
    const alert = alerts[0];
    expect(alert.severity).toBe(AlertSeverity.CRITICAL);
    expect(alert.message).toMatch(/Freezing Warning!/i);
    expect(alert.message).toMatch(/2°C/);

    // 5. Mock firebase-admin messaging verification
    const messagingMock = admin.messaging().send as jest.Mock;
    expect(messagingMock).toHaveBeenCalledTimes(1);

    const callPayload = messagingMock.mock.calls[0][0];
    expect(callPayload.token).toBe('mock-fcm-token-123');
    expect(callPayload.data).toHaveProperty('type', 'ALERT_WEATHER');
    expect(callPayload.notification.title).toMatch(/Freezing/i);
  });
});
