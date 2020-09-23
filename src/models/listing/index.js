"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listing = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const listingSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    host: { type: String, ref: 'User', required: true },
    type: { type: String, enum: ['APARTMENT', 'HOUSE'], required: true },
    image: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    admin: { type: String, required: true },
    city: { type: String, required: true },
    price: { type: Number, required: true },
    numOfGuests: { type: Number, required: true },
    bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
    bookingsIndex: {},
}, { strict: false, minimize: false });
exports.Listing = mongoose_1.default.model('Listing', listingSchema);
