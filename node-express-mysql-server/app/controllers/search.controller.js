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
const Registration = db.registrations;
const RegistrationSurtie = db.surties;
const Op = db.Sequelize.Op;

// Retrieve all Registrations from the database.
exports.findAll = (req, res) => {
  const user_id = req.query.user_id;
	const lastName = req.query.lastName;
	const firstName = req.query.firstName;
	const email = req.query.email;
	const passport = req.query.passport;
	const bankAccNumber = req.query.acc_no;
	const trustRegNumber = req.query.trust_reg_no;
	const businessRegNumber = req.query.bus_reg_no;
	const condition = {
		where: {
			[Op.or]: [
				{ user_id: { [Op.like]: `%${user_id}%` } },
				{ email: { [Op.like]: `%${email}%` } },
				{ passport: { [Op.like]: `%${passport}%` } },
				{ acc_no: { [Op.like]: `%${bankAccNumber}%` } },
				{ trust_reg_no: { [Op.like]: `%${trustRegNumber}%` } },
				{ bus_reg_no: { [Op.like]: `%${businessRegNumber}%` } },
				{ firstName: { [Op.like]: `%${firstName}%` } },
				{ lastName: { [Op.like]: `%${lastName}%` } },
			]
		}
	}

  Registration.findAll(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
			logger.error(`Some error occurred while retrieving registrations. ${user_id} ${passport} ${email} ${lastName}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving registrations."
      });
    });
};

// Find a single SURTIEDB RECORD with an id
exports.findOne = (req, res) => {

  const key = req.query.keyword;

	const condition = {
		where: {
			[Op.or]: [
				{ id_number: { [Op.like]: `%${key}%` } },
				{ first_name: { [Op.like]: `%${key}%` } },
				{ last_name: { [Op.like]: `%${key}%` } },
			]
		}
	}	

  // If no params -> fetch all
  //const condition = orConditions.length > 0 ? { where: { [Op.or]: orConditions } } : {};

	// SURTIEDB only - no Registrations
  RegistrationSurtie.findAll(condition)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
				logger.error(`Cannot find Registration:`);
        res.status(404).send({
          message: `Cannot find Registration with id=.`
        });
      }
    })
    .catch(err => {
			logger.error(`Error retrieving Registration:`);
      res.status(500).send({
        message: "Error retrieving Registration with id="
      });
    });
};

// find all published Registrations
exports.findAllPublished = (req, res) => {
  Registration.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Registrations."
      });
    });
};
