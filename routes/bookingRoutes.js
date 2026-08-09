const express = require("express");

const Booking = require("../models/Booking");
const Room = require("../models/Room");
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

    // Required fields check
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

    // Convert time to numbers
    const startHour = Number(startTime.split(":")[0]);
    const endHour = Number(endTime.split(":")[0]);

    // Validate time
    if (endHour <= startHour) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    // Minimum 1 hour booking
    if (endHour - startHour < 1) {
      return res.status(400).json({
        success: false,
        message: "Minimum booking duration is 1 hour.",
      });
    }

   
    // CHECK BOOKING CONFLICT
    

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

   
    // CALCULATE TOTAL COST
  

    const duration = endHour - startHour;

    const totalCost = duration * room.hourlyRate;


    // CREATE BOOKING


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

 
    // INCREMENT ROOM BOOKING COUNT


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


module.exports = router;