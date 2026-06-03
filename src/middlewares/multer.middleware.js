import multer from "multer";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // folder where files will be stored
  },

  filename: function (req, file, cb) {
    
    cb(null, file.originalname); // file will be saved as original name but since saved for a sjort time so no need to worry
  }
});

export const upload = multer ({storage,});


