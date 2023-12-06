const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    photo: { type: String, unique: true, required: true },
    label: { type: String, unique: true, required: true },
    price: { type: Number },
    totalQuantity: { type: Number },
    category: { type: String },
})

const productModel = mongoose.model("products", productSchema);
module.exports = productModel;