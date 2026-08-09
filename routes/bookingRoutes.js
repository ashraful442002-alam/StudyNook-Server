const express = require("express");

const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE BOOKING
// POST /api/bookings


router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      roomId,
      bookingDate,
      startTime,
      endTime,
      specialNote,
    } = req.body;

    // Required fields
    if (
      !roomId ||
      !bookingDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all booking information.",
      });
    }

    // Find room
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    // Convert time
    const startHour = Number(startTime.split(":")[0]);
    const endHour = Number(endTime.split(":")[0]);

    // Validate time
    if (endHour <= startHour) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    // Minimum 1 hour
    if (endHour - startHour < 1) {
      return res.status(400).json({
        success: false,
        message: "Minimum booking duration is 1 hour.",
      });
    }

    // ==========================================
    // CHECK BOOKING CONFLICT
    // ==========================================

    const existingBooking = await Booking.findOne({
      room: roomId,
      bookingDate,
      status: "confirmed",

      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This room is already booked for the selected time.",
      });
    }

    // ==========================================
    // CALCULATE TOTAL COST
    // ==========================================

    const duration = endHour - startHour;

    const totalCost = duration * room.hourlyRate;

    // ==========================================
    // CREATE BOOKING
    // ==========================================

    const booking = await Booking.create({
      user: req.user.id,
      room: roomId,
      bookingDate,
      startTime,
      endTime,
      totalCost,
      specialNote: specialNote || "",
      status: "confirmed",
    });
    await User.findByIdAndUpdate(req.user.id, {
  $push: {
    bookings: booking._id,
  },
});

await Room.findByIdAndUpdate(roomId, {
  $inc: {
    bookingCount: 1,
  },
});

    // ==========================================
    // INCREMENT BOOKING COUNT
    // ==========================================

    await Room.findByIdAndUpdate(roomId, {
      $inc: {
        bookingCount: 1,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Room booked successfully!",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking.",
    });
  }
});


// ==========================================
// GET MY BOOKINGS
// GET /api/bookings/my-bookings
// ==========================================

router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    })
      .populate(
        "room",
        "name image floor capacity hourlyRate"
      )
      .sort({
        bookingDate: -1,
        startTime: -1,
      });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your bookings.",
    });
  }
});



// CANCEL BOOKING
// PATCH /api/bookings/:id/cancel


router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      // Booking not found
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      // Ownership check
      if (
        String(booking.user) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only cancel your own booking.",
        });
      }

      // Already cancelled
      if (booking.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "This booking is already cancelled.",
        });
      }

      // Check booking date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookingDate = new Date(
        `${booking.bookingDate}T00:00:00`
      );

      bookingDate.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        return res.status(400).json({
          success: false,
          message:
            "Past bookings cannot be cancelled.",
        });
      }

      // Update status
      booking.status = "cancelled";

      await booking.save();

      // Decrease room booking count
      await Room.findByIdAndUpdate(
        booking.room,
        {
          $inc: {
            bookingCount: -1,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Booking cancelled",
        booking,
      });
    } catch (error) {
      console.error("Cancel booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel booking.",
      });
    }
  }
);


// GET MY BOOKINGS
// GET /api/bookings/my-bookings

router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    })
      .populate(
        "room",
        "name image floor capacity hourlyRate"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your bookings.",
    });
  }
});

module.exports = router;