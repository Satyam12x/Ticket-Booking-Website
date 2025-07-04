import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Seat Schema and Model
interface IBooking {
  date: string;
  bookedBy: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'booked';
}

interface ISeat {
  seatId: string;
  row: number;
  column: string;
  price: number;
  bookings: IBooking[];
}

const seatSchema = new Schema<ISeat>({
  seatId: { type: String, required: true, unique: true },
  row: { type: Number, required: true },
  column: { type: String, required: true },
  price: { type: Number, required: true },
  bookings: [
    {
      date: { type: String, required: true },
      bookedBy: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
      },
      status: { type: String, enum: ['booked'], default: 'booked' },
    },
  ],
});

const Seat = mongoose.model<ISeat>('Seat', seatSchema);

// Email Utility
const sendBookingConfirmation = async (
  email: string,
  seatId: string,
  name: string,
  bookingDate: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Seat Booking Confirmation',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #F5F6F5;
            color: #1F2A44;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #FFFFFF;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #1F2A44;
            padding: 20px;
            text-align: center;
          }
          .header img {
            max-width: 150px;
            height: auto;
          }
          .content {
            padding: 30px;
          }
          h1 {
            color: #1F2A44;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
            margin: 10px 0;
          }
          .details {
            background-color: #F5F6F5;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .details p {
            margin: 5px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1F2A44;
            color: #FFFFFF !important;
            text-decoration: none;
            border-radius: 4px;
            font-size: 16px;
            margin: 20px 0;
          }
          .footer {
            background-color: #1F2A44;
            color: #FFFFFF;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer a {
            color: #FFFFFF;
            text-decoration: underline;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 10px;
            }
            .header img {
              max-width: 120px;
            }
            h1 {
              font-size: 20px;
            }
            p {
              font-size: 14px;
            }
            .button {
              padding: 10px 20px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://via.placeholder.com/150x50?text=Logo" alt="Company Logo">
          </div>
          <div class="content">
            <h1>Your Booking Confirmation</h1>
            <p>Dear ${name},</p>
            <p>Thank you for choosing our seat booking service. We are pleased to confirm your booking for the following details:</p>
            <div class="details">
              <p><strong>Seat:</strong> ${seatId}</p>
              <p><strong>Date:</strong> ${bookingDate}</p>
              <p><strong>Total Price:</strong> ₹${ 300}</p>
            </div>
            <p>We look forward to welcoming you. If you have any questions or need further assistance, please don't hesitate to contact us.</p>
            <a href="https://example.com" class="button">View Your Booking</a>
          </div>
          <div class="footer">
            <p><strong>Seat Booking Co.</strong></p>
            <p>123 Event Street, City, Country</p>
            <p>Email: support@seatbookingco.com | Phone: +1-234-567-8900</p>
            <p><a href="https://example.com">www.seatbookingco.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Initialize Seats Function
const initializeSeats = async (): Promise<void> => {
  try {
    await Seat.deleteMany({ $or: [{ id: { $exists: true } }, { category: { $exists: true } }] });
    const existingSeats = await Seat.countDocuments();
    if (existingSeats > 0) {
      console.log('Seats already initialized, skipping initialization.');
      return;
    }

    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const seats = [];

    for (let row of rows) {
      for (let col of columns) {
        const seatId = `${col}${row}`;
        seats.push({
          seatId,
          row,
          column: col,
          price: 300,
          bookings: [],
        });
      }
    }

    await Seat.deleteMany({});
    await Seat.insertMany(seats);
    console.log('Seats initialized successfully');
  } catch (error) {
    console.error('Failed to initialize seats:', error);
  }
};

// Controllers
const initializeSeatsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    await initializeSeats();
    res.status(201).json({ message: 'Seats initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize seats' });
  }
};

const getSeats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const targetDate = date ? date.toString() : new Date().toISOString().split('T')[0];
    const seats = await Seat.find();

    const seatsWithStatus = seats.map((seat) => {
      const booking = seat.bookings.find((b) => b.date === targetDate);
      return {
        ...seat.toObject(),
        status: booking ? 'booked' : 'available',
        bookedBy: booking ? booking.bookedBy : null,
      };
    });

    if (seats.length === 0) {
      await initializeSeats();
      const newSeats = await Seat.find();
      const newSeatsWithStatus = newSeats.map((seat) => ({
        ...seat.toObject(),
        status: 'available',
        bookedBy: null,
      }));
      res.json(newSeatsWithStatus);
      return;
    }

    res.json(seatsWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

const bookSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { seatId, name, email, phone, bookingDate } = req.body;
    if (!bookingDate) {
      res.status(400).json({ error: 'Booking date is required' });
      return;
    }

    const seat = await Seat.findOne({ seatId });
    if (!seat) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }

    const existingBooking = seat.bookings.find((b) => b.date === bookingDate);
    if (existingBooking) {
      res.status(400).json({ error: 'Seat is already booked for this date' });
      return;
    }

    seat.bookings.push({
      date: bookingDate,
      bookedBy: { name, email, phone },
      status: 'booked',
    });
    await seat.save();

    await sendBookingConfirmation(email, seatId, name, bookingDate);
    res.json({ message: 'Seat booked successfully', seat });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book seat' });
  }
};

// Routes
app.post('/api/seats/initialize', initializeSeatsEndpoint);
app.get('/api/seats', getSeats);
app.post('/api/seats/book', bookSeat);

// Database Connection and Server Start
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/seat-booking')
  .then(async () => {
    console.log('Connected to MongoDB');
    await initializeSeats();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });