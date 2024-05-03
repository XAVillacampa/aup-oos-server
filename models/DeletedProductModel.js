const mongoose = require('mongoose');

const deletedProductSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    deletionDate: { type: Date, default: Date.now },
    reason: { type: String, required: true }
});

const DeletedProduct = mongoose.model('DeletedProduct', deletedProductSchema);
module.exports = DeletedProduct;
