import {Router} from 'express';
import {registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

// router.route("/...").post(middleware inject,route)
// So before going to the route it will first execute the middleware logic then go to route
router.route("/register").post(
    upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),
registerUser)
export default router