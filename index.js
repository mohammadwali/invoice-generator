var express = require("express");
var bodyParser = require("body-parser");
var app = express();


//adding bodyParser
app.use(bodyParser());
app.use(bodyParser.json());


app.use(rootRouteHandler);


// if nothing found show 404
app.use(notFoundErrorHandler);

// production error handler
app.use(errorHandler);

// initialize app
app.listen(3000);

// uncaught error handler
process.on("uncaughtException", logError);




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

function logError(err) {
    console.log("Caught exception: ", err);
}