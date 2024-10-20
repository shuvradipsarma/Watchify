import {asyncHandler} from '../utils/asyncHandler.js';
// register User
const registerUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"User registered successfully"
    })
})

export default {registerUser}