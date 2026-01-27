const express = require("express");
const projectController = require("../controllers/projectController");
const validate = require("../middleware/validate");
const {
  createProjectSchema,
  assignSolverSchema,
} = require("../validators/projectValidation");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.use(authMiddleware);
router.post(
  "/",
  validate(createProjectSchema),
  projectController.createProject,
);

router.get("/role-based", projectController.getRoleProjects);

// router.get("/all", projectController.getAllProjects);

router.get("/:id", projectController.getProjectById);

router.patch(
  "/:id/assign",
  validate(assignSolverSchema),
  projectController.assignSolver,
);

module.exports = router;
