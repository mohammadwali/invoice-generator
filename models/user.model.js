var mongoose = require("mongoose");
var moment = require("moment");
var Schema = mongoose.Schema;
var ModelName = "User";
var UserSchema = new Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    pay_info: {
        per_week: {
            type: String,
            required: true
        },
        paypal_email: {
            type: String,
            required: true
        }
    },
    forwarder: {
        from: {
            type: String,
            required: true
        },
        to: {
            type: String,
            required: true
        },
        smtpConfig: {
            host: {
                type: String,
                required: true
            },
            port: {
                type: Number,
                required: true
            },
            secure: {
                type: Boolean,
                default: false
            },
            auth: {
                user: String,
                pass: String
            }
        }
    },
    invoice_history: {
        type: Array,
        default: []
    },
    created_at: Date,
    updated_at: Date
});

// on every save, add the date
UserSchema.pre("save", function (next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at)
        this.created_at = currentDate;

    next();
});


UserSchema.statics.addInvoice = function (email, invoiceObject, cb) {
    return this.model(ModelName)
        .update({email: email}, {$push: {invoice_history: invoiceObject}}, cb);
};

UserSchema.statics.setDeliveryStatus = function (email, fileName, statusObject, cb) {
    return this.model(ModelName).update({
        email: email,
        "invoice_history.file_name": fileName
    }, {
        $set: {
            'invoice_history.$.delivery_status': statusObject
        }
    }, cb);
};

UserSchema.statics.hasGeneratedThisMonthInvoice = function (userEmail, cb) {
    return this.model(ModelName).find({
        email: userEmail,
        "invoice_history.month": moment().format("M")
    }, function (err, result) {
        if (err) {
            throw err;
        }
        cb(err, result.length > 0);
    });
};


module.exports = mongoose.model(ModelName, UserSchema);