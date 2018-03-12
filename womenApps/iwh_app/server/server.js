//server.js file is to communicate with external interface

var connection = require('./connection');
var express = require("express");
var app = express();
var cors = require ("cors");
var mongoose = require('mongoose');
var md5 = require('md5');
var jwt = require('jsonwebtoken');

app.use(cors());
var bodyParser = require ('body-parser');
app.use (bodyParser.json());

mongoose.connect(connection.connectionString,{
    keepAlive:true,
    reconnectTries:Number.MAX_VALUE
    //useMongoClient:true
});


/* model list */
var registermodel = require('./model/registerModel');
var ErrorLogInterface = require('./common/errorLogger');
var skillModel = require("./model/skillModel.js");


var watson = require('watson-developer-cloud');

//ambik kat service credentil -username password
//version:"v1",version_date: "2018-02-16" is fixed

var conversation = new watson.conversation({

    username: "c6732950-fd51-4c34-b158-458dbac56437", // replace with username from service key

    password: "KRojm0e6Xk07", // replace with password from service key

    version:"v1",

    version_date: "2018-02-16"

});
app.post('/watson/send', function (req, res) {

    console.log("going in");
    console.log(req.body);
    // Start conversation with empty message.

    conversation.message({ //untuk hntar soalan ke watson workspace
        workspace_id: "7889fa59-e90a-437e-badf-9d719eb2d79e", //ambik dekat https://watson-conversation.ng.bluemix.net/us-south/53198c45-bf14-4fe7-a9ee-ec2a8b718940/workspaces
        input: { text: req.body.message}

    }, function processResponse(err, response) {

        if (err) {

            res.send(err); // something went wrong

        }
        // Display the output from dialog, if any.

        if (response.output.text.length !== 0) {

            console.log(response.output.text[0]);

            res.json({ text : response.output.text[0]});
        }
    });

    // Process watson conversation response.

});

var register = mongoose.model('registerinfo', registermodel, 'UserDetails');
var skill = mongoose.model('skillInfo', skillModel, 'job');

// var errorlogger = ErrorLogInterface();

//common functions
// var LogError = function(error, moduleName)
// {
//     let errorlogger = ErrorLogInterface();
//     let errorModel = {
//         message: error.message,
//         modulename: moduleName,
//         errorStack: error.errorStack === undefined ?  JSON.stringify(error) : JSON.stringify(error.errorStack)
//     };
//     errorlogger.logError(errorModel);
// };

//verify token
function verifyToken (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token){
        jwt.verify(token,"supersecret", function (err, decoded) {
            if(err){
                res.status(403).json({
                    success:true,
                    message:"Wrong Token"
                });
            }
            else{
                req.decoded = decoded;
                next();
            }
        });
    }
    else{
        res.status(403).json({
            success:false,
            message:"No Token"
        });
    }
};

app.get("/test", function (req, res) {
    res.send("test");
});



//login
app.post('/api/login', function (req, res) {
    //console.log(req.body);
    var getemail = req.body.email;
    var getpass = req.body.password;
    var email = getemail.trim();
    var pass = getpass.trim();
    var md5pass = (md5(pass));

    try {
        if(pass && email === "") throw "Email is empty";
        if(email && pass === "") throw "Password is empty";
        register.findOne({
            UserEmailID:email}).exec(function (err, docs) {
            try {
                if (err) throw err;
                if (docs){
                    var username  = docs.UserName;
                    var keyPass = docs.Password;
                    if(keyPass == md5pass){
                        var token = jwt.sign({username }, "supersecret", { expiresIn: '24h' });
                        console.log(docs);
                        res.send({
                            success:true,
                            account:{
                                FirstName:docs.FirstName,
                                LastName : docs.LastName,
                                UserEmailID :docs.UserEmailID,
                                UserName:docs.UserName,
                                MobileNumber :docs.MobilePhone
                            },
                            message:"Login Success",
                            token:token});
                        console.log("login process success");
                    }
                    else if(keyPass != md5pass){
                        res.send({
                            success:false,
                            message:"Incorrect password"});
                    }
                }
                else if(!docs){
                    res.send({
                        success:false,
                        message:"User not found"});
                }
            } catch (err) {
                LogError(err, "userLogin");
                res.send({
                    success:false,
                    error:err});
            }
        });
    } catch (err) {
        LogError(err, "userLogin");
        res.send({
            success:false,
            error:err});
    }
});

