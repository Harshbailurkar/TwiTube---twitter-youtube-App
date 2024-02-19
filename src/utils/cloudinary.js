import { throws } from "assert";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("Cloud Not Find a File");
    } else {
      //upload file on Cloudinary
      const responce = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });
      //file uploaded successFully
      console.log("file uploaded" + responce.url);
      return responce;
    }
  } catch (error) {
    if (localFilePath != "") fs.unlinkSync(localFilePath); //remove the locally saved temp file as the upload got failed.
    return null;
  }
};

export { uploadOnCloudinary };
