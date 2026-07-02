require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("mydatabase");
const userCollection = database.collection("users");
const roomCollection = database.collection("rooms");    
const bookingCollection = database.collection("bookings");



module.exports = {

    client,
    userCollection,
    roomCollection,
    bookingCollection,
};