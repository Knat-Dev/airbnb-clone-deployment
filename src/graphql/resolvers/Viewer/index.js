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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewerResolvers = void 0;
const crypto_1 = __importDefault(require("crypto"));
const api_1 = require("../../../lib/api");
const models_1 = require("../../../models");
const utils_1 = require("../../../lib/utils");
const cookieOptions = {
    httpOnly: true,
    sameSite: true,
    signed: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
};
const logInViaGoogle = (code, token, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { user } = yield api_1.Google.logIn(code);
    console.log('trying google sing in');
    if (!user)
        throw new Error('Google login error');
    // names/photos/email lists
    const userNamesList = ((_a = user.names) === null || _a === void 0 ? void 0 : _a.length) ? user.names : null;
    const userPhotoList = ((_b = user.photos) === null || _b === void 0 ? void 0 : _b.length) ? user.photos : null;
    const userEmailList = ((_c = user.emailAddresses) === null || _c === void 0 ? void 0 : _c.length) ? user.emailAddresses
        : null;
    // User display name
    const userName = userNamesList ? userNamesList[0].displayName : null;
    // User Id
    const userId = userNamesList && ((_e = (_d = userNamesList[0].metadata) === null || _d === void 0 ? void 0 : _d.source) === null || _e === void 0 ? void 0 : _e.id)
        ? userNamesList[0].metadata.source.id
        : null;
    // User Avatar
    const userAvatar = (userPhotoList === null || userPhotoList === void 0 ? void 0 : userPhotoList.length) && userPhotoList[0].url
        ? userPhotoList[0].url
        : null;
    // User Email
    const userEmail = (userEmailList === null || userEmailList === void 0 ? void 0 : userEmailList.length) && userEmailList[0].value
        ? userEmailList[0].value
        : null;
    if (!userId || !userName || !userAvatar || !userEmail)
        throw new Error('Google login error');
    // check if user already exists in db, if so update it
    return models_1.User.findOneAndUpdate({ _id: userId }, { name: userName, avatar: userAvatar, contact: userEmail, token })
        .exec()
        .then((viewer) => {
        if (!viewer) {
            // if it's the user's first sign in
            return models_1.User.create({
                _id: userId,
                token,
                name: userName,
                contact: userEmail,
                avatar: userAvatar,
                income: 0,
                bookings: [],
                listings: [],
            });
        }
        res.cookie('viewer', userId, Object.assign(Object.assign({}, cookieOptions), { maxAge: 1000 * 60 * 60 * 24 * 356 }));
        return viewer;
    });
});
const logInViaCookie = (token, req, res) => {
    console.log('trying cookie sing in');
    console.log(token);
    return models_1.User.findOneAndUpdate({ _id: req.signedCookies.viewer }, { token }, {
        new: true,
    })
        .exec()
        .then((user) => {
        if (!user) {
            res.clearCookie('viewer', cookieOptions);
        }
        console.log('Token after update: ' + (user === null || user === void 0 ? void 0 : user.token));
        return user;
    });
};
exports.viewerResolvers = {
    Query: {
        authUrl: () => {
            try {
                return api_1.Google.authUrl;
            }
            catch (e) {
                throw new Error('Failed to query Google Auth Url ' + e);
            }
        },
    },
    Mutation: {
        logIn: (_root, { input }, { res, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const code = input ? input.code : null;
                const token = crypto_1.default.randomBytes(16).toString('hex');
                console.log(token);
                const viewer = code
                    ? yield logInViaGoogle(code, token, res)
                    : yield logInViaCookie(token, req, res);
                if (!viewer)
                    return { didRequest: true };
                else
                    return {
                        id: viewer.id,
                        token: token,
                        avatar: viewer.avatar,
                        walletId: viewer.walletId,
                        didRequest: true,
                    };
            }
            catch (e) {
                throw new Error(`Failed to log in: ${e}`);
            }
        }),
        logOut: (_root, _args, { res }) => {
            res.clearCookie('viewer', cookieOptions);
            return { didRequest: true };
        },
        connectStripe: (_root, { input }, { req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { code } = input;
                let viewer = yield utils_1.authorize(req);
                if (!viewer) {
                    return new Error('Viewer cannot be found');
                }
                const wallet = yield api_1.Stripe.connect(code);
                if (!wallet) {
                    return new Error('Stripe grant error');
                }
                const updateRes = yield models_1.User.findByIdAndUpdate(viewer.id, {
                    $set: { walletId: wallet.stripe_user_id },
                }, { new: true });
                if (!(updateRes === null || updateRes === void 0 ? void 0 : updateRes._id)) {
                    throw new Error('Viewer cannot be updated');
                }
                viewer = updateRes;
                return {
                    id: viewer.id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (e) {
                throw new Error('Failed to connect with Stripe ' + e);
            }
        }),
        disconnectStripe: (_root, _args, { req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let viewer = yield utils_1.authorize(req);
                if (!viewer)
                    throw new Error('Viewer could not be found');
                const updatedViewer = yield models_1.User.findByIdAndUpdate(viewer.id, {
                    $set: {
                        walletId: '',
                    },
                }, { new: true });
                if (!updatedViewer)
                    throw new Error('Viewer could not be updated');
                return {
                    id: updatedViewer.id,
                    token: updatedViewer.token,
                    avatar: updatedViewer.avatar,
                    walletId: updatedViewer.walletId,
                    didRequest: true,
                };
            }
            catch (e) {
                throw new Error('Failed to disconnect with Stripe ' + e);
            }
        }),
    },
    Viewer: {
        id: (viewer) => (viewer.id ? viewer.id : null),
        hasWallet: (viewer) => {
            return viewer.walletId ? true : undefined;
        },
    },
};