//register
app.post('/api/register', function (req,res) {
    try {
        var userid = req.body.userid;
        var email = req.body.email;
        var fname = req.body.fname;
        var lname = req.body.lname;
        var password = req.body.password;
        var mobphone = req.body.mobilephone;
        var address = req.body.address;
        var registerDetails = new register
        (
            {
                UserName: userid,
                UserEmailID :email,
                FirstName: fname,
                LastName: lname,
                Password: (md5(password)),
                MobilePhone : mobphone,
                Address :address
            }
        );

        registerDetails.save(function (err, docs) {
            try {
                if (err) {
                    throw err.message;
                }
                else if (docs) {
                    res.send({
                        success:true,
                        message:"User successfully registered"
                    });
                    console.log(docs);
                }
            }
            catch(err){
                LogError(err, "register");
                res.send({
                    success:false,
                    error:err
                });
            }
        });
    }
    catch(err){
        LogError(err, "register");
        res.send({
            success:false,
            error:err
        });
    }
});

//search by skill

app.post('/api/searchByKeywords',function (req,res) {
    console.log(req.body);

    skill
        .find( { Skill: req.body.skill } ,

            function (err,dataFromDb) {
                if(err){
                    res.send(err);
                }

                if(dataFromDb){
                    res.send(dataFromDb);
                    /*  console.log(dataFromDb);*/
                }
                else{
                    res.send("failed")
                }
            }
        );

});

//
app.get('/getvalue', function(req, res){
    emergency.find({}).exec(function(err, docs){
        res.json({"Status":"Success",docs});
    });
});

//getEmergencyContact
app.get('/api/getEmergencyContact', verifyToken, function (req, res) {
    let user = req.decoded.username;
    try{
        register.findOne({
            UserName:user}).exec(function (err, docsUser) {
            let emergencycon = docsUser.EmergencyContact;
            try {
                if (emergencycon == "USERID"){
                    res.send({
                        success: false,
                        message: "Emergency contact not assign yet"
                    });
                } else{
                    res.send({
                        success: true,
                        emergencycontact:emergencycon
                    });
                }
            }catch (err){
                LogError(err, "getEmergencyContact");
                res.send({err});
            }
        });
    } catch (err) {
        LogError(err, "getEmergencyContact");
        res.send({err});
    }
});

//postEmergencyContact
app.post('/api/postEmergencyContact', verifyToken, function (req, res) {
    let user = req.decoded.username;
    let userid = req.body.userid;
    try {
        register.findOne({
            UserName:user}).exec(function (err, docsUser) {
            try {
                if(docsUser){
                    let userA = docsUser.UserName;
                    try {
                        // register.findOne({
                        //     UserName:userid}).exec(function (err, docsUserA) {
                        //     try {
                                // if (docsUserA){
                                    register.update({UserName: user},
                                        { $set: { EmergencyContact:userid}}).exec(function(err, docsLocation){
                                        res.send({
                                            success:true,
                                            message:"Emergency contact has been updated"
                                        })
                                    });
                                // }else if (!docsUserA){
                                //     res.send({
                                //         success:false,
                                //         message:"User not register yet in our system"
                                //     })
                                // }
                            // }catch (err){
                            //     LogError(err, "postEmergencyContact");
                            //     res.send({err});
                            // }
                        // })
                    }catch (err){
                        LogError(err, "postEmergencyContact");
                        res.send({err});
                    }
                }else if (!docsUser){
                    res.send({
                        success:false,
                        message:"User not found"
                    })
                }
            }catch (err){
                LogError(err, "postEmergencyContact");
                res.send({err});
            }
        });
    } catch (err) {
        LogError(err, "postEmergencyContact");
        res.send({err});
    }
});

