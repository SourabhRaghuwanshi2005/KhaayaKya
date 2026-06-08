const mongoose = require("mongoose")

const parentSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    phone:{
        type: String,
        required: true,
        trim: true
    },
    relationship:{
        type: String,
        enum:[ "Father", "Mother" , "Grandfather", "Grandmother", "Other"],
        required: true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cachedInsight: {
        type: String,
        default: null
        // stores last generated AI insight
    },
    insightGeneratedAt: {
        type: Date,
        default: null
        // when was insight last generated
    },
    cachedCorrelation: {
        type: String,
        default: null
    },
    correlationGeneratedAt: {
        type: Date,
        default: null
    }
}, {timestamps : true} );

module.exports = mongoose.model("Parent", parentSchema)