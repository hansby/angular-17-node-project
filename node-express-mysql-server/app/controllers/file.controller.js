// INIT WINSTON LOGGER
const winston = require("winston");
const DailyRotateFile = require('winston-daily-rotate-file');
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.printf(({ level, message, timestamp }) => {
			return `[${timestamp}] ${level}: ${message}`;
		})
	),	
	transports: [
		new winston.transports.Console(),
		// Daily rotating log files
		new DailyRotateFile({
			filename: 'logs/app-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '10m',
			maxFiles: '14d'
		})		
	],
});
const uploadFile = require("../middleware/upload");
const fs = require("fs");
const baseUrl = "http://localhost:8080";
const documentAICheckPOA = require("../controllers/documentai.controller.js");

const upload = async (req, res) => {
	const fileName = req.body.name;
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

		//documentAICheckPOA(req.file.originalname);

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
		logger.error("Uploaded the file successfully: " + req.file.originalname);
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
			logger.error(`The file upload size is too big: ${fileName}. File size bigger than 10MB `);
      return res.status(500).send({
        message: "File size cannot be larger than 10MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
		logger.error(`Could not upload the file: ${req.file.originalname}. ${err}`);
  }
};

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });

    res.status(200).send(fileInfos);
  });
};

const download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
};

const remove = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }

    res.status(200).send({
      message: "File is deleted.",
    });
  });
};

const removeSync = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  try {
    fs.unlinkSync(directoryPath + fileName);

    res.status(200).send({
      message: "File is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the file. " + err,
    });
  }
};

module.exports = {
  upload,
  getListFiles,
  download,
  remove,
  removeSync,
};