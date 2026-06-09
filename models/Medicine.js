const mongoose = require("mongoose")

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    dosage:{
        type: String,
        required: true,
        trim: true
    },
    times:{
        type: [String],
        required: true
    },
    withFood:{
        type: Boolean,
        default: true
    },
    isActive:{
        type: Boolean,
        default: true
    },
    parentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        required: true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true        
    }
}, {timestamps: true})

module.exports = mongoose.model("Medicine" , medicineSchema)