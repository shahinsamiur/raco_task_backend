// POST / api / tasks;
// Role: Solver;

exports.createTask = async (req, res, next) => {
  try {
    if (req.user.role !== "solver") {
      throw new AppError("Only solvers can create tasks", 403);
    }

    const { project_id, title, description, deadline } = req.body;
    const solverId = req.user.id;

    // Check solver is assigned to project
    const project = await sql`
      SELECT * FROM projects
      WHERE id = ${project_id}
      AND solver_id = ${solverId}
      AND status = 'assigned'
    `;

    if (!project.length) {
      throw new AppError("Not assigned to this project", 403);
    }

    const task = await sql`
      INSERT INTO tasks (project_id, solver_id, title, description, deadline)
      VALUES (${project_id}, ${solverId}, ${title}, ${description}, ${deadline})
      RETURNING *
    `;

    return sendResponse(res, 201, true, "Task created", task[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id
// Role: Solver

exports.updateTask = async (req, res, next) => {
  try {
    if (req.user.role !== "solver") {
      throw new AppError("Only solvers can update tasks", 403);
    }

    const taskId = req.params.id;
    const solverId = req.user.id;
    const { status, deadline, title, description } = req.body;

    // Ownership check
    const task = await sql`
      SELECT * FROM tasks
      WHERE id = ${taskId} AND solver_id = ${solverId}
    `;

    if (!task.length) {
      throw new AppError("Task not found or unauthorized", 404);
    }

    const updated = await sql`
      UPDATE tasks
      SET
        status = COALESCE(${status}, status),
        deadline = COALESCE(${deadline}, deadline),
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        updated_at = now()
      WHERE id = ${taskId}
      RETURNING *
    `;

    return sendResponse(res, 200, true, "Task updated", updated[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:projectId
// Role: Buyer / Solver
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { id, role } = req.user;

    // Access control
    const project = await sql`
      SELECT * FROM projects
      WHERE id = ${projectId}
      AND (
        buyer_id = ${id}
        OR solver_id = ${id}
      )
    `;

    if (!project.length) {
      throw new AppError("Unauthorized", 403);
    }

    const tasks = await sql`
      SELECT *
      FROM tasks
      WHERE project_id = ${projectId}
      ORDER BY created_at ASC
    `;

    return sendResponse(res, 200, true, "Tasks fetched", tasks);
  } catch (err) {
    next(err);
  }
};
