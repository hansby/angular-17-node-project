module.exports = (sequelize, Sequelize) => {
  const Registration = sequelize.define("registration", {

		user_id: {type: Sequelize.STRING },
		reg_type: {type: Sequelize.STRING },
		firstName: { type: Sequelize.STRING },
		lastName: { type: Sequelize.STRING },
		bus_reg_no: { type: Sequelize.STRING },
		trust_reg_no: { type: Sequelize.STRING },
		cell: { type: Sequelize.STRING },
		email: { type: Sequelize.STRING },
		tax_no: { type: Sequelize.STRING },
		acc_holder: { type: Sequelize.STRING },
		acc_type: { type: Sequelize.STRING },
		acc_no: { type: Sequelize.STRING },
		swift_code: { type: Sequelize.STRING },
		iban: { type: Sequelize.STRING },
		bank: { type: Sequelize.STRING },
		file_id: { type: Sequelize.STRING },
		file_poa: { type: Sequelize.STRING },
		file_bus_reg: { type: Sequelize.STRING },
		file_trust: { type: Sequelize.STRING },
		passport: { type: Sequelize.STRING },
		citizenStatus: { type: Sequelize.STRING },
		bank_other: { type: Sequelize.STRING },

  });

  return Registration;
};
