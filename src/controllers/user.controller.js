import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponce.js";

const registerUser = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const { username, email, password, fullName } = req.body;

  if (!username || !email || !password || !fullName) {
    throw new APIError("Please provide all fields", 400);
  }
  const userexits = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });
  if (userexits) {
    throw new APIError("User already exists", 400);
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  } else {
    coverImageLocalPath = null;
  }

  if (!avatarLocalPath) {
    throw new APIError("Avtar Required", 400);
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  console.log(avatar.url);
  if (!avatar) {
    throw new APIError("Failed to upload avatar", 500);
  }
  const user = await User.create({
    username: username,
    email: email,
    fullName: fullName,
    password: password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new APIError("Failed to create user", 500);
  }

  return res.status(201).json(new APIResponse(201, createdUser));
});
export { registerUser };
