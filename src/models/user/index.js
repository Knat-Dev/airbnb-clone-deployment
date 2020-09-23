"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.userSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
exports.userSchema = new Schema({
    _id: { type: String, required: true },
    token: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    contact: { type: String, required: true },
    walletId: { type: String },
    income: { type: Number },
    bookings: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
    ],
    listings: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
        },
    ],
});
exports.User = mongoose_1.default.model('User', exports.userSchema);
