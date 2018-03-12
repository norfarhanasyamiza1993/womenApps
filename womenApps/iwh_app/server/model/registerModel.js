var mongoose = require('mongoose');
module.exports = mongoose.Schema({

    UserName :{type:String,unique:true},
    UserEmailID :{type:String,unique:true},
    FirstName :String,
    LastName : String,
    Password :String,
    MobilePhone :{ type:Number},
    Address : String,
    EmergencyContact : {type:String, default:"USERID"},
    Longitude : {type:String, default:"0.00"},
    Latitude : {type:String, default:"0.00"},
    CreatedOn :{ type:Date ,default:Date.now}
});