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
	const acc_holder = req.body.acc_holder;
	const acc_type = req.body.acc_type;
	const acc_no = req.body.acc_no;
	const swift_code = req.body.swift_code;
	const iban = req.body.iban;
	const file_id = req.body.file_id;
	const file_poa = req.body.file_poa;
	const file_bus_reg = req.body.file_bus_reg;
	const file_trust = req.body.file_trust;
	const passport = req.body.passport;

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
		user_id, reg_type, firstName, lastName, bus_reg_no, trust_reg_no, cell, email, tax_no, acc_holder, acc_type,
		acc_no, swift_code, iban, file_id, file_poa, file_bus_reg, file_trust, passport
  };

  // Save Registration in the database
  Registration.create(registration)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Registration."
      });
    });
};

// Retrieve all Registrations from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

  Registration.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving registrations."
      });
    });
};

// Find a single Registration with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Registration.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Registration with id=${id}.`
        });
      }
    })
    .catch(err => {
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
