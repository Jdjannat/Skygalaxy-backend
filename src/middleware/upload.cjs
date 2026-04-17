const multer = require('multer');

function createUploadMiddleware(maxAttachmentSizeBytes, maxAttachmentSizeMb) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxAttachmentSizeBytes,
    },
  });

  function uploadErrorHandler(error, req, res, next) {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `Attachment is too large. Maximum size is ${maxAttachmentSizeMb} MB.`,
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Attachment upload failed: ${error.message}`,
      });
    }

    return next(error);
  }

  return {
    upload,
    uploadErrorHandler,
  };
}

module.exports = {
  createUploadMiddleware,
};
