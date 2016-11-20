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
        var perWeek = data.perWeek;
        var perDay = (perWeek / 5);
        var holidays = data.holidays || 0;
        var weeks = getWeeksInRange(start, end);
        var remaining = parseInt(data.remaining) || 0;
        var bonus = parseInt(data.bonus) || 0;
        var subTotal = (parseInt(data.perWeek) * parseInt(weeks));
        var total = ( (subTotal + remaining + bonus) - (perDay * holidays) );

        //fill data
        addColumns([{title: "Per Week"}, {title: "Weeks"}, {title: "From"}, {title: "To"}]);
        addColumns([perWeek, weeks, start, end]);
        addEmptyRow();
        addColumns([{title: "Holidays after limit"}, holidays]);
        addColumns([{title: "Sub-Total"}, subTotal]);
        addColumns([{title: "Remaining"}, remaining]);
        addColumns([{title: "Bonus"}, bonus]);
        addColumns([{title: "Total excluding holidays"}, total]);
        addEmptyRow();
        addColumns([{title: "PayPal Email"}, data.paypalEmail]);

        // Save it
        workbook.save(onWorkBookSave);

        return deferred.promise;

        function onWorkBookSave(err) {
            if (err) {
                deferred.reject(err);
            }

            var fullPath = path.resolve(path.join(dirPath, fileName));


            User.addInvoice(data.userEmail, {
                file_name: fileName,
                full_path: fullPath,
                total: total,
                start_date: start,
                end_date: end
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
