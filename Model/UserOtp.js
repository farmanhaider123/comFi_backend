const mangoose = require("mongoose");
const otpSchema = new mangoose.Schema({
  uid:{type: String,unique: true},
  otp: { type: String, required: true,unique: true },
  created_at: { type: Date, default: Date.now },
  expired_at: { type: Date },

});
module.exports = mangoose.model("otp", otpSchema);