"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingResolver = void 0;
const models_1 = require("../../../models");
const utils_1 = require("../../../lib/utils");
const api_1 = require("../../../lib/api");
//checks if dates are available
const resolveBookingIndex = (bookingIndex, checkIn, checkOut) => {
    let dateCursor = new Date(checkIn);
    let checkOutDate = new Date(checkOut);
    const newBookingsIndex = Object.assign({}, bookingIndex);
    while (dateCursor <= checkOutDate) {
        const y = dateCursor.getUTCFullYear().toString();
        const m = dateCursor.getUTCMonth().toString();
        const d = dateCursor.getUTCDate().toString();
        if (!newBookingsIndex[y])
            newBookingsIndex[y] = {};
        if (!newBookingsIndex[y][m])
            newBookingsIndex[y][m] = {};
        if (!newBookingsIndex[y][m][d])
            newBookingsIndex[y][m][d] = true;
        else
            throw new Error('date is taken');
        dateCursor = new Date(dateCursor.getTime() + 1000 * 3600 * 24);
    }
    return newBookingsIndex;
};
exports.bookingResolver = {
    Mutation: {
        createBooking: (_root, { input }, { req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id, source, checkIn, checkOut } = input;
                const viewer = yield utils_1.authorize(req);
                if (!viewer)
                    throw new Error('Viewer could not be found');
                const listing = yield models_1.Listing.findById(id);
                if (!listing)
                    throw new Error('Listing could not be found, please try again');
                if (listing.host === viewer.id)
                    throw new Error('You cannot book your own listing');
                const checkOutDate = new Date(checkOut);
                const checkInDate = new Date(checkIn);
                if (checkOutDate < checkInDate)
                    throw new Error('Check out date must come after check in date.');
                // get bookings index
                const bookingsIndex = resolveBookingIndex(listing.bookingsIndex, checkIn, checkOut);
                const differenceInTime = checkOutDate.getTime() - checkInDate.getTime();
                const differenceInDays = differenceInTime / (1000 * 3600 * 24) + 1;
                const priceBeforeFees = listing.price * differenceInDays;
                const totalPrice = priceBeforeFees;
                const host = yield models_1.User.findById(listing.host);
                if (!host || !host.walletId) {
                    throw new Error('The host cannot be found or is not connected with Stripe.');
                }
                yield api_1.Stripe.charge({
                    amount: totalPrice,
                    stripeAccount: host.walletId,
                    source,
                });
                const booking = yield models_1.Booking.create({
                    tenant: viewer.id,
                    checkIn,
                    checkOut,
                    listing: listing.id,
                });
                // update host's income field
                yield models_1.User.findByIdAndUpdate(host.id, {
                    $inc: { income: totalPrice },
                });
                // add booking to tenant
                yield models_1.User.findByIdAndUpdate(viewer.id, {
                    $push: { bookings: booking.id },
                });
                // add booking to tenant
                yield models_1.Listing.findByIdAndUpdate(listing.id, {
                    $set: { bookingsIndex },
                    $push: { bookings: booking.id },
                });
                return booking;
            }
            catch (e) {
                throw new Error('We could not book your listing at the moment, please try again later! ' +
                    e);
            }
        }),
    },
    Booking: {
        listing: (booking, _args) => __awaiter(void 0, void 0, void 0, function* () {
            return models_1.Listing.findOne({ _id: booking.listing });
        }),
        tenant: (booking, _args) => {
            return models_1.User.findById(booking.tenant);
        },
    },
};
