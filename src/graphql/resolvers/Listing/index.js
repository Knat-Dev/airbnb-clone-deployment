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
exports.listingResolvers = void 0;
const models_1 = require("../../../models");
const utils_1 = require("../../../lib/utils");
const types_1 = require("./types");
const api_1 = require("../../../lib/api");
const verifyHostListingInput = ({ title, description, type, price, }) => {
    if (title.length > 100)
        throw new Error('Listing title must be under 100 characters');
    if (description.length > 5000)
        throw new Error('Listing description must be under 5000 characters');
    if (type !== models_1.ListingType.Apartment && type !== models_1.ListingType.House)
        throw new Error('Listing type must be either an apartment or a house');
    if (price < 0)
        throw new Error('price must be greater than 0');
};
exports.listingResolvers = {
    Query: {
        listings: (_root, { location, filter, limit, page }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // location query
                const match = {};
                let locationString = null;
                if (location) {
                    const { country, admin, city } = yield api_1.Google.geocode(location);
                    if (admin)
                        match.admin = admin;
                    if (city)
                        match.city = city;
                    if (country)
                        match.country = country;
                    else
                        throw new Error('No country found');
                    const cityText = city ? `${city}, ` : '';
                    const adminText = city ? `${admin}, ` : '';
                    locationString = `${cityText}${adminText}${country}`;
                }
                let listingsPromise = models_1.Listing.find(match);
                const total = yield models_1.Listing.find(match).countDocuments();
                if (filter)
                    if (filter === types_1.ListingsFilter.PRICE_HIGH_TO_LOW)
                        listingsPromise = listingsPromise.sort({ price: -1 });
                    else
                        listingsPromise = listingsPromise.sort({ price: 1 });
                listingsPromise = listingsPromise
                    .skip(page > 0 ? (page - 1) * limit : 0)
                    .limit(limit);
                const listings = yield listingsPromise.exec();
                return {
                    region: locationString,
                    total,
                    result: listings,
                };
            }
            catch (e) {
                throw new Error(`Failed to query listings, error: ${e}`);
            }
        }),
        listing: (_root, { id }, { req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const listing = yield models_1.Listing.findById(id);
                if (!listing)
                    throw new Error("Listing can't be found");
                const viewer = yield utils_1.authorize(req);
                if ((viewer === null || viewer === void 0 ? void 0 : viewer.id) === listing.host)
                    listing.authorized = true;
                return listing;
            }
            catch (e) {
                throw new Error('Failed to query listing ' + e);
            }
        }),
    },
    Mutation: {
        deleteListing: (_root, { id }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield models_1.Listing.findByIdAndDelete(id);
        }),
        hostListing: (_root, { input }, { req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                verifyHostListingInput(input);
                let viewer = yield utils_1.authorize(req);
                if (!viewer)
                    throw new Error('Viewer cannot be found');
                const { country, admin, city } = yield api_1.Google.geocode(input.address);
                if (!country || !admin || !city)
                    throw new Error('invalid address input');
                console.log(country);
                api_1.Cloudinary.initialize();
                const imageUrl = yield api_1.Cloudinary.upload(input.image);
                const listing = yield models_1.Listing.create(Object.assign(Object.assign({}, input), { image: imageUrl, country,
                    admin,
                    city, host: viewer._id, bookings: [], bookingsIndex: {} }));
                yield models_1.User.findByIdAndUpdate(viewer._id, {
                    $push: { listings: listing._id },
                });
                return listing;
            }
            catch (e) {
                throw new Error("We couldn't create your listing at this moment, please try again " +
                    e);
            }
        }),
    },
    Listing: {
        host: (listing) => __awaiter(void 0, void 0, void 0, function* () {
            const host = yield models_1.User.findOne({
                _id: listing.host,
            }).exec();
            if (!host) {
                throw new Error("Host can't be found.");
            }
            return host;
        }),
        bookingsIndex: (listing) => {
            return JSON.stringify(listing.bookingsIndex);
        },
        bookings: (listing, { page, limit }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!listing.authorized)
                    return null;
                const bookingsLength = yield models_1.Booking.find({
                    _id: { $in: listing.bookings },
                }).countDocuments();
                const bookings = yield models_1.Booking.find({
                    _id: { $in: listing.bookings },
                })
                    .skip(page > 0 ? (page - 1) * limit : 0)
                    .limit(limit)
                    .exec();
                return {
                    total: bookingsLength,
                    result: bookings,
                };
            }
            catch (e) {
                throw new Error(`Failed to query listing bookings, error: ${e}`);
            }
        }),
    },
};
