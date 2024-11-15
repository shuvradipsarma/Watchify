import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
   try {
    // retrieving the accessToken
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // replace("Bearer ") we replace (Bearer with space) to extract token alone 
 
     if(!token)
     {
         throw new ApiError(401,"Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     
     // DB call using findById()
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
     
     if(!user)
     {
         throw new ApiError(401,"Invalid Access Token")
     }
 
     req.user = user
 
     next() // after executing verifyJWT run next method 

   } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access Token")
   }
})

