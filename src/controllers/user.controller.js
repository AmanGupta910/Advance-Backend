import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const registerUser = asyncHandler(async (req, res) => {

    //logic
    //input from frontend
    //validation- not empty
    // already exits {email,name}
    // imput file images,avtar
    //upload them to cloudinary,avtar
    //create user object - create antry in db
    //  result :-response to frontend (remove referesh token field)
    // check for user creation
    //return response


    const { fullname, email, username, password } = req.body
    console.log("email:", email);


    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are Required")
    }

    const existedUser = await User.findOne({ // awiat krna hai
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "Userwith email or Username already existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }



    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }



    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

  const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
  )


  if(!createdUser){
    throw new ApiError(500, "Something went wrong while reqistering the User")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
  )

})


export { registerUser }