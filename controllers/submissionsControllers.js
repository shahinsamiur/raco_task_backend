// POST / api / submissions;

// Role: Solver;

exports.createSubmission = async (req, res, next) => {
  try {
    if (req.user.role !== "solver") {
      throw new AppError("Only solvers can submit work", 403);
    }

    const { task_id, file_url } = req.body;
    const solverId = req.user.id;

    // Verify solver owns the task
    const task = await sql`
      SELECT t.*, p.solver_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${task_id}
    `;

    if (!task.length || task[0].solver_id !== solverId) {
      throw new AppError("Unauthorized task submission", 403);
    }

    const submission = await sql`
      INSERT INTO submissions (task_id, solver_id, file_url)
      VALUES (${task_id}, ${solverId}, ${file_url})
      RETURNING *
    `;

    return sendResponse(res, 201, true, "Submission uploaded", submission[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/submissions/:id

// Role: Buyer

exports.updateSubmissionStatus = async (req, res, next) => {
  try {
    if (req.user.role !== "buyer") {
      throw new AppError("Only buyers can review submissions", 403);
    }

    const submissionId = req.params.id;
    const { status, feedback } = req.body; // accepted | rejected
    const buyerId = req.user.id;

    if (!["accepted", "rejected"].includes(status)) {
      throw new AppError("Invalid status", 400);
    }

    // Verify ownership
    const result = await sql`
      SELECT s.*, p.buyer_id, s.task_id
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE s.id = ${submissionId}
    `;

    if (!result.length || result[0].buyer_id !== buyerId) {
      throw new AppError("Unauthorized", 403);
    }

    await sql.begin(async (trx) => {
      // Update submission
      await trx`
        UPDATE submissions
        SET status = ${status}, feedback = ${feedback}, updated_at = now()
        WHERE id = ${submissionId}
      `;

      // If accepted → mark task completed
      if (status === "accepted") {
        await trx`
          UPDATE tasks
          SET status = 'completed'
          WHERE id = ${result[0].task_id}
        `;
      }
    });

    return sendResponse(res, 200, true, `Submission ${status}`);
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:taskId

// Role: Buyer

exports.getTaskSubmissions = async (req, res, next) => {
  try {
    if (req.user.role !== "buyer") {
      throw new AppError("Only buyers can view submissions", 403);
    }

    const { taskId } = req.params;
    const buyerId = req.user.id;

    // Verify project ownership
    const task = await sql`
      SELECT p.buyer_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${taskId}
    `;

    if (!task.length || task[0].buyer_id !== buyerId) {
      throw new AppError("Unauthorized", 403);
    }

    const submissions = await sql`
      SELECT s.*, u.name AS solver_name
      FROM submissions s
      JOIN users u ON s.solver_id = u.id
      WHERE s.task_id = ${taskId}
      ORDER BY s.created_at DESC
    `;

    return sendResponse(res, 200, true, "Submissions fetched", submissions);
  } catch (err) {
    next(err);
  }
};
