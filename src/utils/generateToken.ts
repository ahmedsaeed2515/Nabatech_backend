import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id, sub: id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

export default generateToken;