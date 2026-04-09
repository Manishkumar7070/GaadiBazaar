import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: true,
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });

  console.log('Notification Service connected to Kafka');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value?.toString() || '{}');
      console.log(`[Notification] Received event: ${event.type} for user ${event.userId}`);
      
      // Logic to send email/push notification would go here
      if (event.type === 'USER_CREATED') {
        console.log(`Sending welcome email to ${event.email}...`);
      }
    },
  });
};

run().catch(console.error);
