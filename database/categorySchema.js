const mongoose = require('mongoose')
const categorySchema = new mongoose.Schema({
    category:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    Status:{
        type:String,
        required:true
    },
    dateCreated:Date,
    dateUpdated:Date
})
//model
module.exports = mongoose.model("categories", categorySchema);