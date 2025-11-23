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
const db = require("../models");
const ErrorLog = db.error_logs;
const Op = db.Sequelize.Op;

// Create a new error log for the DB
exports.create = (req, res) => {

	const log = req.body.log;
	const is_resolved = req.body.is_resolved;

  // Create a Registration
  const errorLog = {
		log,
		is_resolved
  };

  // Save ErrorLog in the database
  ErrorLog.create(errorLog)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
			logger.error(`Error on Create Error Log API - ${log}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the ErrorLog."
      });
    });
};

// Retrieve all ErrorLogs from the database.
exports.findAll = (req, res) => {
  const { id, log, is_resolved } = req.query;

  const orConditions = [];
  if (id) orConditions.push({ id: { [Op.eq]: id } });
  if (log) orConditions.push({ log: { [Op.like]: `%${log}%` } });
  if (is_resolved) orConditions.push({ is_resolved: { [Op.eq]: is_resolved } });

  const condition = {
    where: orConditions.length > 0 ? { [Op.or]: orConditions } : undefined,
    //order: [
      //['is_resolved', 'DESC'], // Unresolved (0) last
      //['id', 'ASC']          // Optional: latest logs inside each group
    //],
    //limit: 40                // Always limit to 40
  };

  ErrorLog.findAll(condition)
    .then(data => res.send(data))
    .catch(err => {
      logger.error(`Error retrieving error logs: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving error logs."
      });
    });
};

// Update an ErrorLog by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  ErrorLog.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: `Error log for id ${id} was updated to "resolved" successfully.`
        });
      } else {
        res.send({
          message: `Cannot update Error log with id=${id}. Maybe Error log was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Registration with id=" + id
      });
    });
};