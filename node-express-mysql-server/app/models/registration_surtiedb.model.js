module.exports = (sequelize, Sequelize) => {
  const RegistrationSurtie = sequelize.define("surtie", {	
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },		
		source: { type: Sequelize.STRING },
		first_name: { type: Sequelize.STRING },
		last_name: { type: Sequelize.STRING },
		id_number: {type: Sequelize.STRING },
		allow: {
			type: Sequelize.STRING,
  		allowNull: true,   // or false depending on your schema
		}
  }, {
    timestamps: false  // important if the table has no createdAt/updatedAt
  });

  return RegistrationSurtie;
};
