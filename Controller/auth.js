const express = require('express')
const app = express();
const bcrypt = require("bcrypt");
const { User, validateUser } = require("./../Model/users");
const otpSchema = require("../Model/UserOtp");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const exphbs = require("express-handlebars");
const nodemailer = require("nodemailer");
var hbs = require("nodemailer-express-handlebars");
const { date } = require('joi');

//node mailer
let transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: "farmanhaider240@gmail.com",
    pass: "srjxfghezmkienjf",
  },
});
transporter.use(
  "compile",
  hbs({
    viewEngine: "nodemailer-express-handlebars",
    viewPath: "emailTemplates/",
  })
);
//User resgistration
async function signUp(req, res) {
  let data = req.body;
  console.log(data)
  let IsExistuser = await User.findOne({ email: req.body.email })
  //user Alreadyexist 
  if (IsExistuser) {
    return res.send({ "err": "1", "msg": "Try any other email, this email is already registered!" })
  }

  let isExistuserPhone = await User.findOne({ contactNumber: req.body.contactNumber })
  if (isExistuserPhone) {
    return res.send({ "err": "1", "msg": "Number Already exists" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const user = new User({
      ...req.body,
      password: await bcrypt.hash(req.body.password, salt),

    });
    console.log(req.body.password)
    //Otp function

    const otp = await function generateOTP(limit) {

      // Declare a digits variable 
      // which stores all digits
      var digits = '0123456789';
      let OTP = '';
      for (let i = 0; i < limit; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
      return OTP
    }

    let sendotp = otp(5);
    console.log("You 5 digit otp is :" + sendotp)
    let mailOptions = {
      from: "farmanhaider240@gmail.com",
      to: req.body.email,
      subject: "Activatio Mail",
      template: "mail",
      context: {
        uname: req.body.firstName,
        otp: sendotp,
      },
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Mail send : " + req.body.email);
      }
    });
    const response = await
      user.save();
    let userid = response._id;
    email = response.email;
    const userotp = new otpSchema({
      uid: userid,
      otp: sendotp,
      expired_at: Date.now() + 2 * 60 * 1000
    })

    console.log(userotp)
    await userotp.save();
    res.send({ "err": 0, "msg": "User Registered", 'uid': userid });

  } catch (ex) {
    res.status(400).send(ex.message);
  }
}
//user otp verification~
async function postotp(req, res) {
  let { otp, id } = req.body;
  console.log(id)
  console.log(otp)
  let userotp = await otpSchema.findOne({ uid: id ,status:'active'})
  console.log(userotp.expired_at)
  console.log(userotp.created_at)
  let ex = Date.now()
  if (ex > userotp.expired_at) {
    res.send({ "err": 1, "msg": "Otp is expired","active":true })
  }
  else {
    if (otp == userotp.otp) {
      let user = await User.findOneAndUpdate({ _id: id }, { $set: { status: true } })
      await otpSchema.deleteMany({ uid: user._id, status: "inactive" })
      await otpSchema.findOneAndUpdate({ uid: user.id,status:'active' }, { $set: { status: 'verified'} } )
      res.send({ "err": 0, "msg": "user verified sucessfully" })
    }
    else {
      res.send({ "err": 1, "msg": "Invalid otp" })
    }
  }

}

//resend otp
async function resend(req, res) {
  // Declare a digits variable 
  const otp = await function generateOTP(limit) {

    // which stores all digits
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < limit; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP
  }

  let sendotp = otp(5);
  console.log(req.body.email)
  let user = await User.findOne({email: req.body.email})
  //  let user1=await otpSchema.findOneAndDelete({ uid: user._id })
  
  var userid = user._id;
  
  let count = await otpSchema.aggregate([
    {
      '$match': {
        'uid': '' + userid,
        'status': {
          '$in': [
            'active', 'inactive'
          ]
        }
      }
    }, {
      '$count': 'uid'
    }
  ])
  
  console.log(count[0].uid)
  let count_otp = count[0].uid
  if (count_otp <= 3) {
    await otpSchema.updateMany({ uid: user._id, status: "active" }, { $set: { status: "inactive" } })
    const userotp = new otpSchema({
      uid: userid,
      otp: sendotp,
      expired_at: Date.now() + 2 * 60 * 1000
    })
  
    let mailOptions = {
      from: "farmanhaider240@gmail.com",
      to: user.email,
      subject: "Activatio Mail",
      template: "mail",
      context: {
        uname: user.firstName,
        otp: sendotp,
      },
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Mail send : " + req.body.email);
      }
    });
    await userotp.save();
    res.send({ "err": 0, "msg": "otp sent on email", 'uid': userid });
  }
  else {
    console.log("3 attempt expire")
    const admin = await User.findOne({ role: "admin" })

    let mailOptions = {
      from: "farmanhaider240@gmail.com",
      to: admin.email,
      subject: "Blocked user Mail",
      template: "otpmail",
      context: {
        adminname: admin.firstName,
        email:user.email,
      },
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Mail send : " + admin.email);
      }
    });
    res.send({ "err": 1, "msg": "'You've exceeded the maximum number of attempts Try after some time'" })
  }
}
 
//user Sign in
async function signIn(req,res) {
const { email, password } = req.body;
 
  let user = await User.findOne({ email });

  if (!user) {
    return res.send({"err":1,"msg":"This email has not been registered!"});
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.send({"err":1,"msg":"Invalid Credentials!"});
  }

  const token = jwt.sign(
    {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      isAdmin: user.role === "admin",
    },
    "1@3456Qw-"
  );
 
  res.send({
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    isAuthenticated: true,
    token:token,
    err:0
  });
}
 //password rest mail
 async function Resetmail(req, res) {
    let email = req.body.email;
  let mailOptions = {
      from: "farmanhaider240@gmail.com",
      to: email,
      subject: "Reset Password Mail",
      template: "resetmail",
      context: {
        email: req.body.email,
      },
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ "msg" :"Reset password Link is sent to your registred mail id "});
      }
    });
  }
 //change password   
async function ChangePass(req, res) {
  let { email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashpassword = await bcrypt.hash(password, salt)
  let userUpdate = await User.findOneAndUpdate({ email: email }, { $set: { password: hashpassword } })
  
    res.send({ "err": 0, "msg": "user password is changed sucessfully" });
  
}

module.exports = { signUp, signIn, postotp,resend ,Resetmail,ChangePass};