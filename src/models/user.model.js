import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
        },
        avatar:{
            type:String, // cloudinary url
            required:true,
        },
        coverImage:{
            type:String //cloudinary url
        },
        watchHistory:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refereshToken:{
            type:String
        }
    },{timestamp:true}
)
// "Pre" is Mongoose middleware hook - executes just before saving so that password in encrypted
// middleware function(callback) should have parameter "next" that is always passed
// Cannot write arrow function as callback since it doesnot has "this" reference
userSchema.pre("save", async function(next){
    if(!this.isModified("password"))
    {
        return next();
    }
    else{
        this.password = await bcrypt.hash(this.password,10) // this refers to User Mongoose model which is an object
        next()
    }
})

// comparing password hashed with the current user entered password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

// generate access token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET, // process.env is obj reference that is used to set/retrieve env variables
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// generate refresh token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
        _id:this._id,
        },
        process.env.ACCESS_TOKEN_SECRET, // process.env is obj reference that is used to set/retrieve env variables
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)