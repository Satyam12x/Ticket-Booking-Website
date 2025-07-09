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
  "ADMIN_PASSWORD",
  "USER_EMAIL",
  "USER_PASSWORD",
  "USER_NAME",
];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length) {
  console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// Interfaces
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

interface IBooking {
  date: string;
  bookedBy: {
    name: string;
    email: string;
    phone: string;
  };
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
  createdAt: Date;
}

interface IOtp {
  email: string;
  otp: string;
  expiresAt: Date;
  type: "reset-password";
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
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, trim: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, enum: ["reset-password"], required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Models
const Event = mongoose.model<IEvent>("Event", eventSchema);
const Seat = mongoose.model<ISeat>("Seat", seatSchema);
const User = mongoose.model<IUser>("User", userSchema);
const Otp = mongoose.model<IOtp>("Otp", otpSchema);

// Validation Middleware
const validateDateFormat = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === "POST") {
    const { date, bookingDate } = req.body || {};
    const dateToValidate = date || bookingDate;
    if (dateToValidate && !/^\d{4}-\d{2}-\d{2}$/.test(dateToValidate)) {
      console.error("ValidateDateFormat error: Invalid date format", {
        dateToValidate,
      });
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

const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email } = req.body || {};
  if (
    email &&
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  ) {
    console.error("ValidateEmail error: Invalid email format", { email });
    res.status(400).json({ error: "Invalid email format" });
    return;
  }
  next();
};

const validatePhone = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { phone } = req.body || {};
  if (phone && !/^(\+?\d{1,3}[-.\s]?)?\d{10}$/.test(phone)) {
    console.error("ValidatePhone error: Invalid phone number format", {
      phone,
    });
    res
      .status(400)
      .json({
        error:
          "Invalid phone number format. Use 10 digits or +[country code][10 digits]",
      });
    return;
  }
  next();
};

// Auth Middleware
const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("AuthenticateToken: Request details", {
    url: req.url,
    method: req.method,
    cookies: req.cookies,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization
        ? "Bearer <redacted>"
        : undefined,
    },
  });
  if (!token) {
    console.error("Authentication error: No token provided", {
      url: req.url,
      method: req.method,
    });
    res
      .status(401)
      .json({ error: "Authentication required: No token provided" });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.error("Authentication error: User not found", {
        userId: decoded.userId,
      });
      res.status(401).json({ error: "Authentication failed: User not found" });
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

// Email Utility
const sendOtpEmail = async (
  email: string,
  otp: string,
  type: "reset-password"
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const subject = "Reset Your Password";
  const html = `
    <p>Dear User,</p>
    <p>Your OTP for password reset is <strong>${otp}</strong>.</p>
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
    console.error("Send OTP email error:", {
      message: error.message,
      stack: error.stack,
      email,
      type,
    });
    throw error;
  }
};

const generateOtp = (): string => randomBytes(3).toString("hex").toUpperCase();

// Auth Routes
app.post(
  "/api/auth/login",
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    console.log("Login request:", { email });
    if (!email || !password) {
      console.error("Login error: Missing email or password", {
        body: req.body,
      });
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
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.error("Login error: Password mismatch", { email });
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      });
      console.log("Login successful: Cookie set", {
        userId: user._id,
        email,
        token: token.substring(0, 10) + "...",
      });
      res.json({
        message: "Login successful",
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (error: any) {
      console.error("Login error:", {
        message: error.message,
        stack: error.stack,
        email,
      });
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
    if (!email || email !== process.env.USER_EMAIL) {
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
      console.error("Forgot password error:", {
        message: error.message,
        stack: error.stack,
        email,
      });
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
      console.error("Reset password error: Missing required fields", {
        body: req.body,
      });
      res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
      return;
    }
    if (email !== process.env.USER_EMAIL) {
      console.error("Reset password error: Invalid email", { email });
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    if (newPassword.length < 6) {
      console.error("Reset password error: Password too short", { email });
      res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
      return;
    }
    try {
      const otpRecord = await Otp.findOne({
        email,
        otp,
        type: "reset-password",
      });
      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        console.error("Reset password error: Invalid or expired OTP", {
          email,
        });
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
      console.error("Reset password error:", {
        message: error.message,
        stack: error.stack,
        email,
      });
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
    console.error("Logout error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to logout" });
  }
});

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      res.json({ id: user._id, name: user.name, email: user.email });
    } catch (error: any) {
      console.error("Fetch user error:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

// Booking Confirmation Email
const sendBookingConfirmation = async (
  email: string,
  seatId: string,
  name: string,
  bookingDate: string
): Promise<void> => {
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
    console.log(
      `Booking confirmation email sent to ${email} for seat ${seatId}`
    );
  } catch (error: any) {
    console.error("Email sending error:", {
      message: error.message,
      stack: error.stack,
      seatId,
      email,
      bookingDate,
    });
    throw new Error(
      `Failed to send booking confirmation email: ${error.message}`
    );
  }
};

// Seat Initialization
const initializeSeats = async (
  eventId: string,
  totalSeats: number,
  session?: ClientSession
): Promise<void> => {
  try {
    const existingSeats = await Seat.countDocuments({ eventId }, { session });
    if (existingSeats >= totalSeats) {
      console.log(
        `Seats already initialized for event ${eventId}, found ${existingSeats} seats.`
      );
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
    console.log(
      `Seats initialized successfully for event ${eventId}: ${seats.length} seats`
    );
  } catch (error: any) {
    console.error("Failed to initialize seats:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to initialize seats: ${error.message}`);
  }
};

