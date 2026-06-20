const jwt = require('jsonwebtoken');

const token = jwt.sign(
    {
        id: '6a34bc5a27f1ee0a94b8f6d9',
        sub: '6a34bc5a27f1ee0a94b8f6d9',
        role: 'user',
        tokenVersion: 0
    },
    'supersecretjwtkey12345!',
    { expiresIn: '1y' }
);
console.log(token);
