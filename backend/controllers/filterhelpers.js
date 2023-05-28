// creates a filter query 
function createFilterQuery(urlquery) {
    // destructing the filters
    const {search, mood, start_date, end_date} = urlquery 
 
    let filterQuery = {}
 
    //search in title or note  
    if (search) {
        filterQuery= {$or: [
         {
           title: { $regex: new RegExp(search, "i") }
         },
         {
           note: { $regex: new RegExp(search, "i")}
         }
       ]}
    }
   //filter among moods    
    if (mood) {
        filterQuery.mood = {$in: mood.split(",")}
    }
   //filter between dates    
    if (start_date && end_date) {
        filterQuery.updatedAt = {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
          } 
    }
 
    return filterQuery
 }
 
 // creates sort string
 function createSortQuery(urlquery) {
       const {sort} = urlquery
       if (sort) {
         let inputSort = sort.split(",").join(" ")
         return inputSort   
       }
       else {
         return false
       }
 }

 module.exports = {createFilterQuery, createSortQuery}