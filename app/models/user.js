const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    username: String,
    token: String,
    porter: Boolean, // Porter or Client
    loadcapacity: Number,
  },
  {
    timestamps: true,
    toObject: {
      // remove `hashedPassword` field when we call `.toObject`
      transform: (_doc, user) => {
        delete user.hashedPassword;
        return user;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
