const mongoose = require("mongoose")
const User = require("./user")

const noteSchema = new mongoose.Schema(
    {title: {type: String, maxlength: [60, "Title cannot be longer than 50 characters."], required: [true, "Please add a title."], trim: true}, 
     note: {type: String, trim: true}, 
     mood: {type: String, enum:{values: ["stressed", "fear", "calm", "cool", "nervous", "lovable", "mixed emotions", "romance", "normal", "passion", "relaxed", "very happy"], message: 'You must not be {VALUE}.' }, required: [true, "Please choose a mood."]  },
     visibility: {type: String, enum: {values: ["private", "public"], message: "{VALUE} is not supported." }, required: [true, "Please specify if the note is private or public."] }, 
     user: {type: mongoose.Types.ObjectId, required: [true, "Cannot create a note without a User."]}},
    {timestamps: true}, 
    
)


module.exports = mongoose.model("Note", noteSchema)
