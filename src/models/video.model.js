import mongoose from "mongoose";
import mongooseAggregatePaginate from  "mongoose-aggregate-paginate-v2";
import jwt from "jsonwebtoken"; 
import bcrypt from "bcrypt"; // hashing 
const videoSchema = new mongoose.Schema({
        videoFile:{
            type:String, //cloudinary file
            required:true // if file is not present then how project initiates, hence needed
        },
        thumbnail:{
            type:String, //cloudinary file
            required:true
        },
        title:{
            type:String, 
            required:true
        },
        description:{
            type:String, 
            required:true
        },
        duration:{
            type:Number, //cloudinary file
            required:true
        },
        views:{
            type: Number,
            default:0
        },
        isPublished:{
            type: Number,
            default:0
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {timestamp:true}
)
// () => {......} - arrow function does not have this reference to understand the current context
// next() is Pre Hook method - registers a pre-save middleware function provided by mongoose to run before a document is saved.

userSchema.pre("save",async function(next){
    // if the password is not updated so call next() no need to hash the password
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password,10)
    next()
})
//creating a method that will get instantiated when the schema is created
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = new mongoose.model("Video",videoSchema)