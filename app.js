const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");

const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/staysphere_db";
const PORT = process.env.PORT || 3000;

main()
  .then(() => {
    console.log("Successfully connected to StaySphere MongoDB instance");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Utility wrapper to catch async errors and forward to central error handler
const asyncWrap = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Index Route - Fetch all property listings
app.get("/listings", asyncWrap(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

// New Route - Render creation form
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route - Fetch specific listing details by ID
app.get("/listings/:id", asyncWrap(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
}));

// Create Route - Save new listing document
app.post("/listings", asyncWrap(async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
}));

// Edit Route - Render edit form for a listing
app.get("/listings/:id/edit", asyncWrap(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

// Update Route - Update listing details by ID
app.put("/listings/:id", asyncWrap(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true });
  res.redirect(`/listings/${id}`);
}));

// Delete Route - Remove listing from database
app.delete("/listings/:id", asyncWrap(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
}));

// Central Error Handling Middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Internal Server Error" } = err;
  res.status(statusCode).send(message);
});

app.listen(PORT, () => {
  console.log(`StaySphere server running on port ${PORT}`);
});