// Initialize default user
const initializeDefaultUser = async (): Promise<void> => {
  try {
    const email = process.env.USER_EMAIL!;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(process.env.USER_PASSWORD!, 10);
      const user = new User({
        name: process.env.USER_NAME!,
        email,
        password: hashedPassword,
        isVerified: true,
      });
      await user.save();
      console.log(`Default user created: ${email}`);
    } else {
      console.log(`Default user already exists: ${email}`);
    }
  } catch (error: any) {
    console.error("Failed to initialize default user:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Routes
app.post(
  "/api/seats/initialize",
  async (req: Request, res: Response): Promise<void> => {
    const { eventId, totalSeats } = req.body;
    console.log("Initialize seats request:", { eventId, totalSeats });
    if (
      !isValidObjectId(eventId) ||
      !Number.isInteger(totalSeats) ||
      totalSeats < 1
    ) {
      console.error("Initialize seats error: Invalid input", {
        eventId,
        totalSeats,
      });
      res
        .status(400)
        .json({
          error: "Valid eventId and positive integer totalSeats are required",
        });
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
      console.error("Initialize seats error:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "Failed to initialize seats" });
    }
  }
);

app.get("/api/events", async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const events = await Event.find({
      date: { $gte: today, $ne: today }, // Exclude events for today
    })
      .sort({ date: 1 })
      .select("-password");
    res.json(events);
  } catch (error: any) {
    console.error("Get events error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get(
  "/api/events/recent",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const today = new Date().toISOString().split("T")[0];
      const events = await Event.find({
        createdAt: { $gte: sevenDaysAgo },
        date: { $gte: today, $ne: today }, // Exclude events for today
      })
        .sort({ createdAt: -1 })
        .select("-password");
      res.json(events);
    } catch (error: any) {
      console.error("Get recent events error:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "Failed to fetch recent events" });
    }
  }
);

app.post(
  "/api/events",
  validateDateFormat,
  async (req: Request, res: Response): Promise<void> => {
    const { name, date, time, description, venue, password, totalSeats } =
      req.body;
    console.log("Create event request:", {
      name,
      date,
      time,
      venue,
      totalSeats,
    });
    if (
      !name ||
      !date ||
      !time ||
      !description ||
      !venue ||
      !password ||
      !totalSeats
    ) {
      console.error("Create event error: Missing required fields", {
        body: req.body,
      });
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
        console.error("Create event error: Event already exists for date", {
          date,
        });
        res
          .status(400)
          .json({ error: "An event already exists for this date" });
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      if (date === today) {
        console.error("Create event error: Cannot create event for today", {
          date,
        });
        res
          .status(400)
          .json({ error: "Cannot create event for the current date" });
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
        });
        await event.save({ session });
        await initializeSeats(event._id.toString(), totalSeats, session);
        await session.commitTransaction();
        res
          .status(201)
          .json({
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
      console.error("Create event error:", {
        message: error.message,
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ error: "Failed to create event" });
    }
  }
);

app.delete(
  "/api/events/:id",
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
      console.error("Delete event error: Password required", {
        body: req.body,
      });
      res.status(400).json({ error: "Password is required" });
      return;
    }
    try {
      const event = await Event.findById(id);
      if (!event) {
        console.error("Delete event error: Event not found", { id });
        res.status(404).json({ error: "Event not found" });
        return;
      }
      if (password !== event.password) {
        console.error("Delete event error: Invalid password");
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      const seatsWithBookings = await Seat.find({
        eventId: id,
        bookings: { $ne: [] },
      });
      if (seatsWithBookings.length > 0) {
        console.error("Delete event error: Cannot delete event with bookings", {
          id,
        });
        res
          .status(400)
          .json({ error: "Cannot delete event with existing bookings" });
        return;
      }
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await Seat.deleteMany({ eventId: id }, { session });
        await Event.findByIdAndDelete(id, { session });
        await session.commitTransaction();
        res.json({
          message: "Event and associated seats deleted successfully",
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error: any) {
      console.error("Delete event error:", {
        message: error.message,
        stack: error.stack,
        id,
      });
      res.status(500).json({ error: "Failed to delete event" });
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
        console.error("Get seats error: Cannot fetch seats for today", {
          date,
        });
        res
          .status(400)
          .json({ error: "Cannot book seats for the current date" });
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
      console.error("Get seats error:", {
        message: error.message,
        stack: error.stack,
        date,
      });
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
    const { seatId, name, email, phone, bookingDate } = req.body;
    const user = (req as any).user;
    console.log("Booking request:", {
      seatId,
      name,
      email,
      phone,
      bookingDate,
      userId: user._id,
    });

    if (!seatId || !name || !email || !phone || !bookingDate) {
      console.error("Booking error: Missing required fields", {
        body: req.body,
      });
      res
        .status(400)
        .json({
          error: "seatId, name, email, phone, and bookingDate are required",
        });
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
      const event = await Event.findOne({ date: bookingDate }).session(session);
      if (!event) {
        console.error("Booking error: No event found", { bookingDate });
        throw new Error("No event scheduled for this date");
      }
      const seat = await Seat.findOne({
        seatId,
        eventId: event._id.toString(),
      }).session(session);
      if (!seat) {
        console.error("Booking error: Seat not found", {
          seatId,
          eventId: event._id,
        });
        throw new Error("Seat not found for this event");
      }
      const existingBooking = seat.bookings.find((b) => b.date === bookingDate);
      if (existingBooking) {
        console.error("Booking error: Seat already booked", {
          seatId,
          bookingDate,
        });
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
      console.error("Book seat error:", {
        message: error.message,
        stack: error.stack,
        requestBody: req.body,
        userId: user._id,
      });
      res
        .status(
          error.message.includes("already booked") ||
            error.message.includes("not found")
            ? 400
            : 500
        )
        .json({
          error: error.message || "Failed to book seat",
        });
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
        res
          .status(400)
          .json({ error: "Cannot access event scheduled for today" });
        return;
      }
      res.json(event);
    } catch (error: any) {
      console.error("Get event by ID error:", {
        message: error.message,
        stack: error.stack,
        id,
      });
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
      console.error("Get seats by IDs error: Missing seatIds or date", {
        query: req.query,
      });
      res.status(400).json({ error: "seatIds and date are required" });
      return;
    }
    let seatIdArray: string[];
    if (Array.isArray(seatIds)) {
      if (!seatIds.every((id) => typeof id === "string")) {
        console.error("Get seats by IDs error: Invalid seatIds format", {
          seatIds,
        });
        res.status(400).json({ error: "All seatIds must be strings" });
        return;
      }
      seatIdArray = seatIds as string[];
    } else if (typeof seatIds === "string") {
      seatIdArray = seatIds.split(",");
    } else {
      console.error("Get seats by IDs error: Invalid seatIds format", {
        seatIds,
      });
      res.status(400).json({ error: "Invalid seatIds format" });
      return;
    }
    if (!seatIdArray.every((id) => /^[A-Z][1-9][0-9]?$/.test(id))) {
      console.error("Get seats by IDs error: Invalid seatId format", {
        seatIds: seatIdArray,
      });
      res
        .status(400)
        .json({ error: `Invalid seatId format in: ${seatIdArray.join(", ")}` });
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      if (date === today) {
        console.error("Get seats by IDs error: Cannot fetch seats for today", {
          date,
        });
        res
          .status(400)
          .json({ error: "Cannot fetch seats for the current date" });
        return;
      }
      const event = await Event.findOne({ date: date.toString() });
      if (!event) {
        console.error("Get seats by IDs error: No event found", { date });
        res.status(400).json({ error: `No event found for date: ${date}` });
        return;
      }
      const seats = await Seat.find({
        seatId: { $in: seatIdArray },
        eventId: event._id.toString(),
      });
      if (!seats.length || seats.length !== seatIdArray.length) {
        console.error("Get seats by IDs error: Not all seats found", {
          seatIds: seatIdArray,
          date,
        });
        res
          .status(404)
          .json({
            error: `Not all seats found for seatIds: ${seatIdArray.join(
              ", "
            )} and date: ${date}`,
          });
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
      console.error("Get seats by IDs error:", {
        message: error.message,
        stack: error.stack,
        seatIds,
        date,
      });
      res.status(500).json({ error: "Failed to fetch seat details" });
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
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
