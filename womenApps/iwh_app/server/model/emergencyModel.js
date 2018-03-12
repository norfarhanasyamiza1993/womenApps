var mongoose = require('mongoose');
module.exports = mongoose.Schema({
    
    UserName :{type:String},
    Status :{type:String, default:"False"},
    EmergencyContact :{type:String},
    Longitude : String,
    Latitude : String, 
    CreatedOn :{ type:Date ,default:Date.now} 

});