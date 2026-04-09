import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Kafka } from 'kafkajs';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Kafka Setup
const kafka = new Kafka({
  clientId: 'user-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: true,
});
const producer = kafka.producer();

// DB Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Create user (with event emission)
app.post('/api/users', async (req, res) => {
  const { username, email } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id',
      [username, email]
    );
    const userId = result.rows[0].id;

    // Emit Event to Kafka
    await producer.connect();
    await producer.send({
      topic: 'user-events',
      messages: [
        { value: JSON.stringify({ type: 'USER_CREATED', userId, email, username }) },
      ],
    });

    res.status(201).json({ id: userId, username, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`User Service running on port ${PORT}`);
});
