import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
// register User
const registerUser = asyncHandler(async (req,res)=>{
    // Information needed to register a user -----
    // 1.Get user input (username,email,password,fullname,
    // avatar,coverImage) from frontend 
    // 2.Validate user input details
    // 3.Check if user already exists(by using username,email details)
    // 4.Check for images,check for avatar
    // 5.Upload them to Cloudinary, check avatar uploaded successfully or not
    // 6.Create user json object - create entry in DB
    // 7.Remove password & refresh token fields from json response
    // 8.Check for user creation
    // 9. Return response
    
    // de-structure json request
    const {fullName,email,username,password}=req.body
    console.log("email:",email)
    if([fullName,email,username,password].some((field)=>
    field?.trim() === ""))
    {
        throw new ApiError(400,"All fields are required")
    }
    //checking if user already exists or not
    const existedUser = User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser)
    {
        throw new ApiError(409,"User with email or username already exits")
    }
    
    // check for avatar and cover image
    // avatar image field - compulsory
    // cover image field - not compulsory
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required")
    }
})

export {registerUser}