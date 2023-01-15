const mongoose = require('mongoose');

const UserRole = mongoose.model(
     "userDetails",
    new mongoose.Schema({
        name: {
            type: String,
            required:true
        }
        ,
        status: {
            type:boolean
        },
        createdAt: {
            type: Date,
                    default: Date.now,
          
        },
         updatedAt: {
             type: Date,
                     default: Date.now,
          
        }

    })
)

module.exports={UserRole}