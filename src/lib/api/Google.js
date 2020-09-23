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
exports.Google = void 0;
const googleapis_1 = require("googleapis");
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const auth = new googleapis_1.google.auth.OAuth2(process.env.G_CLIENT_ID, process.env.G_CLIENT_SECRET, `${process.env.PUBLIC_URL}/login`);
// maps client
const client = new google_maps_services_js_1.Client({});
const parseAddress = (addressComponents) => {
    let country = '', admin = '', city = '';
    addressComponents.forEach((addressComponent) => {
        if (addressComponent.types.includes(google_maps_services_js_1.AddressType.country)) {
            country = addressComponent.long_name;
        }
        if (addressComponent.types.includes(google_maps_services_js_1.AddressType.administrative_area_level_1)) {
            admin = addressComponent.long_name;
        }
        if (addressComponent.types.includes(google_maps_services_js_1.AddressType.locality)) {
            city = addressComponent.long_name;
        }
    });
    return { country, admin, city };
};
exports.Google = {
    authUrl: auth.generateAuthUrl({
        access_type: 'online',
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
    }),
    logIn: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const { tokens } = yield auth.getToken(code);
        auth.setCredentials(tokens);
        const { data } = yield googleapis_1.google
            .people({ version: 'v1', auth })
            .people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names,photos',
        });
        return { user: data };
    }),
    geocode: (address) => __awaiter(void 0, void 0, void 0, function* () {
        const geocodingResponse = yield client.geocode({
            params: { key: `${process.env.G_GEOCODE_KEY}`, address },
        });
        if (geocodingResponse.status < 200 || geocodingResponse.status > 299)
            throw new Error('Failed to geocode address');
        return parseAddress(geocodingResponse.data.results[0].address_components);
    }),
};
