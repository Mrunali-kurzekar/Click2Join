const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require("./users.js")
const passportLocalMongoose=require("passport-local-mongoose");

const federatedCredentialSchema = new Schema({
    // userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name:String,
    provider: String,
    subject: String
}); 

federatedCredentialSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('FederatedCredential', federatedCredentialSchema);
