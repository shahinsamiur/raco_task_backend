const express = require("express");
const tasksController = require("../controllers/tasksController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.use(authMiddleware);

router.post("/", tasksController.createTask);
router.patch("/:taskId", tasksController.getProjectRequests);
router.get("/:projectId", tasksController.acceptRequest);

module.exports = router;
