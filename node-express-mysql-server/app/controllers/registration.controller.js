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

// Create and Save a new Registration
exports.create = (req, res) => {

	const user_id = req.body.user_id;
	const reg_type = req.body.reg_type;
	const firstName = req.body.firstName;
	const lastName = req.body.lastName;
	const bus_reg_no = req.body.bus_reg_no;
	const trust_reg_no = req.body.trust_reg_no;
	const cell = req.body.cell;
	const email = req.body.email;
	const tax_no = req.body.tax_no;


	const address_1 = req.body.address_1;
	const address_2 = req.body.address_2;
	const suburb = req.body.suburb;
	const town = req.body.town;
	const postal_code = req.body.postal_code;

	const acc_holder = req.body.acc_holder;
	const acc_type = req.body.acc_type;
	const acc_no = req.body.acc_no;
	const swift_code = req.body.swift_code;
	const iban = req.body.iban;
	const file_id = req.body.file_id;
	const file_poa = req.body.file_poa;
	const file_bus_reg = req.body.file_bus_reg;
	const file_trust = req.body.file_trust;
	const file_passport = req.body.file_passport;
	const passport = req.body.passport;
	const bank = req.body.bank;
	const citizenStatus = req.body.citizenStatus;
	const bank_other = req.body.bank_other;

  /*
  if (!user_id && !passport) {
    res.status(400).send({
      message: "We need Identification from you"
    });
    return;
  }

  if (!email) {
    res.status(400).send({
      message: "We need an Email address from you"
    });
    return;
  }	*/

  // Create a Registration
  const registration = {
		user_id, reg_type, firstName, lastName, bus_reg_no, trust_reg_no, cell, email, tax_no, 
		address_1, address_2, suburb, town, postal_code, acc_holder, acc_type, acc_no, swift_code, 
		iban, bank, file_id, file_poa, file_bus_reg, file_trust, file_passport, passport, citizenStatus, bank_other
  };

  // Save Registration in the database
  Registration.create(registration)
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
  const { user_id, lastName, email, passport, acc_no, trust_reg_no, bus_reg_no } = req.query;

  const orConditions = [];
  if (user_id) orConditions.push({ user_id: { [Op.like]: `%${user_id}%` } });
  if (email) orConditions.push({ email: { [Op.like]: `%${email}%` } });
  if (passport) orConditions.push({ passport: { [Op.like]: `%${passport}%` } });
  if (acc_no) orConditions.push({ acc_no: { [Op.like]: `%${acc_no}%` } });
  if (trust_reg_no) orConditions.push({ trust_reg_no: { [Op.like]: `%${trust_reg_no}%` } });
  if (bus_reg_no) orConditions.push({ bus_reg_no: { [Op.like]: `%${bus_reg_no}%` } });
  if (lastName) orConditions.push({ lastName: { [Op.like]: `%${lastName}%` } });

  // If no params -> fetch all
  const condition = orConditions.length > 0 ? { where: { [Op.or]: orConditions } } : {};

  Registration.findAll(condition)
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

// Update a Registration by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Registration.update(req.body, {
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

// Delete a Registration with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Registration.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Registration was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Registration with id=${id}. Maybe Registration was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Registration with id=" + id
      });
    });
};

// Delete all Registration from the database.
exports.deleteAll = (req, res) => {
  Registration.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Registration were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all Registrations."
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
