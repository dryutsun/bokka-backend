const mongoose = require("mongoose");
const orderItemSchema = require("./orderitem");

function getValue(value) {
  if (typeof value !== 'undefined') {
     return parseFloat(value.toString());
  }
  return value;
}





const orderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    porter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "none",
        "order-accepted",
        "delivery in progress",
        "order complete",
      ],
      default: "none",
    },
    orderItems: [orderItemSchema],
    orderOriginLong: {
      type: String
    },
    orderOriginLat: {
      type: String
    },
    orderDestLong: {
      type: String
    },
    orderDestLat: {
      type: String
    },
    order_accepted: {
      type: Date,
    },
    order_delivered: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
// https://masteringjs.io/tutorials/mongoose/aggregate
// Total Weight Field Should Aggregate the sum of all orderItems
//
