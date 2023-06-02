const Note = require("../models/note")
const User = require("../models/user")
const {StatusCodes} = require("http-status-codes")
const asyncWrapper = require("../middleware/asyncwrapper")
const {createFilterQuery, createSortQuery} = require("./filterhelpers")

// errors 
const {
    customApiError, 
    notFoundError,
    unauthenticatedError
}  = require("../errors")



// get all public notes
const getAllPublicNotes = asyncWrapper( async (req,res) => {

    // creating filterQuery
    const filterQuery = createFilterQuery(req.query)
    filterQuery.visibility = "public"
    //creating sortingString
    const sortString = createSortQuery(req.query)
    // creating limit and skip
    // const page = Number(req.query.page) || 1
    // const limit = Number(req.query.limit) || 20
    // const skip = (page-1)*limit
    

    let result = Note.find(filterQuery)

    if (sortString) {
        result.sort(sortString)
    }
    // result.skip(skip).limit(limit)

    let notes = await result

    res.status(StatusCodes.OK).json({status: "success", count: notes.length, notes: notes})
})


// requires authentication
// all private and public notes of a user
const getAllUserNotes = asyncWrapper( async (req, res) => {
    console.log("reached here")
    const {userID} = req.params

    let authenticated = false 
    if (req.authenticated.status && userID == req.authenticated.user.id)
    {
       authenticated = true;
    }
    

    // creating filterQuery
    const filterQuery = createFilterQuery(req.query)

    filterQuery.user = userID
    if (!authenticated) {
        filterQuery.visibility = "public"
    } 
    else {
        let {visibility} = req.query
        if (visibility){
            filterQuery.visibility = {$in: visibility.split(",")}
        }
    }
    
     
    // creating sortingString
    const sortString = createSortQuery(req.query)
    // creating limit and skip
    // const page = Number(req.query.page) || 1
    // const limit = Number(req.query.limit) || 20
    // const skip = (page-1)*limit

    let result = Note.find(filterQuery)

    if (sortString) {
        result.sort(sortString)
    }
    // result.skip(skip).limit(limit)

    let notes = await result


    res.status(StatusCodes.OK).json({status: "success", count: notes.length, notes: notes})
})


// create a note
// requries authentication
const createNote = asyncWrapper(async (req, res) => {
    if (!req.authenticated.status) {
          throw new unauthenticatedError("Please login or register before creating a note.")
    }
    
    req.body.user = req.authenticated.user.id
    // create new note
    const newNote = await Note.create(req.body)
    // send the note 
    res.status(StatusCodes.OK).json({status: "success", msg: "Note saved.", note: newNote})
})


//gets one note 
//requires auth only if note is private 
const getOneNote = asyncWrapper( async(req, res) => {

    const {noteID} = req.params
    const note = await Note.findById(noteID)

    if (!note) {
        throw new notFoundError("The note does not exist.")
    }

    if (req.authenticated.status && req.authenticated.user.id == note.user) {
        return res.status(StatusCodes.OK).json({status: "success", note: note, local: true})
    }
    else {
        if (note.visibility == "private")
        {
            throw new unauthenticatedError("You are not authorized to access this note.")
        }
        else {
            return res.status(StatusCodes.OK).json({status: "success", note: note,  local: false})
        }
    }
})


//updates one note
//requires auth matching with the note
const updateOneNote = asyncWrapper( async (req, res) => {
    if (!req.authenticated.status) {
        throw new unauthenticatedError("Please login before editing a note.")
    }

    let {noteID} = req.params
    req.body.user = req.authenticated.user.id

    //dealing with situation where note does not exist
    const note = await Note.findById(noteID)
    if (!note) {
        throw new notFoundError("The note does not exist.")
    }
  
    //if exists either we update it or update fails because updating user is not owner.
    const updatedNote = await Note.findOneAndUpdate({_id: noteID, user: req.authenticated.user.id}, {...req.body}, {new: true, runValidators: true})
    if (!updatedNote) {
        throw new unauthenticatedError("You are not authorized to edit this note.")
    }

    res.status(StatusCodes.OK).json({status: "success", msg: "Note Updated.", note: updatedNote})
})


//deletes one note
//requires auth matching with the note
const deleteOneNote = asyncWrapper( async (req, res) => {
    if (!req.authenticated.status) {
        throw new unauthenticatedError("Please login before deleting a note.")
    }

    let {noteID} = req.params
  
    //dealing with situation where note does not exist
    const note = await Note.findById(noteID)
    if (!note) {
        throw new notFoundError("The note does not exist.")
    }

    //if exists either we delete it or deletion fails because deleting user is not owner.
    const deletedNote = await Note.findOneAndDelete({_id: noteID, user: req.authenticated.user.id})
    if (!deletedNote) {
        throw new unauthenticatedError("You are not authorized to delete this note.")
    }

    res.status(StatusCodes.OK).json({status: "success", msg: "Note Deleted.", note: deletedNote})
})

//deletes bulk 
//requires auth 
const deleteBulkNotes = (req,res) => {
    res.status(StatusCodes.OK).send("deletes notes in bulk")
}


module.exports = {getAllPublicNotes, getAllUserNotes, createNote, getOneNote, deleteOneNote, updateOneNote, deleteBulkNotes}