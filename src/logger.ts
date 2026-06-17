import winston from 'winston';

const transports = [new winston.transports.Console()];
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  transports.push(new winston.transports.File({ filename: 'logs/app.log' }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

export default logger;
