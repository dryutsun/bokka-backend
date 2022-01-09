const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    itemDescription: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    itemType: {
      type: String,
      enum: ["regular", "fragile", "hazardous"],
      default: "regular",
    },
    customerComment: {
      type: String,
    },
    imageuri: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);
// On second thought, I may not need this Schema.
// Rationale:
// - Items themselves do not need to be granular, a delivery is a delivery.
// - Perhaps I can add a model elsewhere, i.e. for different types of user history.
//
module.exports = orderItemSchema;
