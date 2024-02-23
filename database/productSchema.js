const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    product_name:{
        type:String,
        required:true,
        trim:true
    },
    pack_size:{
        type:String,
        required:true,
        trim:true
    },
    price:{
        type:String,
        required:true,
        trim:true
    },
    product_image:{
        required:true,
        type:String
    },
    category:{
        required:true,
        type:String
    },
    Status:{
        required:true,
        type:String
    },
    dateCreated:Date,
    dateUpdated:Date
})
//model
module.exports = mongoose.model("products", productSchema);