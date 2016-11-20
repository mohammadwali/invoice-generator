module.exports = {
    dateFormat: "MM/DD/YYYY",
    db: {
        host: "localhost",
        name: "invoiceGenerator"
    },
    invoices: {
        root: "./invoices/",
        fileName: "invoice.xlsx",
        prefixDateFormat: "DD_MM_YYYY"
    },
    cronJob: {
//        pattern: "0 0 * * *", // Run once a day at midnight
        pattern: "* * * * *",
        autoStart: true,
        timeZone: "Asia/Kolkata"
    }

};