const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

        cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."), false);

    }

};

// ======================================
// Create Multer Upload
// ======================================

const createUploader = (folderName) => {

    const storage = multer.diskStorage({

        destination: (req, file, cb) => {

            cb(null, createFolder(folderName));

        },

        filename: (req, file, cb) => {

            const extension = path.extname(file.originalname);

            const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}${extension}`;

            cb(null, fileName);

        }

    });

    return multer({

        storage,

        fileFilter,

        limits: {

            fileSize: 2 * 1024 * 1024 // 2MB

        }

    });

};

// ======================================
// Uploads
// ======================================

const uploadProfile = createUploader("profiles");

const uploadCompanyLogo = createUploader("company");

// ======================================

module.exports = {

    uploadProfile,
    uploadCompanyLogo

};