//postLocation
app.post('/api/postLocation', verifyToken, function (req, res) {
    let user = req.decoded.username;
    let long = req.body.longitude;
    let lat  = req.body.latitude;
    try {
        register.findOne({
            UserName:user}).exec(function (err, docsUser) {
            try {
                if(docsUser){
                    let longA = docsUser.Longitude;
                    let latA  = docsUser.Latitude;
                    try {
                        if (longA && latA) {
                            try {
                                if (((longA == long) && (latA == lat))) {
                                    res.send({
                                        success:false,
                                        message:"User currently at same location"
                                    })
                                } else if (!((longA == long) && (latA == lat))){
                                    register.update({UserName: user},
                                        { $set: { Longitude:long, Latitude :lat}}).exec(function(err, docsLocation){
                                        res.send({
                                            success:true,
                                            message:"Location has been updated"
                                        })
                                    });
                                }
                            } catch (err){
                                LogError(err, "postLocation");
                                res.send({err});
                            }
                        }else{
                            res.send({
                                success:false,
                                message:"Default value for location is not set in registration"})
                        }
                    }catch (err){
                        LogError(err, "postLocation");
                        res.send({err});
                    }
                }else if (!docsUser){
                    res.send({
                        success:false,
                        message:"User not found"
                    })
                }
            }catch (err){
                LogError(err, "postLocation");
                res.send({err});
            }

        });
    } catch (err) {
        LogError(err, "postLocation");
        res.send({err});
    }
});

//getPanicDetails
app.get('/api/getPanic', verifyToken, function (req, res) {
    let user = req.decoded.username;
    try {
        if (user){
            emergency.find({
                $and:[{EmergencyContact:user}, {Status:"True"}]}).sort({CreatedOn:-1}).limit(3).exec(function (err, docsEmergency) {
                try {
                    if(docsEmergency){
                        try{
                            if (docsEmergency == ""){
                                res.send({
                                    success:false,
                                    message:"No information from emergency details"});
                            }else{
                                res.send({
                                    success:true,
                                    info:docsEmergency});
                            }
                        }catch (err){
                            LogError(err, "getPanic");
                            res.send({
                                success:false,
                                error:err});
                        }
                    }else if (!docsEmergency){
                        res.send({
                            success:false,
                            message:"No information from emergency details"});
                    }
                }catch (err){
                    LogError(err, "getPanic");
                    res.send({
                        success:false,
                        error:err});
                }
            });
        }else if (!user){
            res.send({
                success:false,
                message:"You need to login!"});
        }
    }catch (err){
        LogError(err, "getPanic");
        res.send({
            success:false,
            error:err});
    }
});

//postPanicDetails
app.post('/api/postPanic', verifyToken, function (req, res) {
    let panic = req.body.panic;
    let user = req.decoded.username;
    try {
        if (panic == 1){
            register.findOne({
                UserName:user}).exec(function (err, docsUser) {
                try{
                    if (docsUser){
                        let emergencyCon = docsUser.EmergencyContact;
                        let lon = docsUser.Longitude;
                        let lat = docsUser.Latitude;
                        var emergencyData = new emergency ({
                            UserName : user,
                            Status :"True",
                            EmergencyContact : emergencyCon,
                            Longitude : lon,
                            Latitude : lat});
                        if (emergencyCon == "USERID"){
                            res.send({
                                success:false,
                                message:"User not assign to any emergency contact"});
                        }
                        else {
                            emergencyData.save(function (err, docs) {
                                res.send({
                                    success:true,
                                    contact:emergencyCon,
                                    longitude:lon,
                                    latitude :lat});
                            });
                        }
                    }
                }catch (err){
                    LogError(err, "postPanic");
                    res.send({
                        success:false,
                        error:err});
                }
            });
        }
        if ((panic == 0) || (!panic) || (panic == "")){
            res.send({
                success:false,
                message:"Panic value not available"});
        }
    }catch (err){
        LogError(err, "postPanic");
        res.send({
            success:false,
            error:err});
    }
});

var port = 1503;
app.listen(port ,function () {
    console.log(connection.connectionString);
    console.log(" app listening to port " + port)
});
