import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Mock authentication logic
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// Verify token endpoint
app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth Service running on port ${PORT}`);
});
