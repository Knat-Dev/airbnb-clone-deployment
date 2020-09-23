"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const bookingSchema = new Schema({
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    tenant: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
});
exports.Booking = mongoose_1.default.model('Booking', bookingSchema);
