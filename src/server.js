const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

/* ==========================
   AUTH MIDDLEWARE
========================== */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user; // include role
    next();
  });
}

/* ==========================
   ADMIN MIDDLEWARE
========================== */
function isAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/* ==========================
   ROUTES
========================== */
app.get("/", (req, res) => {
  res.json({ message: "Travel Booking API Running 🚀" });
});

/* ==========================
   REGISTER USER
========================== */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "USER" },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* ==========================
   LOGIN USER
========================== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* ==========================
   PROFILE (Protected)
========================== */
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* ==========================
   TOUR PACKAGES
========================== */

// Create package (Admin only)
app.post("/packages", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const packageCreated = await prisma.tourPackage.create({
      data: { title, description, price: Number(price) },
    });
    res.status(201).json(packageCreated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Update package (Admin only)
app.put("/packages/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;
    const updatedPackage = await prisma.tourPackage.update({
      where: { id: Number(id) },
      data: { title, description, price: Number(price) },
    });
    res.json(updatedPackage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Delete package (Admin only)
app.delete("/packages/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tourPackage.delete({ where: { id: Number(id) } });
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get all packages (Public)
app.get("/packages", async (req, res) => {
  try {
    const packages = await prisma.tourPackage.findMany({ orderBy: { createdAt: "desc" } });
    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* ==========================
   BOOKINGS
========================== */

// Create booking (User only)
app.post("/bookings", authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        packageId: Number(packageId),
      },
      include: { tourPackage: true },
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// View my bookings (User)
app.get("/bookings", authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { tourPackage: true },
      orderBy: { bookingDate: "desc" },
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Cancel my booking (User)
app.delete("/bookings/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await prisma.booking.delete({ where: { id: Number(id) } });
    res.json({ message: "Booking canceled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Admin: View all bookings
app.get("/admin/bookings", authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { tourPackage: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { bookingDate: "desc" },
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* ==========================
   SERVER
========================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));