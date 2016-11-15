var express = require("express");
var bodyParser = require("body-parser");
var excelbuilder = require("msexcel-builder");
var app = express();


//adding bodyParser
app.use(bodyParser());
app.use(bodyParser.json());


app.use(rootRouteHandler);

// Define main routes
app.get("/generate", generateInvoice);

// if nothing found show 404
app.use(notFoundErrorHandler);

// production error handler
app.use(errorHandler);

// initialize app
app.listen(3000);

// uncaught error handler
process.on("uncaughtException", logError);


function generateInvoice(req, res, next) {
    var dirPath = "./invoices/";
    var fileName = "invoice.xlsx";  // TODO add date and time as suffix
    var workbook = excelbuilder.createWorkbook(dirPath, fileName); // Create a new workbook file in current working-path
    var sheet1 = workbook.createSheet("sheet1", 4, 10); // Create a new worksheet with 4 columns and 10 rows
    var currentRowNumber = 1;

    //filling the sheet
    fillData();

    // Save it
    workbook.save(onWorkBookSave);


    /////////////////////////
    function fillData() {
        addColumns([{title: "Per Week"}, {title: "Weeks"}, {title: "From"}, {title: "To"}]);
        addColumns(["625", "5", "9/15/2016", "10/17/2016"]);
        addEmptyRow();
        addColumns([{title: "Holidays after limit"}, "0"]);
        addColumns([{title: "Sub-Total"}, "3125"]);
        addColumns([{title: "Remaining"}, "0"]);
        addColumns([{title: "Bonus"}, "0"]);
        addColumns([{title: "Total excluding holidays"}, "3125"]);
        addEmptyRow();
        addColumns([{title: "PayPal Email"}, "me@mohammadwali.com"]);
    }

    function onWorkBookSave(err) {
        if (err) {
            res.send({
                message: err,
                type: "error"
            });
            throw err;
        }
        res.send({
            message: "congratulations, your workbook created",
            type: "success"
        });
    }

    function addColumns(items) {
        var maxColumnWidth = 22;

        // Fill
        items.forEach(function (text, index) {
            var column = (index + 1);
            var isTitle = (text.constructor === Object);
            var title = isTitle ? text.title : text;
            var alignTo = isTitle ? "center" : "left";
            var fontOptions = {name: "arial"};

            if (isTitle) {
                fontOptions.bold = "true";
            }

            sheet1.set(column, currentRowNumber, title);
            sheet1.font(column, currentRowNumber, fontOptions);
            sheet1.wrap(column, currentRowNumber, "true");
            sheet1.valign(column, currentRowNumber, "top");
//            sheet1.align(column, currentRowNumber, alignTo);
            sheet1.width(column, maxColumnWidth);
        });

        // update row number
        currentRowNumber++;
    }

    function addEmptyRow() {
        addColumns([]);
    }
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

function logError(err) {
    console.log("Caught exception: ", err);
}