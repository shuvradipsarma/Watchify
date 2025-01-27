import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from  "mongoose-aggregate-paginate-v2";
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

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = new mongoose.model("Video",videoSchema)