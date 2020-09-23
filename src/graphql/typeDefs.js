"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_express_1 = require("apollo-server-express");
exports.typeDefs = apollo_server_express_1.gql `
    type Bookings {
        total: Int!
        result: [Booking!]!
    }

    type Listings {
        region: String
        total: Int!
        result: [Listing!]!
    }

    type Booking {
        id: ID!
        listing: Listing!
        tenant: User!
        checkIn: String!
        checkOut: String!
    }

    enum ListingType {
        APARTMENT
        HOUSE
    }
    type Listing {
        id: ID!
        title: String!
        description: String!
        image: String!
        host: User!
        type: ListingType!
        address: String!
        city: String!
        country: String!
        admin: String!
        bookings(limit: Int!, page: Int!): Bookings
        bookingsIndex: String
        price: Int!
        numOfGuests: Int!
    }

    type User {
        id: String!
        name: String!
        avatar: String!
        contact: String!
        hasWallet: Boolean!
        income: Int
        bookings(limit: Int!, page: Int!): Bookings
        listings(limit: Int!, page: Int!): Listings!
    }

    type Viewer {
        id: ID
        token: String
        avatar: String
        hasWallet: Boolean
        didRequest: Boolean
    }
    enum ListingsFilter {
        PRICE_LOW_TO_HIGH
        PRICE_HIGH_TO_LOW
    }

    type Query {
        listings(
            location: String
            filter: ListingsFilter!
            limit: Int!
            page: Int!
        ): Listings!
        listing(id: ID!): Listing!
        authUrl: String!
        user(id: ID!): User!
    }

    input LogInInput {
        code: String!
    }

    input ConnectStripeInput {
        code: String!
    }

    input HostListingInput {
        title: String!
        description: String!
        image: String!
        type: ListingType!
        address: String!
        price: Int!
        numOfGuests: Int!
    }

    input CreateBookingInput {
        id: ID!
        source: String!
        checkIn: String!
        checkOut: String!
    }

    type Mutation {
        deleteListing(id: ID!): Listing
        logIn(input: LogInInput): Viewer!
        logOut: Viewer!
        connectStripe(input: ConnectStripeInput!): Viewer!
        disconnectStripe: Viewer!
        hostListing(input: HostListingInput!): Listing!
        createBooking(input: CreateBookingInput!): Booking!
    }
`;
