import express, { Request, Response, NextFunction } from "express";
import mongoose, { Schema, ClientSession } from "mongoose";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { randomBytes } from "crypto";
import { isValidObjectId } from "mongoose";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, TextRun } from "docx";
import { Readable } from "stream";

dotenv.config({ path: ".env" });

const app = express();

// Middleware
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.use(express.json());
app.use(cookieParser());

// Validate environment variables
const requiredEnvVars = [
  "MONGODB_URL",
  "JWT_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "USER_EMAIL",
  "USER_PASSWORD",
  "USER_NAME",
  "OWNER_EMAIL",
];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length) {
  console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// Interfaces
interface IEvent {
  _id: any;
  name: string;
  date: string;
  time: string;
  description: string;
  venue: string;
  password: string;
  totalSeats: number;
  registrationClosed: boolean;
  createdAt: Date;
}

interface IBooking {
  date: string;
  bookedBy: { name: string; email: string; phone: string };
  status: "booked";
}

interface ISeat {
  seatId: string;
  row: string;
  column: number;
  price: number;
  eventId: string;
  bookings: IBooking[];
}

interface IUser {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: Date;
}

interface IOtp {
  email: string;
  otp: string;
  expiresAt: Date;
  type: "register" | "reset-password";
}

// Schemas
const eventSchema = new Schema<IEvent>({
  name: { type: String, required: true, trim: true },
  date: { type: String, required: true, unique: true },
  time: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  venue: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  totalSeats: { type: Number, required: true, min: 1 },
  registrationClosed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const seatSchema = new Schema<ISeat>({
  seatId: { type: String, required: true },
  row: { type: String, required: true },
  column: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  eventId: { type: String, required: true },
  bookings: [
    {
      date: { type: String, required: true },
      bookedBy: {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
      },
      status: { type: String, enum: ["booked"], default: "booked" },
    },
  ],
});

seatSchema.index({ seatId: 1, eventId: 1 }, { unique: true });

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, trim: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, enum: ["register", "reset-password"], required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Models
const Event = mongoose.model<IEvent>("Event", eventSchema);
const Seat = mongoose.model<ISeat>("Seat", seatSchema);
const User = mongoose.model<IUser>("User", userSchema);
const Otp = mongoose.model<IOtp>("Otp", otpSchema);

// Validation Middleware
const validateDateFormat = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === "POST") {
    const { date, bookingDate } = req.body || {};
    const dateToValidate = date || bookingDate;
    if (dateToValidate && !/^\d{4}-\d{2}-\d{2}$/.test(dateToValidate)) {
      console.error("ValidateDateFormat error: Invalid date format", { dateToValidate });
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }
  } else if (req.method === "GET") {
    const date = req.query.date as string;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error("ValidateDateFormat error: Invalid date format", { date });
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }
  }
  next();
};

const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body || {};
  if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    console.error("ValidateEmail error: Invalid email format", { email });
    res.status(400).json({ error: "Invalid email format" });
    return;
  }
  next();
};

const validatePhone = (req: Request, res: Response, next: NextFunction): void => {
  const { phone } = req.body || {};
  if (phone && !/^(\+?\d{1,3}[-.\s]?)?\d{10}$/.test(phone)) {
    console.error("ValidatePhone error: Invalid phone number format", { phone });
    res.status(400).json({ error: "Invalid phone number format. Use 10 digits or +[country code][10 digits]" });
    return;
  }
  next();
};

// Auth Middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("AuthenticateToken: Request details", {
    url: req.url,
    method: req.method,
    cookies: req.cookies,
    headers: { authorization: req.headers.authorization ? "Bearer <redacted>" : undefined },
  });
  if (!token) {
    console.error("Authentication error: No token provided", { url: req.url, method: req.method });
    res.status(401).json({ error: "Authentication required: No token provided" });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.error("Authentication error: User not found", { userId: decoded.userId });
      res.status(401).json({ error: "Authentication failed: User not found" });
      res.clearCookie("token");
      return;
    }
    if (!user.isVerified) {
      console.error("Authentication error: User not verified", { userId: decoded.userId });
      res.status(401).json({ error: "User email not verified" });
      res.clearCookie("token");
      return;
    }
    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error("Token verification error:", {
      message: error.message,
      token: token.substring(0, 10) + "...",
      url: req.url,
      method: req.method,
    });
    res.status(401).json({ error: `Invalid token: ${error.message}` });
    res.clearCookie("token");
    return;
  }
};

const restrictToAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = (req as any).user;
  if (!user.isAdmin) {
    console.error("Admin access denied", { userId: user._id, email: user.email, url: req.url });
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
};

// Email Utility
const sendOtpEmail = async (email: string, otp: string, type: "register" | "reset-password"): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const subject = type === "register" ? "Verify Your Email" : "Reset Your Password";
  const html = `
    <p>Dear User,</p>
    <p>Your OTP for ${type === "register" ? "email verification" : "password reset"} is <strong>${otp}</strong>.</p>
    <p>This OTP is valid for 5 minutes.</p>
    <p>Thank you,</p>
    <p>Mukesh Bhati Acting School</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });
    console.log(`OTP email sent to ${email} for ${type}`);
  } catch (error: any) {
    console.error("Send OTP email error:", { message: error.message, stack: error.stack, email, type });
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

const generateOtp = (): string => randomBytes(3).toString("hex").toUpperCase();

// Booking Confirmation Email
const sendBookingConfirmation = async (email: string, seatId: string, name: string, bookingDate: string): Promise<void> => {
  try {
    if (!/^[A-Z][1-9][0-9]?$/.test(seatId)) {
      throw new Error(`Invalid seatId format: ${seatId}`);
    }
    const seat = await Seat.findOne({ seatId });
    if (!seat) {
      throw new Error(`Seat not found for seatId: ${seatId}`);
    }
    if (!isValidObjectId(seat.eventId)) {
      throw new Error(`Invalid eventId format: ${seat.eventId}`);
    }
    const eventDetails = await Event.findById(seat.eventId);
    if (!eventDetails) {
      throw new Error(`Event not found for eventId: ${seat.eventId}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      throw new Error(`Invalid bookingDate format: ${bookingDate}`);
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const price = seat.price || 200;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Seat Booking Confirmation",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Professor Sahab Ticket</title>
          <style>
            body { margin: 0; padding: 20px; font-family: 'Helvetica', 'Arial', sans-serif; background-color: #111; color: #fff; }
            .ticket { max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); background: linear-gradient(to right, #000, #222); }
            .left-section { padding: 30px; }
            .right-section { background-color: #f8b219; color: #000; padding: 20px; text-align: center; }
            .subheading { font-size: 14px; color: #ddd; margin-bottom: 10px; letter-spacing: 0.5px; }
            .title { font-size: 32px; color: #f8b219; margin: 10px 0; font-weight: bold; }
            .subtitle { font-size: 20px; font-weight: bold; margin: 10px 0; color: white; }
            .timing, .dates, .venue { font-size: 16px; margin: 8px 0; line-height: 1.5; color: white; }
            .qr-pay { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .scan-text { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
            .qr-code { width: 100px; height: 100px; background: #fff; padding: 5px; border-radius: 8px; }
            .price { font-size: 24px; font-weight: bold; color: white; }
            .instructions-box h3 { font-size: 16px; margin-bottom: 10px; color: #000; }
            .instructions-box ul { list-style: none; padding: 0; font-size: 14px; text-align: left; }
            .instructions-box ul li { margin-bottom: 8px; position: relative; padding-left: 20px; }
            .instructions-box ul li::before { content: '•'; color: #000; position: absolute; left: 0; }
            .admit { font-size: 18px; font-weight: bold; margin-top: 20px; color: #000; }
            .download-btn { display: inline-block; background: linear-gradient(to right, #2563eb, #1e40af); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); transition: transform 0.2s ease; }
            .download-btn:hover { transform: translateY(-2px); }
            p { color: white; }
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .ticket { flex-direction: column; }
              .left-section, .right-section { padding: 20px; }
              .title { font-size: 24px; }
              .subtitle { font-size: 18px; }
              .timing, .dates, .venue { font-size: 14px; }
              .qr-code { width: 80px; height: 80px; }
              .instructions-box h3 { font-size: 14px; }
              .instructions-box ul { font-size: 12px; }
              .admit { font-size: 16px; }
              .download-btn { padding: 10px 20px; font-size: 14px; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="left-section">
              <h4 class="subheading">MUKESH BHATI ACTING SCHOOL & CULTURAL WING PRESENTS</h4>
              <h1 class="title">${eventDetails.name}</h1>
              <h2 class="subtitle">A COMEDY PLAY</h2>
              <p class="timing">${eventDetails.time}</p>
              <p>Dear ${name},</p>
              <p><strong>Seat:</strong> ${seatId}</p>
              <p><strong>Date:</strong> ${bookingDate}</p>
              <p class="venue">Venue: ${eventDetails.venue}</p>
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
    console.log(`Booking confirmation email sent to ${email} for seat ${seatId}`);
  } catch (error: any) {
    console.error("Email sending error:", { message: error.message, stack: error.stack, seatId, email, bookingDate });
    throw new Error(`Failed to send booking confirmation email: ${error.message}`);
  }
};

// Generate Word Document
const generateBookingDetailsDoc = async (
  event: IEvent,
  bookings: { seatId: string; name: string; email: string; phone: string }[]
): Promise<Buffer> => {
  console.log("Generating DOCX for event:", {
    eventId: event._id,
    eventName: event.name,
    bookingCount: bookings.length,
    bookings,
  });
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: `Booking Details for ${event.name}`, bold: true, size: 24 })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Date: ${event.date}`, size: 20 }),
                new TextRun({ text: `Time: ${event.time}`, size: 20 }),
                new TextRun({ text: `Venue: ${event.venue}`, size: 20 }),
              ].map((run, i) => new Paragraph({ children: [run], spacing: { after: 100 } })),
            }),
            new Paragraph({
              children: [new TextRun({ text: "Bookings:", bold: true, size: 20 })],
              spacing: { after: 200 },
            }),
            bookings.length > 0
              ? new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Seat ID")], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                      new TableCell({ children: [new Paragraph("Name")], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                      new TableCell({ children: [new Paragraph("Email")], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                      new TableCell({ children: [new Paragraph("Phone")], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                    ],
                  }),
                  ...bookings.map(
                    (booking) =>
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph(booking.seatId)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                          new TableCell({ children: [new Paragraph(booking.name)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                          new TableCell({ children: [new Paragraph(booking.email)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                          new TableCell({ children: [new Paragraph(booking.phone)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                        ],
                      })
                  ),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 2 },
                  bottom: { style: BorderStyle.SINGLE, size: 2 },
                  left: { style: BorderStyle.SINGLE, size: 2 },
                  right: { style: BorderStyle.SINGLE, size: 2 },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
                  insideVertical: { style: BorderStyle.SINGLE, size: 2 },
                },
              })
              : new Paragraph({
                children: [new TextRun({ text: "No bookings found for this event.", italics: true, size: 20 })],
                spacing: { after: 200 },
              }),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    console.log("DOCX generated successfully, buffer size:", buffer.length);
    return buffer;
  } catch (error: any) {
    console.error("Generate Word document error:", { message: error.message, stack: error.stack, eventId: event._id });
    throw new Error(`Failed to generate Word document: ${error.message}`);
  }
};

// Send Booking Details Email
const sendBookingDetailsEmail = async (
  event: IEvent,
  bookings: { seatId: string; name: string; email: string; phone: string }[]
): Promise<void> => {
  try {
    const docBuffer = await generateBookingDetailsDoc(event, bookings);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `Booking Details for ${event.name}`,
      text: `Attached is the booking details for the event "${event.name}" on ${event.date}.`,
      attachments: [
        {
          filename: `booking-details-${event._id.toString()}.docx`,
          content: docBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking details email sent to ${process.env.OWNER_EMAIL} for event ${event._id}`);
  } catch (error: any) {
    console.error("Send booking details email error:", { message: error.message, stack: error.stack, eventId: event._id });
    throw new Error(`Failed to send booking details email: ${error.message}`);
  }
};

// Seat Initialization
const initializeSeats = async (eventId: string, totalSeats: number, session?: ClientSession): Promise<void> => {
  try {
    const existingSeats = await Seat.countDocuments({ eventId }, { session });
    if (existingSeats >= totalSeats) {
      console.log(`Seats already initialized for event ${eventId}, found ${existingSeats} seats.`);
      return;
    }
    await Seat.deleteMany({ eventId }, { session });
    console.log(`Cleared existing seats for event ${eventId}`);
    const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const columns = Array.from({ length: 10 }, (_, i) => i + 1);
    const seats = [];
    let seatsGenerated = 0;
    for (const row of rows) {
      for (const col of columns) {
        if (seatsGenerated >= totalSeats) break;
        const seatId = `${row}${col}`;
        seats.push({
          seatId,
          row,
          column: col,
          price: 200,
          eventId,
          bookings: [],
        });
        seatsGenerated++;
      }
      if (seatsGenerated >= totalSeats) break;
    }
    await Seat.insertMany(seats, { session });
    console.log(`Seats initialized successfully for event ${eventId}: ${seats.length} seats`);
  } catch (error: any) {
    console.error("Failed to initialize seats:", { message: error.message, stack: error.stack, eventId, totalSeats });
    throw new Error(`Failed to initialize seats: ${error.message}`);
  }
};

// Initialize default user
const initializeDefaultUser = async (): Promise<void> => {
  try {
    const email = process.env.USER_EMAIL!;
    const adminEmail = process.env.ADMIN_EMAIL!;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(process.env.USER_PASSWORD!, 10);
      const user = new User({
        name: process.env.USER_NAME!,
        email,
        password: hashedPassword,
        isVerified: true,
        isAdmin: email === adminEmail,
      });
      await user.save();
      console.log(`Default user created: ${email}`);
    } else {
      console.log(`Default user already exists: ${email}`);
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
      const adminUser = new User({
        name: "Admin",
        email: adminEmail,
        password: hashedAdminPassword,
        isVerified: true,
        isAdmin: true,
      });
      await adminUser.save();
      console.log(`Admin user created: ${adminEmail}`);
    } else if (!existingAdmin.isAdmin) {
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log(`Updated user to admin: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  } catch (error: any) {
    console.error("Failed to initialize default user:", { message: error.message, stack: error.stack });
    throw error;
  }
};

// Routes
app.post(
  "/api/seats/initialize",
  authenticateToken,
  restrictToAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { eventId, totalSeats } = req.body;
    console.log("Initialize seats request:", { eventId, totalSeats });
    if (!isValidObjectId(eventId) || !Number.isInteger(totalSeats) || totalSeats < 1) {
      console.error("Initialize seats error: Invalid input", { eventId, totalSeats });
      res.status(400).json({ error: "Valid eventId and positive integer totalSeats are required" });
      return;
    }
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        console.error("Initialize seats error: Event not found", { eventId });
        res.status(404).json({ error: "Event not found" });
        return;
      }
      await initializeSeats(eventId, totalSeats);
      res.status(201).json({ message: "Seats initialized successfully" });
    } catch (error: any) {
      console.error("Initialize seats error:", { message: error.message, stack: error.stack, eventId, totalSeats });
      res.status(500).json({ error: "Failed to initialize seats" });
    }
  }
);

app.get("/api/events", async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const events = await Event.find({
      date: { $gte: today, $ne: today },
      registrationClosed: false,
    })
      .sort({ date: 1 })
      .select("-password");
    res.json(events);
    console.log("Get events successful");
  } catch (error: any) {
    console.error("Get events error:", { message: error.message, stack: error.stack });
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/events/recent", async (req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = new Date().toISOString().split("T")[0];
    const events = await Event.find({
      createdAt: { $gte: sevenDaysAgo },
      date: { $gte: today, $ne: today },
      registrationClosed: false,
    })
      .sort({ createdAt: -1 })
      .select("-password");
    res.json(events);
    console.log("Get recent events successful");
  } catch (error: any) {
    console.error("Get recent events error:", { message: error.message, stack: error.stack });
    res.status(500).json({ error: "Failed to retrieve recent events" });
  }
});

app.get(
  "/api/events/past",
  authenticateToken,
  restrictToAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const events = await Event.find({
        $or: [{ date: { $lt: today } }, { registrationClosed: true }],
      })
        .sort({ date: -1 })
        .select("-password");
      res.json(events);
      console.log("Get past events successful");
    } catch (error: any) {
      console.error("Get past events error:", { message: error.message, stack: error.stack });
      res.status(500).json({ error: "Failed to retrieve past events" });
    }
  }
);

app.get(
  "/api/events/:id/bookings",
  authenticateToken,
  restrictToAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log("Get event bookings request:", { id });
    if (!isValidObjectId(id)) {
      console.error("Get event bookings error: Invalid event ID", { id });
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }
    try {
      const event = await Event.findById(id);
      if (!event) {
        console.error("Get event bookings error: Event not found", { id });
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const seats = await Seat.find({ eventId: id });
      const bookings = seats
        .filter((seat) => seat.bookings.length > 0)
        .flatMap((seat) =>
          seat.bookings
            .filter((booking) => booking.date === event.date)
            .map((booking) => ({
              seatId: seat.seatId,
              name: booking.bookedBy.name,
              email: booking.bookedBy.email,
              phone: booking.bookedBy.phone,
            }))
        );
      res.json(bookings);
      console.log(`Get event bookings successful: ${bookings.length} bookings for event ${id}`);
    } catch (error: any) {
      console.error("Get event bookings error:", { message: error.message, stack: error.stack, id });
      res.status(500).json({ error: "Failed to fetch event bookings" });
    }
  }
);

app.post(
  "/api/events",
  authenticateToken,
  restrictToAdmin,
  validateDateFormat,
  async (req: Request, res: Response): Promise<void> => {
    const { name, date, time, description, venue, password, totalSeats } = req.body;
    console.log("Create event request:", { name, date, time, venue, totalSeats });
    if (!name || !date || !time || !description || !venue || !password || !totalSeats) {
      console.error("Create event error: Missing required fields", { body: req.body });
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (!/^[0-1]?[0-9]|2[0-3]:[0-5][0-9]$/.test(time)) {
      console.error("Create event error: Invalid time format", { time });
      res.status(400).json({ error: "Invalid time format. Use HH:MM" });
      return;
    }
    if (!Number.isInteger(totalSeats) || totalSeats < 1) {
      console.error("Create event error: Invalid totalSeats", { totalSeats });
      res.status(400).json({ error: "Total seats must be a positive integer" });
      return;
    }
    try {
      if (password !== process.env.ADMIN_PASSWORD) {
        console.error("Create event error: Invalid password");
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      const existingEvent = await Event.findOne({ date });
      if (existingEvent) {
        console.error("Create event error: Event already exists for date", { date });
        res.status(400).json({ error: "An event already exists for this date" });
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      if (date === today) {
        console.error("Create event error: Cannot create event for today", { date });
        res.status(400).json({ error: "Cannot create event for the current date" });
        return;
      }
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const event = new Event({
          name,
          date,
          time,
          description,
          venue,
          password,
          totalSeats,
          registrationClosed: false,
        });
        await event.save({ session });
        await initializeSeats(event._id.toString(), totalSeats, session);
        await session.commitTransaction();
        res.status(201).json({
          message: "Event created successfully",
          event: { ...event.toObject(), password: undefined },
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error: any) {
      console.error("Create event error:", { message: error.message, stack: error.stack, body: req.body });
      res.status(500).json({ error: "Failed to create event" });
    }
  }
);

app.delete(
  "/api/events/:id",
  authenticateToken,
  restrictToAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;
    console.log("Delete event request:", { id });
    if (!isValidObjectId(id)) {
      console.error("Delete event error: Invalid event ID", { id });
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }
    if (!password) {
      console.error("Delete event error: Password required", { body: req.body });
      res.status(400).json({ error: "Password is required" });
      return;
    }
    try {
      if (password !== process.env.ADMIN_PASSWORD) {
        console.error("Delete event error: Invalid password");
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      const event = await Event.findById(id);
      if (!event) {
        console.error("Delete event error: Event not found", { id });
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const seatsWithBookings = await Seat.find({ eventId: id, bookings: { $ne: [] } });
      if (seatsWithBookings.length > 0) {
        console.error("Delete event error: Cannot delete event with bookings", { id });
        res.status(400).json({ error: "Cannot delete event with existing bookings" });
        return;
      }
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await Seat.deleteMany({ eventId: id }, { session });
        await Event.findByIdAndDelete(id, { session });
        await session.commitTransaction();
        res.json({ message: "Event and associated seats deleted successfully" });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error: any) {
      console.error("Delete event error:", { message: error.message, stack: error.stack, id });
      res.status(500).json({ error: "Failed to delete event" });
    }
  }
);

app.post(
  "/api/events/:id/end-registration",
  authenticateToken,
  restrictToAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log("End registration request:", { id });
    if (!isValidObjectId(id)) {
      console.error("End registration error: Invalid event ID", { id });
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }
    try {
      const event = await Event.findById(id);
      if (!event) {
        console.error("End registration error: Event not found", { id });
        res.status(404).json({ error: "Event not found" });
        return;
      }
      if (event.registrationClosed) {
        console.error("End registration error: Registration already closed", { id });
        res.status(400).json({ error: "Registration is already closed" });
        return;
      }
      const seats = await Seat.find({ eventId: id });
      const bookings = seats
        .filter((seat) => seat.bookings.length > 0)
        .flatMap((seat) =>
          seat.bookings
            .filter((booking) => booking.date === event.date)
            .map((booking) => ({
              seatId: seat.seatId,
              name: booking.bookedBy.name,
              email: booking.bookedBy.email,
              phone: booking.bookedBy.phone,
            }))
        );
      console.log("Bookings fetched for end registration:", { eventId: id, bookingCount: bookings.length, bookings });
      event.registrationClosed = true;
      await event.save();
      for (const booking of bookings) {
        try {
          await sendBookingConfirmation(booking.email, booking.seatId, booking.name, event.date);
        } catch (emailError: any) {
          console.error("Failed to send confirmation email:", {
            message: emailError.message,
            email: booking.email,
            seatId: booking.seatId,
          });
        }
      }
      try {
        await sendBookingDetailsEmail(event, bookings);
      } catch (emailError: any) {
        console.error("Failed to send booking details email:", {
          message: emailError.message,
          email: process.env.OWNER_EMAIL,
          eventId: id,
        });
      }
      res.json({ message: "Registration closed successfully" });
    } catch (error: any) {
      console.error("End registration error:", { message: error.message, stack: error.stack, id });
      res.status(500).json({ error: "Failed to end registration" });
    }
  }
);

app.get(
  "/api/seats",
  validateDateFormat,
  async (req: Request, res: Response): Promise<void> => {
    const { date } = req.query;
    console.log("Get seats request:", { date });
    if (!date) {
      console.error("Get seats error: Date required", { query: req.query });
      res.status(400).json({ error: "Date is required" });
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      if (date === today) {
        console.error("Get seats error: Cannot fetch seats for today", { date });
        res.status(400).json({ error: "Cannot book seats for the current date" });
        return;
      }
      const event = await Event.findOne({ date: date.toString() });
      if (!event) {
        console.error("Get seats error: No event found", { date });
        res.status(400).json({ error: "No event scheduled for this date" });
        return;
      }
      let seats = await Seat.find({ eventId: event._id.toString() });
      if (seats.length < event.totalSeats) {
        console.log(`Seats missing for event ${event._id}, reinitializing...`);
        await initializeSeats(event._id.toString(), event.totalSeats);
        seats = await Seat.find({ eventId: event._id.toString() });
      }
      const seatsWithStatus = seats.map((seat) => {
        const booking = seat.bookings.find((b) => b.date === date);
        return {
          ...seat.toObject(),
          status: booking ? "booked" : "available",
          bookedBy: booking ? booking.bookedBy : null,
        };
      });
      res.json(seatsWithStatus);
    } catch (error: any) {
      console.error("Get seats error:", { message: error.message, stack: error.stack, date });
      res.status(500).json({ error: "Failed to fetch seats" });
    }
  }
);

app.post(
  "/api/seats/book",
  authenticateToken,
  validateDateFormat,
  validateEmail,
  validatePhone,
  async (req: Request, res: Response): Promise<void> => {
    const { seatId, name, email, phone, bookingDate, eventId } = req.body;
    const user = (req as any).user;
    console.log("Booking request:", { seatId, name, email, phone, bookingDate, eventId, userId: user._id });
    if (!seatId || !name || !email || !phone || !bookingDate || !eventId) {
      console.error("Booking error: Missing required fields", { body: req.body });
      res.status(400).json({ error: "seatId, name, email, phone, bookingDate, and eventId are required" });
      return;
    }
    if (!isValidObjectId(eventId)) {
      console.error("Booking error: Invalid eventId", { eventId });
      res.status(400).json({ error: "Invalid eventId" });
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (bookingDate === today) {
      console.error("Booking error: Cannot book for today", { bookingDate });
      res.status(400).json({ error: "Cannot book seats for the current date" });
      return;
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const event = await Event.findById(eventId).session(session);
      if (!event) {
        console.error("Booking error: No event found", { eventId });
        throw new Error("No event found for this eventId");
      }
      if (event.date !== bookingDate) {
        console.error("Booking error: Booking date does not match event date", { bookingDate, eventDate: event.date });
        throw new Error("Booking date does not match event date");
      }
      if (event.registrationClosed && !user.isAdmin) {
        console.error("Booking error: Registration closed", { eventId });
        throw new Error("Registration for this event is closed");
      }
      const seat = await Seat.findOne({ seatId, eventId: event._id.toString() }).session(session);
      if (!seat) {
        console.error("Booking error: Seat not found", { seatId, eventId: event._id });
        throw new Error("Seat not found for this event");
      }
      const existingBooking = seat.bookings.find((b) => b.date === bookingDate);
      if (existingBooking) {
        console.error("Booking error: Seat already booked", { seatId, bookingDate });
        throw new Error("Seat is already booked for this date");
      }
      seat.bookings.push({
        date: bookingDate,
        bookedBy: { name, email, phone },
        status: "booked",
      });
      await seat.save({ session });
      await session.commitTransaction();
      console.log("Seat booked successfully", { seatId, bookingDate, email });
      await sendBookingConfirmation(email, seatId, name, bookingDate);
      res.json({ message: "Seat booked successfully", seat });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Book seat error:", { message: error.message, stack: error.stack, body: req.body, userId: user._id });
      res
        .status(
          error.message.includes("already booked") || error.message.includes("not found") || error.message.includes("Registration closed")
            ? 400
            : 500
        )
        .json({ error: error.message || "Failed to book seat" });
    } finally {
      session.endSession();
    }
  }
);

app.get(
  "/api/events/:id",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log("Get event request:", { id });
    if (!isValidObjectId(id)) {
      console.error("Get event error: Invalid event ID", { id });
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }
    try {
      const event = await Event.findById(id).select("-password");
      if (!event) {
        console.error("Get event error: Event not found", { id });
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      if (event.date === today) {
        console.error("Get event error: Event is today", { id, date: today });
        res.status(400).json({ error: "Cannot access event scheduled for today" });
        return;
      }
      res.json(event);
    } catch (error: any) {
      console.error("Get event by ID error:", { message: error.message, stack: error.stack, id });
      res.status(500).json({ error: "Failed to fetch event details" });
    }
  }
);

app.get(
  "/api/seats/by-ids",
  validateDateFormat,
  async (req: Request, res: Response): Promise<void> => {
    const { seatIds, date } = req.query;
    console.log("Get seats by IDs request:", { seatIds, date });
    if (!seatIds || !date) {
      console.error("Get seats by IDs error: Missing seatIds or date", { query: req.query });
      res.status(400).json({ error: "seatIds and date are required" });
      return;
    }
    let seatIdArray: string[];
    if (Array.isArray(seatIds)) {
      if (!seatIds.every((id) => typeof id === "string")) {
        console.error("Get seats by IDs error: Invalid seatIds format", { seatIds });
        res.status(400).json({ error: "All seatIds must be strings" });
        return;
      }
      seatIdArray = seatIds as string[];
    } else if (typeof seatIds === "string") {
      seatIdArray = seatIds.split(",");
    } else {
      console.error("Get seats by IDs error: Invalid seatIds format", { seatIds });
      res.status(400).json({ error: "Invalid seatIds format" });
      return;
    }
    if (!seatIdArray.every((id) => /^[A-Z][1-9][0-9]?$/.test(id))) {
      console.error("Get seats by IDs error: Invalid seatId format", { seatIds: seatIdArray });
      res.status(400).json({ error: `Invalid seatId format in: ${seatIdArray.join(", ")}` });
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      if (date === today) {
        console.error("Get seats by IDs error: Cannot fetch seats for today", { date });
        res.status(400).json({ error: "Cannot fetch seats for the current date" });
        return;
      }
      const event = await Event.findOne({ date: date.toString() });
      if (!event) {
        console.error("Get seats by IDs error: No event found", { date });
        res.status(400).json({ error: `No event found for date: ${date}` });
        return;
      }
      const seats = await Seat.find({ seatId: { $in: seatIdArray }, eventId: event._id.toString() });
      if (!seats.length || seats.length !== seatIdArray.length) {
        console.error("Get seats by IDs error: Not all seats found", { seatIds: seatIdArray, date });
        res.status(404).json({ error: `Not all seats found for seatIds: ${seatIdArray.join(", ")} and date: ${date}` });
        return;
      }
      const seatsWithStatus = seats.map((seat) => {
        const booking = seat.bookings.find((b) => b.date === date);
        return {
          ...seat.toObject(),
          status: booking ? "booked" : "available",
          bookedBy: booking ? booking.bookedBy : null,
        };
      });
      res.json(seatsWithStatus);
    } catch (error: any) {
      console.error("Get seats by IDs error:", { message: error.message, stack: error.stack, seatIds, date });
      res.status(500).json({ error: "Failed to fetch seat details" });
    }
  }
);

// Auth Routes
app.post(
  "/api/auth/register",
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    console.log("Register request:", { email });
    if (!name || !email || !password) {
      console.error("Register error: Missing required fields", { body: req.body });
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      console.error("Register error: Password too short", { email });
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.error("Register error: Email already registered", { email });
        res.status(400).json({ error: "Email already registered" });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        isAdmin: false,
      });
      await user.save();
      const otp = generateOtp();
      await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        type: "register",
      });
      await sendOtpEmail(email, otp, "register");
      res.status(201).json({ message: "Registration successful. OTP sent to email for verification" });
    } catch (error: any) {
      console.error("Register error:", { message: error.message, stack: error.stack, email });
      res.status(500).json({ error: "Failed to register" });
    }
  }
);

app.post(
  "/api/auth/verify-otp",
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;
    console.log("Verify OTP request:", { email });
    if (!email || !otp) {
      console.error("Verify OTP error: Missing required fields", { body: req.body });
      res.status(400).json({ error: "Email and OTP are required" });
      return;
    }
    try {
      const otpRecord = await Otp.findOne({ email, otp, type: "register" });
      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        console.error("Verify OTP error: Invalid or expired OTP", { email });
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
      }
      const user = await User.findOne({ email });
      if (!user) {
        console.error("Verify OTP error: User not found", { email });
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.isVerified = true;
      await user.save();
      await Otp.deleteOne({ email, otp });
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      });
      console.log("OTP verification successful: User verified and logged in", { userId: user._id, email });
      res.json({
        message: "Email verified successfully",
        user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      });
    } catch (error: any) {
      console.error("Verify OTP error:", { message: error.message, stack: error.stack, email });
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  }
);

app.post(
  "/api/auth/login",
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    console.log("Login request:", { email });
    if (!email || !password) {
      console.error("Login error: Missing email or password", { body: req.body });
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        console.error("Login error: Invalid credentials", { email });
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      if (!user.isVerified) {
        console.error("Login error: User not verified", { email });
        res.status(401).json({ error: "Please verify your email first" });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.error("Login error: Password mismatch", { email });
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      });
      console.log("Login successful: Cookie set", { userId: user._id, email, token: token.substring(0, 10) + "..." });
      res.json({
        message: "Login successful",
        user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      });
    } catch (error: any) {
      console.error("Login error:", { message: error.message, stack: error.stack, email });
      res.status(500).json({ error: "Failed to login" });
    }
  }
);

app.post(
  "/api/auth/forgot-password",
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    console.log("Forgot password request:", { email });
    if (!email) {
      console.error("Forgot password error: Invalid email", { body: req.body });
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.error("Forgot password error: User not found", { email });
        res.status(404).json({ error: "User not found" });
        return;
      }
      const otp = generateOtp();
      await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        type: "reset-password",
      });
      await sendOtpEmail(email, otp, "reset-password");
      res.json({ message: "OTP sent to email for password reset" });
    } catch (error: any) {
      console.error("Forgot password error:", { message: error.message, stack: error.stack, email });
      res.status(500).json({ error: "Failed to send OTP" });
    }
  }
);

app.post(
  "/api/auth/reset-password",
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    const { email, otp, newPassword } = req.body;
    console.log("Reset password request:", { email });
    if (!email || !otp || !newPassword) {
      console.error("Reset password error: Missing required fields", { body: req.body });
      res.status(400).json({ error: "Email, OTP, and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      console.error("Reset password error: Password too short", { email });
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    try {
      const otpRecord = await Otp.findOne({ email, otp, type: "reset-password" });
      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        console.error("Reset password error: Invalid or expired OTP", { email });
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
      }
      const user = await User.findOne({ email });
      if (!user) {
        console.error("Reset password error: User not found", { email });
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      await Otp.deleteOne({ email, otp });
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", { message: error.message, stack: error.stack, email });
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
);

app.post("/api/auth/logout", (req: Request, res: Response): void => {
  console.log("Logout request received");
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    console.log("Logout successful: Token cookie cleared");
    res.json({ message: "Logout successful" });
  } catch (error: any) {
    console.error("Logout error:", { message: error.message, stack: error.stack });
    res.status(500).json({ error: "Failed to logout" });
  }
});

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      res.json({ id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
    } catch (error: any) {
      console.error("Fetch user error:", { message: error.message, stack: error.stack });
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

app.get(
  "/api/auth/is-admin",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user.isAdmin) {
        console.log("IsAdmin check: User is not admin", { userId: user._id, email: user.email });
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }
      console.log("IsAdmin check: User is admin", { userId: user._id, email: user.email });
      res.json({ isAdmin: true });
    } catch (error: any) {
      console.error("IsAdmin error:", { message: error.message, stack: error.stack, userId: (req as any).user?._id });
      res.status(500).json({ error: "Failed to check admin status" });
    }
  }
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL!, { retryWrites: true, w: "majority" })
  .then(async () => {
    console.log("Connected to MongoDB");
    await initializeDefaultUser();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });