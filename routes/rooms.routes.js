const express = require("express");

const router = express.Router();

const { roomCollection } = require("../config/db");

router.get("/", async(req, res)=>{
    const result  = await roomCollection.find().toArray();
    res.send(result);
})

module.exports = router;