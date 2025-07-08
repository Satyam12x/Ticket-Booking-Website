import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

interface IEvent {
  name: string;
  date: string;
  time: string;
  description: string;
  venue: string;
  password: string;
  totalSeats: number;
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  date: { type: String, required: true, unique: true },
  time: { type: String, required: true },
  description: { type: String, required: true },
  venue: { type: String, required: true },
  password: { type: String, required: true },
  totalSeats: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now },
});

const Event = mongoose.model<IEvent>('Event', eventSchema);

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
  row: string;
  column: number;
  price: number;
  eventId: string;
  bookings: IBooking[];
}

const seatSchema = new Schema<ISeat>({
  seatId: { type: String, required: true },
  row: { type: String, required: true },
  column: { type: Number, required: true },
  price: { type: Number, required: true },
  eventId: { type: String, required: true },
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

// Define compound unique index on seatId and eventId
seatSchema.index({ seatId: 1, eventId: 1 }, { unique: true });

const Seat = mongoose.model<ISeat>('Seat', seatSchema);

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
          <title>Professor Sahab Ticket</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Helvetica', 'Arial', sans-serif;
              background-color: #111;
              color: #fff;
            }
            .ticket {
              max-width: 600px;
              margin: 0 auto;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
              background: linear-gradient(to right, #000, #222);
            }
            .left-section {
              padding: 30px;
            }
            .right-section {
              background-color: #f8b219;
              color: #000;
              padding: 20px;
              text-align: center;
            }
            .subheading {
              font-size: 14px;
              color: #ddd;
              margin-bottom: 10px;
              letter-spacing: 0.5px;
            }
            .title {
              font-size: 32px;
              color: #f8b219;
              margin: 10px 0;
              font-weight: bold;
            }
            .subtitle {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
              color: white;
            }
            .timing,
            .dates,
            .venue {
              font-size: 16px;
              margin: 8px 0;
              line-height: 1.5;
              color: white;
            }
            .qr-pay {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 20px;
            }
            .scan-text {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .qr-code {
              width: 100px;
              height: 100px;
              background: #fff;
              padding: 5px;
              border-radius: 8px;
            }
            .price {
              font-size: 24px;
              font-weight: bold;
              color: white;
            }
            .instructions-box h3 {
              font-size: 16px;
              margin-bottom: 10px;
              color: #000;
            }
            .instructions-box ul {
              list-style: none;
              padding: 0;
              font-size: 14px;
              text-align: left;
            }
            .instructions-box ul li {
              margin-bottom: 8px;
              position: relative;
              padding-left: 20px;
            }
            .instructions-box ul li::before {
              content: '•';
              color: #000;
              position: absolute;
              left: 0;
            }
            .admit {
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
              color: #000;
            }
            .download-btn {
              display: inline-block;
              background: linear-gradient(to right, #2563eb, #1e40af);
              color: #fff;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              transition: transform 0.2s ease;
            }
            .download-btn:hover {
              transform: translateY(-2px);
            }
            p {
              color: white;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 10px;
              }
              .ticket {
                flex-direction: column;
              }
              .left-section, .right-section {
                padding: 20px;
              }
              .title {
                font-size: 24px;
              }
              .subtitle {
                font-size: 18px;
              }
              .timing, .dates, .venue {
                font-size: 14px;
              }
              .qr-code {
                width: 80px;
                height: 80px;
              }
              .instructions-box h3 {
                font-size: 14px;
              }
              .instructions-box ul {
                font-size: 12px;
              }
              .admit {
                font-size: 16px;
              }
              .download-btn {
                padding: 10px 20px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="left-section">
              <h4 class="subheading">MUKESH BHATI ACTING SCHOOL & CULTURAL WING PRESENTS</h4>
              <h1 class="title">PROFESSOR SAHAB</h1>
              <h2 class="subtitle">A COMEDY PLAY</h2>
              <p class="timing">07 PM ONWARDS</p>
              <p>Dear ${name},</p>
              <p><strong>Seat:</strong> ${seatId}</p>
              <p><strong>Date:</strong> ${bookingDate}</p>
              <p class="venue">
                Venue: Mukesh Bhati Acting School, E1/74, Milan Road, <br>
                near YMCA University, Sector-11, Faridabad
              </p>
              <a href="http://localhost:3000/ticket?seatId=${seatId}&bookingDate=${bookingDate}&name=${encodeURIComponent(
        name
      )}" class="download-btn">Download Ticket</a>
            </div>
            <div class="right-section">
              <div class="instructions-box">
                <h3>INSTRUCTIONS</h3>
                <ul>
                  <li>Please be seated at least 20 minutes before the performance.</li>
                  <li>Keep your phones on silent mode.</li>
                  <li>Please occupy your allotted seat.</li>
                  <li>Photography & Recording strictly prohibited during the performance.</li>
                  <li>Eatables are not allowed inside.</li>
                </ul>
              </div>
              <div class="admit">ADMIT ONE</div>
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

const initializeSeats = async (eventId: string, totalSeats: number): Promise<void> => {
  try {
    // Check for existing seats for this specific event
    const existingSeats = await Seat.countDocuments({ eventId });
    if (existingSeats >= totalSeats) {
      console.log(`Seats already initialized for event ${eventId}, found ${existingSeats} seats.`);
      return;
    }

    // Delete any existing seats for this event to ensure clean initialization
    await Seat.deleteMany({ eventId });
    console.log(`Cleared existing seats for event ${eventId}`);

    const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const columns = Array.from({ length: 10 }, (_, i) => i + 1);
    const seats = [];
    let seatsGenerated = 0;

    for (let row of rows) {
      for (let col of columns) {
        if (seatsGenerated >= totalSeats) break;
        const seatId = `${row}${col}`;
        seats.push({
          seatId,
          row,
          column: col,
          price: 300,
          eventId,
          bookings: [],
        });
        seatsGenerated++;
      }
      if (seatsGenerated >= totalSeats) break;
    }

    await Seat.insertMany(seats);
    console.log(`Seats initialized successfully for event ${eventId}: ${seats.length} seats`);
  } catch (error) {
    console.error('Failed to initialize seats:', error);
    throw error;
  }
};

const initializeSeatsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, totalSeats } = req.body;
    if (!eventId || !totalSeats || !Number.isInteger(totalSeats) || totalSeats < 1) {
      res.status(400).json({ error: 'eventId and a positive integer totalSeats are required' });
      return;
    }
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    await initializeSeats(eventId, totalSeats);
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

const getRecentEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const events = await Event.find({
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Get recent events error:', error);
    res.status(500).json({ error: 'Failed to fetch recent events' });
  }
};

const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, time, description, venue, password, totalSeats } = req.body;
    console.log('Create event request received:', { name, date, time, description, venue, password, totalSeats });

    if (!name || !date || !time || !description || !venue || !password || !totalSeats) {
      console.error('Missing required fields:', { name, date, time, description, venue, password, totalSeats });
      res.status(400).json({ error: 'Name, date, time, description, venue, password, and totalSeats are required' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('Invalid date format:', date);
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      console.error('Invalid time format:', time);
      res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
      return;
    }

    if (!Number.isInteger(totalSeats) || totalSeats < 1) {
      console.error('Invalid totalSeats:', totalSeats);
      res.status(400).json({ error: 'Total seats must be a positive integer' });
      return;
    }

    if (!process.env.ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable not set');
      res.status(500).json({ error: 'Server configuration error: ADMIN_PASSWORD not set' });
      return;
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      console.error('Invalid password provided');
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const existingEvent = await Event.findOne({ date });
    if (existingEvent) {
      console.error('Event already exists for date:', date);
      res.status(400).json({ error: 'An event already exists for this date' });
      return;
    }

    const event = new Event({ name, date, time, description, venue, password, totalSeats });
    await event.save();
    console.log('Event saved successfully:', event);

    await initializeSeats(event._id.toString(), totalSeats);

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error: any) {
    console.error('Create event error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: 'Failed to create event: ' + error.message });
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

    const seatsWithBookings = await Seat.find({ eventId: id, bookings: { $ne: [] } });
    if (seatsWithBookings.length > 0) {
      res.status(400).json({ error: 'Cannot delete event with existing bookings' });
      return;
    }

    await Seat.deleteMany({ eventId: id });
    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event and associated seats deleted successfully' });
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

    const event = await Event.findOne({ date: date.toString() });
    if (!event) {
      res.status(400).json({ error: 'No event scheduled for this date' });
      return;
    }

    const seats = await Seat.find({ eventId: event._id.toString() });
    if (seats.length < event.totalSeats) {
      console.log(`Seats missing for event ${event._id}, reinitializing...`);
      await initializeSeats(event._id.toString(), event.totalSeats);
      const newSeats = await Seat.find({ eventId: event._id.toString() });
      const newSeatsWithStatus = newSeats.map((seat) => ({
        ...seat.toObject(),
        status: 'available',
        bookedBy: null,
      }));
      res.json(newSeatsWithStatus);
      return;
    }

    const seatsWithStatus = seats.map((seat) => {
      const booking = seat.bookings.find((b) => b.date === date);
      return {
        ...seat.toObject(),
        status: booking ? 'booked' : 'available',
        bookedBy: booking ? booking.bookedBy : null,
      };
    });

    res.json(seatsWithStatus);
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

const bookSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { seatId, name, email, phone, bookingDate } = req.body;

    if (!seatId || !name || !email || !phone || !bookingDate) {
      console.error('Missing required fields:', { seatId, name, email, phone, bookingDate });
      res.status(400).json({ error: 'seatId, name, email, phone, and bookingDate are required' });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{10}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number format. Use 10 digits or +[country code][10 digits]' });
      return;
    }

    const event = await Event.findOne({ date: bookingDate });
    if (!event) {
      console.error('No event found for date:', bookingDate);
      res.status(400).json({ error: 'No event scheduled for this date' });
      return;
    }

    const seat = await Seat.findOne({ seatId, eventId: event._id.toString() });
    if (!seat) {
      console.error('Seat not found for event:', { seatId, eventId: event._id });
      res.status(404).json({ error: 'Seat not found for this event' });
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

app.post('/api/seats/initialize', initializeSeatsEndpoint);
app.get('/api/events', getEvents);
app.get('/api/events/recent', getRecentEvents);
app.post('/api/events', createEvent);
app.delete('/api/events/:id', deleteEvent);
app.get('/api/seats', getSeats);
app.post('/api/seats/book', bookSeat);

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/seat-booking')
  .then(async () => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });