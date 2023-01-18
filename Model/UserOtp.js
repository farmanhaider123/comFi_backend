const mangoose = require("mongoose");
const { ACTIVE, INACTIVE ,VERIFIED} = require("../constants");
const otpSchema = new mangoose.Schema({
  uid:{type: String},
  otp: { type: String, required: true,unique: true },
  created_at: { type: Date, default: Date.now },
  expired_at: { type: Date },
  status: {
    type: String,
    enum: [ACTIVE, INACTIVE,VERIFIED],
    default:ACTIVE
  }

});
module.exports = mangoose.model("otp", otpSchema);