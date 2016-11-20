var express = require("express");
var bodyParser = require("body-parser");
var moment = require("moment");
var async = require("async");
var mongoose = require("mongoose");
var config = require("./config");
var dbURI = "mongodb://heroku_0n39t29l:d6kjm84q965cpqpar2h99344n8@ds159237.mlab.com:59237/heroku_0n39t29l";
var port = process.env.PORT || 3000;
var path = require("path");
var CronJob = require('cron').CronJob;
var CRONJOB = null;
var app = express();


//Creating connection with MongoDB
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on("connected", onDBConnect);

// If the connection throws an error
mongoose.connection.on("error", onDBError);

// When the connection is disconnected
mongoose.connection.on("disconnected", onDBClose);

//listings invoices
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));


//adding bodyParser
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

app.use(rootRouteHandler);


// Define main routes
app.post("/generate", generateInvoiceWithUrl);
app.post("/user/create/", createUser);
app.use("/test", testRoute);

// if nothing found show 404
app.use(notFoundErrorHandler);

// production error handler
app.use(errorHandler);

// initialize app
app.listen(port);

//TODO setup cron here
CRONJOB = new CronJob({
    cronTime: config.cronJob.pattern,
    onTick: onCronTick,
    start: config.cronJob.autoStart,
    timeZone: config.cronJob.timeZone
});

// If the Node process ends
process.on("SIGINT", onProcessEnd);


console.log("starting on port", port);

////////////////////////////////////

function onDBConnect(err) {
    if (err) throw err;
    console.log("Mongoose default connection open to " + dbURI);
}

function onDBError(err) {
    console.log("Mongoose default connection error: " + err);
}

function onDBClose() {
    console.log("Mongoose default connection disconnected");
}


function onCronTick() {
    console.log("******************************************\n");
    console.log("Starting cron...\n");
    var User = require("./models/user.model");
    var invoiceGenerator = require("./invoiceGenerator");

    //get all users
    User.find({}, function (err, users) {
        if (err) {
            throw  err;
        }

        //wrap generate invoice into anonymous function and call that in series
        var series = [];


        users.forEach(function (user, index) {
            series.push(function (cb) {
                console.log("Generating invoice for", user.name + "...");
                var hasNext = (index !== (users.length - 1));

                if (!isInvoiceGenerated(user.invoice_history)) {
                    invoiceGenerator(user)
                        .then(onInvoiceGenerate, onError);
                } else {
                    console.log("Already generated invoice for this user ...");
                    console.log("Skipping to next", (hasNext ? "\n\n" : ""));
                    cb();
                }

                function onInvoiceGenerate(filePath) {
                    console.log("Successfully created invoice...");
                    console.log("Invoice stored at", filePath + (hasNext ? "\n\n" : ""));
                    cb();
                }


                function onError(err) {
                    throw err;
                }
            })
        });


        async.series(series, function (err) {
            console.log("\n******************************************");
        });
    });
}


function generateInvoiceWithUrl(req, res, next) {
    // grab the user model
    var User = require("./models/user.model");
    var invoiceGenerator = require("./invoiceGenerator");

    //todo checks for email and passwords

    User.findOne({email: req.body.email, password: req.body.password}, onFind);

    function onFind(err, user) {
        if (err) throw err;

        if (!isInvoiceGenerated()) {

            invoiceGenerator(user._id, {
                perWeek: user.pay_info.per_week,
                userEmail: req.body.email,
                startDate: "10/17/2016", // TODO get last invoice date here
                endDate: moment().format(config.dateFormat), // TODO this will be the closest date possible
                paypalEmail: user.pay_info.paypal_email,
                holidays: 0
            }).then(onInvoiceGenerate, onError);

        } else {
            res.send({
                "type": "error",
                "message": "Already generated for the user..."
            })
        }

        function onInvoiceGenerate(filePath) {
            console.log("file path", filePath);
            res.send({
                "type": "success",
                "message": "Generated..."
            })
        }


        function onError(err) {
            throw err;
        }
    }

}


function isInvoiceGenerated(invoice_history) {
    return invoice_history.filter(function (obj) {
        return obj.month === moment().format("M");
    }).length;
}


function createUser(req, res, next) {
    // grab the user model
    var User = require("./models/user.model");

    // create a new user
    var newUser = User({
        name: "Adil Khan",
        email: "adil@brokergenius.com",
        password: "12345",
        pay_info: {
            per_week: "250",
            paypal_email: "adil@mohammadwali.com"
        },
        forwarder: {
            from: "'Adil Khan'  <adil@brokergenius.com>", // sender address
            to: "wali@brokergenius.com, adil@brokergenius.com", // list of receivers
            smtpConfig: {
                host: "smtp.gmail.com",
                port: 465,
                auth: {
                    user: "adil@brokergenius.com",
                    pass: "12345"
                }
            }
        }
    });

    // save the user
    newUser.save(function (err) {
        if (err) throw err;

        console.log("User created!");

        res.send({"type": "success", "message": "Done"});
    });
}


function rootRouteHandler(req, res, next) {
    if (req.url == "/") {
        res.status(401);
        res.send({message: "Access denied", type: "error"});
    } else {
        next();
    }
}

function notFoundErrorHandler(req, res, next) {
    res.status(404);
    res.send({message: "Not found", type: "error"});
}

function errorHandler(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        type: "error"
    });
}

function onProcessEnd() {

    //close the Mongoose connection
    mongoose.connection.close(function () {
        console.log("Mongoose default connection disconnected through app termination");
        process.exit(0);
    });
}


function testRoute(req, res, next) {
    var User = require("./models/user.model");
    // User.hasGeneratedThisMonthInvoice("wali@brokergenius.com", function (err, user) {
    //     if (err) {
    //         throw err;
    //     }
    //     res.send({
    //         x: user
    //     })
    // })
}