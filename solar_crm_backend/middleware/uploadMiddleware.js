const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// ======================================
// Create Upload Folder
// ======================================

const createFolder = (folder) => {
    const folderPath = path.join(__dirname, `../uploads/${folder}`);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    return folderPath;
};

// ======================================
// File Filter
// ======================================

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only JPG, JPEG, PNG and WEBP images are allowed."),
            false
        );
    }
};

// ======================================
// Create Multer Upload
// ======================================

const createUploader = (folderName) => {

    const storage = multer.memoryStorage();

    return multer({
        storage,

        fileFilter,

        limits: {
            fileSize: 2 * 1024 * 1024 // 2MB
        }
    });
};

// ======================================
// Process Uploaded Image
// ======================================

const processImage = (folderName) => {

    return async (req, res, next) => {

        try {

            if (!req.file) {
                return next();
            }

            const uploadFolder = createFolder(folderName);

            const extension = ".webp";

            const fileName = `${Date.now()}_${Math.round(
                Math.random() * 1E9
            )}${extension}`;

            const outputPath = path.join(uploadFolder, fileName);

            await sharp(req.file.buffer)
                .rotate()
                .resize({
                    width: 800,
                    height: 800,
                    fit: "inside",
                    withoutEnlargement: true
                })
                .webp({
                    quality: 82
                })
                .toFile(outputPath);

            // Replace multer file information
            req.file.filename = fileName;
            req.file.path = outputPath;
            req.file.destination = uploadFolder;
            req.file.mimetype = "image/webp";
            req.file.size = fs.statSync(outputPath).size;

            next();

        } catch (error) {

            console.error("Image processing error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to process uploaded image."
            });
        }
    };
};

// ======================================
// Uploads
// ======================================

const uploadProfile = createUploader("profiles");
const uploadCompanyLogo = createUploader("company");

// ======================================
// Processors
// ======================================

const processProfileImage = processImage("profiles");
const processCompanyLogo = processImage("company");

// ======================================
// Export
// ======================================

module.exports = {
    uploadProfile,
    uploadCompanyLogo,
    processProfileImage,
    processCompanyLogo
};