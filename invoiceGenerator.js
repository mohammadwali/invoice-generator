var config = require("./config");
var Q = require("q");
var path = require("path");
var moment = require("moment");
var User = require("./models/user.model"); //initialize model
var fs = require("fs");

module.exports = invoiceGenerator;


function invoiceGenerator(userId, data) {
    var excelbuilder = require("msexcel-builder");
    var deferred = Q.defer();
    var start = data.startDate;
    var end = data.endDate;
    var prefix = moment(end, config.dateFormat).format(config.invoices.prefixDateFormat);
    var dirPath = getDirPath(userId);
    var fileName = prefix + "-" + config.invoices.fileName;  // TODO add date and time as suffix
    var workbook = excelbuilder.createWorkbook(dirPath, fileName); // Create a new workbook file in current working-path
    var sheet1 = workbook.createSheet("sheet1", 4, 10); // Create a new worksheet with 4 columns and 10 rows
    var currentRowNumber = 1;


    //initialize
    return init();


    /////////////////////////
    function init() {
        var invoiceData = {};
        invoiceData.start = start;
        invoiceData.end = end;
        invoiceData.per_week = data.perWeek;
        invoiceData.per_day = (invoiceData.per_week / 5);
        invoiceData.holidays = data.holidays || 0;
        invoiceData.weeks = getWeeksInRange(start, end);
        invoiceData.remaining = parseInt(data.remaining) || 0;
        invoiceData.bonus = parseInt(data.bonus) || 0;
        invoiceData.sub_total = (parseInt(data.perWeek) * parseInt(invoiceData.weeks));
        invoiceData.total = ( (invoiceData.sub_total + remaining + bonus) - (invoiceData.per_day * holidays) );

        //fill data
        fillData(invoiceData);

        // Save it
        workbook.save(onWorkBookSave);

        return deferred.promise;


        /////////////////////////

        function fillData(data) {
            addColumns([{title: "Per Week"}, {title: "Weeks"}, {title: "From"}, {title: "To"}]);
            addColumns([data.per_week, data.weeks, data.start, data.end]);
            addEmptyRow();
            addColumns([{title: "Holidays after limit"}, data.holidays]);
            addColumns([{title: "Sub-Total"}, data.sub_total]);
            addColumns([{title: "Remaining"}, data.remaining]);
            addColumns([{title: "Bonus"}, data.bonus]);
            addColumns([{title: "Total excluding holidays"}, data.total]);
            addEmptyRow();
            addColumns([{title: "PayPal Email"}, data.paypalEmail]);
        }

        function onWorkBookSave(err) {
            if (err) {
                deferred.reject(err);
            }

            var fullPath = path.resolve(path.join(dirPath, fileName));

            User.addInvoice(data.userEmail, {
                file_name: fileName,
                full_path: fullPath,
                invoice_data: invoiceData
            }, function (err) {

                if (err) {
                    deferred.reject(err);
                }

                deferred.resolve(fullPath);
            });
        }
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

    function getWeeksInRange(from, to) {
        var today = moment(to, config.dateFormat);
        var lastDay = moment(from, config.dateFormat);
        return round(today.diff(lastDay, "week", true), 0);
    }


    function getDirPath(userId) {
        createDir(config.invoices.root);
        return createDir(path.join(config.invoices.root, userId.toString()));
    }

    function createDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        return dir;
    }


}

function round(num, dec) {
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}
