import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// REGISTER USER API LOGIC
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
    // console.log("email:",email)
    if([fullName,email,username,password].some((field)=>
    field?.trim() === ""))
    {
        throw new ApiError(400,"All fields are required")
    }

    // Mongoose query findOne() is used as database call to MongoDB
    //checking if user already exists or not
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser)
    {
        throw new ApiError(409,"User with email or username already exits")
    }
    
    // console.log(req.files)

    // check for avatar and cover image
    // avatar image field - compulsory
    // cover image field - not compulsory
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required")
    }

    // cover image requirement is not compulsory

    // now upload the avatar file on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar)
    {
        throw new ApiError(400,"Avatar file is required")
    }

    // Mongoose Create() query database call
    // User profile creation takes time(network speed, database calls,etc) hence await is used
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "", // edge case check - coverImage(optional field) might be there or not
        email,
        password,
        username: username.toLowerCase()
    })

    // Mongoose findById() query used as database call
    const createdUser = await User.findById(user._id).select("-password -refreshToken") // "-" indicates donot give these fields as response
    if(!createdUser)
    {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // Now send the structured Response
    return res.status(201).json({
        response : new ApiResponse(200,createdUser,"User registered successfully")
    })
})

// LOGIN USER API LOGIC 
// access and refresh token for Login purpose of user
const generateAccessAndRefreshTokens = async(userId) =>
{
    try
    {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // we store the refreshToken in our DB
        user.refreshToken = refreshToken
        // DB operation takes time hence using await
        await user.save({validateBeforeSave: false}) // no need to other fields only want to salve "refreshToken"
        
        return {accessToken,refreshToken}
    
    }catch(error)
    {
        throw new ApiError(500,"Something went wrong while generating refresh & access token")
    }
}

// LOGIN USER API LOGIC 
const loginUser = asyncHandler(async (req,res) =>{
    // req body -> extract data (user will enter their data to login)
    // username or email 
    // find the user
    // check for password
    // if password correct -> generate access & refresh token and assign to user
    // send cookie as response

    const {email,username, password} = req.body // fields - email,username,password are required to login
    
    if(!(username || email))
    {
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or: [{email}, {username}],
    })

    if(!user)
    {
        throw new ApiError(404,"User does not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid)
    {
        throw new ApiError(401,"Invalid user credentials")
    }

    // takes time to generate since the function itself is async in nature, hence putting "await"
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // fields-password,refreshToken are not sent to LoggedInUser
    
    // making authentication tokens(accessToken and refreshToken) more secure
    const options = {
        httpOnly: true, // this flag ensures assessToken sent as cookies cannot be accessed by JS running on client-side(in the browser)
                         // Only the HTTP requests can access the cookie, which prevents malicious scripts(XSS attack) from reading sensitive cookie data.
        secure: true // This flag ensures that the cookies are only sent over HTTPS (encrypted HTTP).
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200,{user:loggedInUser, accessToken, refreshToken},"User Logged In Successfully"))

})

// LOGOUT USER
const logoutUser = asyncHandler(async(req,res)=>{
    // remove refresh token from cookie
    await User.findByIdAndUpdate(
        // from verifyJWT middleware code, by setting req.user = user, we’re attaching the user object (fetched from the database) 
        // directly to the req object. This allows subsequent middleware or route handlers to access req.user object data
        req.user._id,
        {
            // $set is MongoDB update operator that updates value of a field here its "refreshToken" field
            $set:{
                refreshToken: undefined,
            }
        },
        {
            new: true // in response we will get the new updated value where refreshToken is undefined
        }
    )

    const options = {
        httpOnly: true, // this flag ensures assessToken sent as cookies cannot be accessed by JS running on client-side(in the browser)
                         // Only the HTTP requests can access the cookie, which prevents malicious scripts(XSS attack) from reading sensitive cookie data.
        secure: true // This flag ensures that the cookies are only sent over HTTPS (encrypted HTTP).
    }
    // clear cookie storing accessToken & refreshToken
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged out successfully"))
})

// When access token is expired and user wants to continue session
// Refresh access token
const refreshAccessToken = asyncHandler(async(req,res)=>{
    // get refresh token from cookie
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingrefreshToken)
    {
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
        // Query _id of refreshToken of user from MongoDB using Mongoose to get the user info object 
        const user = await User.findById(decodedToken?._id)
        if(!user)
        {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingrefreshToken !== user?.refreshToken) // !== means strictly not equal i.e value & data type both not matched
        {
            throw new ApiError(401,"Refresh Token expired or Used")
        }
    
        const options = {
            httpOnly: true, // this flag ensures assessToken sent as cookies cannot be accessed by JS
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newrefreshToken,options).json(
            new ApiResponse(200,{accessToken,newrefreshToken},"Acces token refreshed successfully!")
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

// Change Current User Password

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword // set the new password in user password field
    await user.save({validateBeforeSave: false})// new password will save into DB so userSchema.pre('save') is called an password is hashed by bcrypt

    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})

// Get the current User data
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

// Update User Account Details
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email)
    {
        throw new ApiError(400,"All fields are required")
    }

    // DB call
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email: email
            }   
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})


// Update User Avatar
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is missing")
    }
    // upload the avatar file to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    // if url doesnot exists of the uploaded avatar
    if(!avatar.url)
    {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

// Update User Cover Image 
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

// Get User Channel Profile
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    
    if(!username?.trim())
    {
        throw new ApiError(400,"Username is missing")
    }

    const channel = await User.aggregate([
        {
            // matched the User(Person having youtube account and content creator)
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            // Count of User's subscribers
            $lookup:{
                from: "subscriptions", // model name gets lowercased and plural
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // Count of channels subscribed by User(content creator)
            $lookup:{
                from: "subscriptions", // model name gets lowercased and plural
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // Added 2 fields in User original object
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
            
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if(channel?.length < 1)
    {
        throw new ApiError(404,"channel doesnot exist")
    }

    return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory,"Watch History fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
}