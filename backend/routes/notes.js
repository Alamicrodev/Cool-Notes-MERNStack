const express = require("express")
const router = express.Router()

// all views
const {getAllPublicNotes, getAllUserNotes, createNote, getOneNote, deleteOneNote, updateOneNote, deleteBulkNotes} = require("../controllers/notes")


// required middleware
const authMiddleware = require("../middleware/authmiddleware.js")


router.route("").get(getAllPublicNotes)
router.route("/profile/:userID").get(authMiddleware, getAllUserNotes).delete(authMiddleware, deleteBulkNotes)
router.route("/note").post(authMiddleware, createNote)
router.route("/note/:noteID").get(authMiddleware, getOneNote).patch(authMiddleware, updateOneNote).delete(authMiddleware, deleteOneNote)

module.exports = router