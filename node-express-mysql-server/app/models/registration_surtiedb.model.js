module.exports = (sequelize, Sequelize) => {
  const RegistrationSurtie = sequelize.define("surtie", {
		first_name: { type: Sequelize.STRING },
		last_name: { type: Sequelize.STRING },
		id_number: {type: Sequelize.STRING },
		allow: {
			type: Sequelize.BOOLEAN,
  		allowNull: false,   // or false depending on your schema
		}
  });

  return RegistrationSurtie;
};
