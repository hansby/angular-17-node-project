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

// Find a single Registration with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
	const user_id = req.params.user_id;
	const passport = req.params.passport;
	const email = req.params.email;
	const lastName = req.params.lastName;

  Registration.findOne({ where: { user_id: id } })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
				logger.error(`Cannot find Registration: ${id} ${user_id} ${passport} ${email} ${lastName}`);
        res.status(404).send({
          message: `Cannot find Registration with id=${id}.`
        });
      }
    })
    .catch(err => {
			logger.error(`Error retrieving Registration: ${id} ${user_id} ${passport} ${email} ${lastName}`);
      res.status(500).send({
        message: "Error retrieving Registration with id=" + id
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
