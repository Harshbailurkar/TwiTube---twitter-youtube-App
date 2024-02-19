import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponce.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw new APIError(
      500,
      "something went rong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const { username, email, password, fullName } = req.body;

  if (!username && !email && !password && !fullName) {
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

const loginUser = asyncHandler(async (req, res, next) => {
  //req-body = data
  //username or email, password
  //find the user
  //validate the user
  //acess and refresh token creation
  //send cokkies
  //send res

  const { email, username, password } = req.body;
  console.log(email);
  if (!(username || email)) {
    throw new APIError("username Required", 400);
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new APIError("user not found", 404);
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new APIError("Incorrect Password", 401);
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .lean();

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, null, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIError(401, "unathorised Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new APIError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new APIError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new APIResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "AcessToken Refreshed"
        )
      );
  } catch (error) {
    console.log(error);
    throw new APIError(401, error?.message || "Invalid refresh Token");
  }
});
export { registerUser, loginUser, logoutUser, refreshAccessToken };
