import multer from "multer";

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
    if (!file || !file.mimetype || !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
};

const uploader = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        // Accept large camera/gallery files; image is optimized server-side before R2 upload.
        fileSize: 100 * 1024 * 1024,
        files: 20,
    },
});

export const uploadProductImagesParser = uploader.array("images", 20);
export const uploadAvatarParser = uploader.single("avatar");
