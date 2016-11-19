var mongoose = require("mongoose");
var invoiceHistorySchema = require("../schemas/invoiceHistory");

module.exports = mongoose.model("InvoiceHistory", invoiceHistorySchema);