var extend = require("mongoose-schema-extend");
var UserSchema = require("./user");

module.exports = UserSchema.extend({
    file_name: String,
    full_path: String,
    total: Number,
    delivered: {type: Boolean, default: false},
    start_date: Date,
    end_date: Date
});