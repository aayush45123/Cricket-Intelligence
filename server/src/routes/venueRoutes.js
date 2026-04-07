import express from "express";
import {
  getAllVenues,
  getVenueDetails,
} from "../controllers/venueController.js";

const router = express.Router();

// GET /api/venues          — all venues with summary
router.get("/", getAllVenues);

// GET /api/venues/:venue   — deep analytics for one venue
// :venue must be encoded (encodeURIComponent) since venue names contain spaces
router.get("/:venue", getVenueDetails);

export default router;
