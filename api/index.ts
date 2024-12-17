import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import revolutOrderHandler from './revolut/order';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://mapper.voiceloop.io' 
    : 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.post('/api/revolut/order', revolutOrderHandler);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
