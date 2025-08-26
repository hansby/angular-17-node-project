module.exports = app => {
  const registrations = require("../controllers/registration.controller.js");
	const controller = require("../controllers/file.controller.js");
	const search = require("../controllers/search.controller.js");
	const error_logs_controller = require("../controllers/error_logs.controller.js");

  var router_registration = require("express").Router();
	var router_fileUpload = require("express").Router();
	var router_search = require("express").Router();
	var router_error_logs = require("express").Router();

	/**
	 * REGISTRATIONS
	 */

  // Create a new Registration
  router_registration.post("/", registrations.create);

  // Retrieve all Registration
  router_registration.get("/", registrations.findAll);

  // Retrieve all published Tutorials
  //router.get("/published", tutorials.findAllPublished);

  // Retrieve a single Registration with user_id
  router_registration.get("/:id", registrations.findOne);

  // Update a registrations with id
  router_registration.put("/:id", registrations.update);

  // Delete a registrations with id
  router_registration.delete("/:id", registrations.delete);

  // Delete all registrations
  router_registration.delete("/", registrations.deleteAll);

	/**
	 * FILE UPLOAD
	 */
	router_fileUpload.post("/upload", controller.upload);
	router_fileUpload.get("/files", controller.getListFiles);
	router_fileUpload.get("/files/:name", controller.download);
	router_fileUpload.delete("/files/:name", controller.remove);	

	/**
	 * SEARCH
	 */
  router_search.get("/", search.findAll);

	/**
	 * ERROR LOGS
	 */

	router_error_logs.post("/", error_logs_controller.create);
	router_error_logs.get("/", error_logs_controller.findAll);
	router_error_logs.put("/:id", error_logs_controller.update);

	/**
	 * LINK ROUTES TO APP
	 */
  app.use('/api/registrations', router_registration);
	app.use('/api/uploads', router_fileUpload);
	app.use('/api/search', router_search);
	app.use('/api/error-logs', router_error_logs);

};
