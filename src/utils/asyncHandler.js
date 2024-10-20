const  asyncHandler = (requestHandler)=>{
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}



export default {asyncHandler}

// higher order function(takes function as parameter) and
// returns a function
// const asyncHandler = (fn)=> async(req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }
//     catch(error)
//     {
//         res.status(error.code || 500).json({
//             sucess:false,
//             message:error.message
//         })
//     }
// }