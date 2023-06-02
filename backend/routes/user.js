const express = require("express")
const router = express.Router(); 

const getUserName = require("../controllers/user")


router.route("/user/:userID").get(getUserName)

module.exports = router