module.exports = app => {
  const registrations = require("../controllers/registration.controller.js");

  var router = require("express").Router();

  // Create a new Registration
  router.post("/", registrations.create);

  // Retrieve all Registration
  router.get("/", registrations.findAll);

  // Retrieve all published Tutorials
  //router.get("/published", tutorials.findAllPublished);

  // Retrieve a single Tutorial with id
  router.get("/:id", registrations.findOne);

  // Update a registrations with id
  router.put("/:id", registrations.update);

  // Delete a registrations with id
  router.delete("/:id", registrations.delete);

  // Delete all registrations
  router.delete("/", registrations.deleteAll);

  app.use('/api/registrations', router);
};
