import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production-12345';
  return jwt.sign({ id, sub: id }, jwtSecret, {
    expiresIn: '30d',
  });
};

export default generateToken;