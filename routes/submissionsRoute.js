const express = require("express");
const submissionsControllers = require("../controllers/submissionsControllers");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.use(authMiddleware);

router.post("/", submissionsControllers.createSubmission);
router.patch("/:submissionsId", submissionsControllers.getTaskSubmissions);
router.get("/:taskId", submissionsControllers.updateSubmissionStatus);

module.exports = router;
