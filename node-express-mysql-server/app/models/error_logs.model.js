module.exports = (sequelize, Sequelize) => {
  const ErrorLogs = sequelize.define("errors", {
		id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
		log: {type: Sequelize.STRING },
		is_resolved: {type: Sequelize.BOOLEAN, defaultValue: false },
  });
  return ErrorLogs;
};
