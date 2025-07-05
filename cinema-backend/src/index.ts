import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Event Schema and Model
interface IEvent {
  name: string;
  date: string;
  time: string;
  description: string;
  venue: string;
  password: string;
}

const eventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  date: { type: String, required: true, unique: true },
  time: { type: String, required: true },
  description: { type: String, required: true },
  venue: { type: String, required: true },
  password: { type: String, required: true },
});

const Event = mongoose.model<IEvent>('Event', eventSchema);

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
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const seat = await Seat.findOne({ seatId });
    const price = seat ? seat.price : 300;

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
                <p><strong>Total Price:</strong> ₹${price}</p>
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
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send booking confirmation email');
  }
};

// Initialize Seats Function
const initializeSeats = async (): Promise<void> => {
  try {
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
    throw error;
  }
};

// Controllers
const initializeSeatsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    await initializeSeats();
    res.status(201).json({ message: 'Seats initialized successfully' });
  } catch (error) {
    console.error('Initialize seats error:', error);
    res.status(500).json({ error: 'Failed to initialize seats' });
  }
};

const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, time, description, venue, password } = req.body;
    if (!name || !date || !time || !description || !venue || !password) {
      res.status(400).json({ error: 'Name, date, time, description, venue, and password are required' });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
      return;
    }

    // Check password
    if (password !== process.env.ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const existingEvent = await Event.findOne({ date });
    if (existingEvent) {
      res.status(400).json({ error: 'An event already exists for this date' });
      return;
    }

    const event = new Event({ name, date, time, description, venue, password });
    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (password !== event.password) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Check if there are bookings for this event
    const seatsWithBookings = await Seat.find({ 'bookings.date': event.date });
    if (seatsWithBookings.length > 0) {
      res.status(400).json({ error: 'Cannot delete event with existing bookings' });
      return;
    }

    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

const getSeats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }

    // Verify event exists for the date
    const event = await Event.findOne({ date: date.toString() });
    if (!event) {
      res.status(400).json({ error: 'No event scheduled for this date' });
      return;
    }

    const seats = await Seat.find();
    const seatsWithStatus = seats.map((seat) => {
      const booking = seat.bookings.find((b) => b.date === date);
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
    console.error('Get seats error:', error);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

const bookSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { seatId, name, email, phone, bookingDate, quantity } = req.body;

    // Validate input
    if (!seatId || !name || !email || !phone || !bookingDate) {
      console.error('Missing required fields:', { seatId, name, email, phone, bookingDate });
      res.status(400).json({ error: 'seatId, name, email, phone, and bookingDate are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate phone format
    const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{10}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number format. Use 10 digits or +[country code][10 digits]' });
      return;
    }

    // Verify event exists for the date
    const event = await Event.findOne({ date: bookingDate });
    if (!event) {
      console.error('No event found for date:', bookingDate);
      res.status(400).json({ error: 'No event scheduled for this date' });
      return;
    }

    const seat = await Seat.findOne({ seatId });
    if (!seat) {
      console.error('Seat not found:', seatId);
      res.status(404).json({ error: 'Seat not found' });
      return;
    }

    const existingBooking = seat.bookings.find((b) => b.date === bookingDate);
    if (existingBooking) {
      console.error('Seat already booked:', { seatId, bookingDate });
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
  } catch (error: any) {
    console.error('Book seat error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: 'Failed to book seat' });
  }
};

// Routes
app.post('/api/seats/initialize', initializeSeatsEndpoint);
app.get('/api/events', getEvents);
app.post('/api/events', createEvent);
app.delete('/api/events/:id', deleteEvent);
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