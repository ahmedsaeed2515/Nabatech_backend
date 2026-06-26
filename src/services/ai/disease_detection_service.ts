import axios from 'axios';
import FormData from 'form-data';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface MLPrediction {
  diseaseNameEn: string;
  confidence: number;
  candidates?: { diseaseNameEn: string; confidence: number }[];
}

export class DiseaseDetectionService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = env.PYTHON_ML_API_URL || 'http://localhost:8000';
  }

  async predictFromImage(fileBuffer: Buffer, filename: string): Promise<MLPrediction> {
    try {
      const form = new FormData();
      form.append('file', fileBuffer, { filename });

      const response = await axios.post(`${this.apiUrl}/predict`, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 10000 // 10s timeout
      });

      const data: any = response.data;
      if (data && data.prediction) {
        return {
          diseaseNameEn: data.prediction,
          confidence: data.confidence || 0,
          candidates: data.candidates || []
        };
      } else {
        throw new Error('Invalid response format from ML API');
      }
    } catch (error: any) {
      logger.error('ML API Prediction Error:', error.message);
      throw new Error('Failed to get prediction from ML API');
    }
  }
}


