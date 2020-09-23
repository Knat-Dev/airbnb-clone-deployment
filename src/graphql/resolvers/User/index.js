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
exports.userResolver = void 0;
const models_1 = require("../../../models");
const utils_1 = require("../../../lib/utils");
exports.userResolver = {
    Query: {
        user: (_root, { id }, { req }) => {
            return models_1.User.findOne({ _id: id })
                .then((user) => __awaiter(void 0, void 0, void 0, function* () {
                if (!user) {
                    throw new Error('User cannot be found');
                }
                const u = yield utils_1.authorize(req);
                if (u && u._id === user._id)
                    user.authorized = true;
                return user;
            }))
                .catch((e) => {
                throw new Error(e.message);
            });
        },
    },
    User: {
        hasWallet: (user) => {
            return Boolean(user.walletId);
        },
        income: (user) => {
            return user.authorized ? user.income : null;
        },
        bookings: (user, { limit, page }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // if (!user.authorized) {
                //     console.log('user not authorized.');
                //     return null;
                // }
                const count = yield models_1.Booking.find({
                    _id: { $in: user.bookings },
                }).countDocuments();
                const bookings = yield models_1.Booking.find({
                    _id: { $in: user.bookings },
                })
                    .skip(page > 0 ? (page - 1) * limit : 0)
                    .limit(limit);
                return {
                    total: count,
                    result: bookings,
                };
            }
            catch (e) {
                throw new Error(`Failed to query user bookings, error: ${e}`);
            }
        }),
        listings: (user, { page, limit }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const count = yield models_1.Listing.find({
                    _id: { $in: user.listings },
                }).count();
                const listings = yield models_1.Listing.find({
                    _id: { $in: user.listings },
                })
                    .skip(page > 0 ? (page - 1) * limit : 0)
                    .limit(limit)
                    .exec();
                return {
                    total: count,
                    result: listings,
                };
            }
            catch (e) {
                throw new Error(`Failed to query user listings, error: ${e}`);
            }
        }),
    },
};
