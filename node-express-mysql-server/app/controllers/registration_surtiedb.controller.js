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
const RegistrationSurtie = db.surties;
const Op = db.Sequelize.Op;

// Create and Save a new Registration
exports.create = (req, res) => {

	const first_name = req.body.first_name;
	const last_name = req.body.last_name;
	const id_number = req.body.id_number;
	const allow = req.body.allow;

  // Create a Registration
  const registration = {
		first_name, last_name, id_number, allow
  };

  // Save Registration in the database
  RegistrationSurtie.create(registration)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
			logger.error(`Error on Create Reg API - User ID: ${first_name, last_name, id_number}`);
      res.status(500).send({
        error_message:
          err.message || "Some error occurred while creating the Registration."
      });
    });
};

// Retrieve all Registrations from the database.
exports.findAll = (req, res) => {
  const { source, first_name, last_name, id_number, allow } = req.query;
	const limit = parseInt(req.query.limit) || 100;   // default 100
	//const offset = parseInt(req.query.offset) || 0;   // default 0

  const orConditions = [];
	if (source) orConditions.push({ source: { [Op.like]: `%${source}%` } });
	if (first_name) orConditions.push({ first_name: { [Op.like]: `%${first_name}%` } });
  if (last_name) orConditions.push({ last_name: { [Op.like]: `%${last_name}%` } });
	if (id_number) orConditions.push({ id_number: { [Op.like]: `%${id_number}%` } });
	if (allow) orConditions.push({ allow: { [Op.like]: `%${allow}%` } });

  // If no params -> fetch all
	const condition = {
		where: orConditions.length > 0 ? { [Op.or]: orConditions } : undefined,
		limit: limit,
		//offset: offset
	};

	//res.send({ message: "SurtieDB Registration endpoint is active." });

	
  RegistrationSurtie.findAll(condition)
    .then(data => res.send(data))
    .catch(err => {
      logger.error(`Error retrieving registrations: ${err.message}`);
      res.status(500).send({
        error_message: err.message || "Some error occurred while retrieving registrations."
      });
    });
};

// Find a single Registration with an id
exports.findOne = (req, res) => {
	const id_number = req.query.id_number;

  RegistrationSurtie.findOne({ where: { id_number: id_number } }) //{ [Op.eq]: id_number }
    .then(data => {
      if (data) {
        res.send({
					first_name: data.first_name,
					last_name: data.last_name,
					id_number: data.id_number,
					allow: data.allow					
				});
      } else {
				logger.error(`ID does not exist: ${id_number}`);
        res.status(404).send({
          error_message: `Cannot find ID with id_number=${id_number}.`
        });
      }
    })
    .catch(err => {
			logger.error(`Error retrieving Registration: ${id_number}`);
      res.status(500).send({
        error_message: "Error retrieving Registration with id_number=" + id_number
      });
    });
};

// Update a Registration by the id in the request
exports.update = (req, res) => {
  const originalId = req.params.id;   // original id_number in the URL
  const updates = req.body;           // contains new id_number + other fields

  RegistrationSurtie.update(updates, {
    where: { id_number: originalId }
  })
    .then(([affectedRows]) => {
			res.send({
				message: "Record was updated successfully."
			});
    })
    .catch(err => {
      res.status(500).send({
        error_message: "Error updating Registration with id_number=" + originalId
      });
    });
};