var mongoose = require("mongoose");
var Schema = mongoose.Schema;

module.exports = new Schema({
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
    created_at: Date,
    updated_at: Date
}, {
    collection: 'users', // everything will get saved in the same collection
    discriminatorKey: '_type'
});