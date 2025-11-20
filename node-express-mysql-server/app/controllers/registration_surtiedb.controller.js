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

  // Create a Registration
  const registration = {
		first_name, last_name, id_number
  };

  // Save Registration in the database
  RegistrationSurtie.create(registration)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
			logger.error(`Error on Create Reg API - User ID: ${user_id} ${passport} ${email} ${lastName}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Registration."
      });
    });
};

// Retrieve all Registrations from the database.
exports.findAll = (req, res) => {
  const { first_name, last_name, id_number } = req.query;

  const orConditions = [];
  //if (user_id) orConditions.push({ user_id: { [Op.like]: `%${user_id}%` } });
	if (first_name) orConditions.push({ first_name: { [Op.like]: `%${first_name}%` } });
  if (last_name) orConditions.push({ last_name: { [Op.like]: `%${last_name}%` } });
	if (id_number) orConditions.push({ id_number: { [Op.like]: `%${id_number}%` } });

  // If no params -> fetch all
  const condition = orConditions.length > 0 ? { where: { [Op.or]: orConditions } } : {};

	//res.send({ message: "SurtieDB Registration endpoint is active." });

	
  RegistrationSurtie.findAll(condition)
    .then(data => res.send(data))
    .catch(err => {
      logger.error(`Error retrieving registrations: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving registrations."
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
				});
      } else {
				logger.error(`ID does not exist: ${id_number}`);
        res.status(404).send({
          message: `Cannot find ID with id_number=${id_number}.`
        });
      }
    })
    .catch(err => {
			logger.error(`Error retrieving Registration: ${id_number}`);
      res.status(500).send({
        message: "Error retrieving Registration with id_number=" + id_number
      });
    });
};

// Update a Registration by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  RegistrationSurtie.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Registration was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Registration with id=${id}. Maybe Registration was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Registration with id=" + id
      });
    });
};