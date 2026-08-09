const express = require("express");

const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();



// CREATE ROOM
// POST /api/rooms


router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      floor,
      capacity,
      hourlyRate,
      amenities,
    } = req.body;

    if (
      !name ||
      !description ||
      !image ||
      !floor ||
      !capacity ||
      hourlyRate === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required room information.",
      });
    }

    const room = await Room.create({
      name,
      description,
      image,
      floor,
      capacity,
      hourlyRate,
      amenities: amenities || [],
      owner: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Room added successfully.",
      room,
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create room.",
    });
  }
});



// GET ALL ROOMS
// GET /api/rooms


router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      amenities,
      minRate,
      maxRate,
      floor,
    } = req.query;

    const filter = {};

    // Search by room name
    if (search.trim()) {
      filter.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // Amenities filter
    if (amenities) {
      const amenityList = amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (amenityList.length > 0) {
        filter.amenities = {
          $in: amenityList,
        };
      }
    }

    // Minimum hourly rate
    if (minRate !== undefined && minRate !== "") {
      filter.hourlyRate = {
        ...filter.hourlyRate,
        $gte: Number(minRate),
      };
    }

    // Maximum hourly rate
    if (maxRate !== undefined && maxRate !== "") {
      filter.hourlyRate = {
        ...filter.hourlyRate,
        $lte: Number(maxRate),
      };
    }

    // Floor filter
    if (floor && floor.trim()) {
      filter.floor = {
        $regex: floor.trim(),
        $options: "i",
      };
    }

    const rooms = await Room.find(filter)
      .populate("owner", "name email photoURL")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch rooms.",
    });
  }
});



// GET LATEST 6 ROOMS
// GET /api/rooms/latest


router.get("/latest", async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("owner", "name email photoURL")
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error("Get latest rooms error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch latest rooms.",
    });
  }
});


// GET MY LISTINGS
// GET /api/rooms/my-listings


router.get("/my-listings", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({
      owner: req.user.id,
    })
      .populate("owner", "name email photoURL")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get my listings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your listings.",
    });
  }
});



// GET SINGLE ROOM
// GET /api/rooms/:id


router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("owner", "name email photoURL");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Get room error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch room.",
    });
  }
});






// UPDATE ROOM
// PUT /api/rooms/:id


router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    // Owner check
    if (room.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own rooms.",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "image",
      "floor",
      "capacity",
      "hourlyRate",
      "amenities",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    });

    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room updated successfully.",
      room,
    });
  } catch (error) {
    console.error("Update room error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update room.",
    });
  }
});



// DELETE ROOM
// DELETE /api/rooms/:id


router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    // Owner check
    if (room.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own rooms.",
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    console.error("Delete room error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete room.",
    });
  }
});


module.exports = router;