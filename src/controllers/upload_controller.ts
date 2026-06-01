import { Request , Response } from "express";
import cloudinary from '../config/cloudinary';
import User from "../models/user_model";



export const uploadImage = async (req: Request, res: Response) => {
     try {
          if (!req.file) {
               return res.status(400).json({ success: false, message: "No file uploaded" });
          }
          console.log("Received file:", req.file);
          const result = await cloudinary.uploader.upload_stream({ folder: "users" },(error, result) => {
                    if (error) {
                         return res.status(500).json({ success: false, message: "Cloudinary upload failed", error });
                    }
                    res.status(200).json({ success: true, data: { url: result?.secure_url } });
               }
          );
          result.end(req.file.buffer);
     }catch (error) {
        res.status(500).json({ success: false, message: "Image upload failed", error });
        console.error("Upload error:", error);
     }               
}


export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const userId = (req as any).user.id;

    const streamUpload = (fileBuffer: Buffer) => {
      return new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "users" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const imageUrl = await streamUpload(req.file.buffer);

  
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: imageUrl },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Avatar uploaded",
      data: { user }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Upload failed", error });
  }
};
