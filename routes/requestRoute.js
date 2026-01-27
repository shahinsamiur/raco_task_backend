const express = require("express");
const requestController = require("../controllers/requestController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.use(authMiddleware);

router.post("/:projectId", requestController.requestProject);
router.get("/:projectId", requestController.getProjectRequests);
router.patch("/:solverId/accept", requestController.acceptRequest);
router.patch("/:solverId/rejectRequest", requestController.rejectRequest);

module.exports = router;
