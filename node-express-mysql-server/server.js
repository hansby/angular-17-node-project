const express = require("express");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const cors = require("cors");
const { callDocumentAI } = require("./app/services/docAIservice");
const path = require("path");

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

global.__basedir = __dirname;

const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Increase body size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: () => 5000,
});

// Serve static files from resources/static/assets/uploads
app.use('/assets/uploads', express.static(path.join(__dirname, 'resources/static/assets/uploads')));

//app.use(speedLimiter);
//app.use(limiter);

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");

db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// // drop the table if it already exists
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to FICA application." });
});

// documentAiService
app.post('/api/process-document', async (req, res) => {
  const { data, projectId, processorId, location } = req.body;
  try {
    const result = await callDocumentAI(projectId, location, processorId, data);
    res.json(result);
		logger.error(`Successfull callDocumentAI call`);
  } catch (err) {
		const newErrMsg = err.response?.data?.error.message || `Error on callDocumentAI: ${err.message}`;
		logger.error(newErrMsg);
    console.error(newErrMsg);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

require("./app/routes/app.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
