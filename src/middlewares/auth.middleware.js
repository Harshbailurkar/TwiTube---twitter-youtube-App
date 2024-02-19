import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
export const verifyJWT = asyncHandler(async (req, res, next) => {
  //get the token from the cookies
  //verify the token
  //attach the user to the req object
  //call the next middleware
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      throw new APIError(401, "Access Token Required");
    }
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new APIError(404, "user not found");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new APIError(401, "Invalid Access Token");
  }
});
