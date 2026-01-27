const sql = require("../config/db").sql;
const AppError = require("../utils/AppError");
const sendResponse = require("../utils/response");

exports.createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const buyerId = req.user.id; // From JWT middleware

    // Insert project into DB
    const project = await sql`
      INSERT INTO projects (title, description, buyer_id)
      VALUES (${title}, ${description}, ${buyerId})
      RETURNING *
    `;

    return sendResponse(
      res,
      201,
      true,
      "Project created successfully",
      project[0],
    );
  } catch (err) {
    next(err);
  }
};

exports.getAllProjects = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new AppError("Forbidden: Admins only", 403);
    }

    const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;

    return sendResponse(
      res,
      200,
      true,
      "All projects fetched successfully",
      projects,
    );
  } catch (err) {
    next(err);
  }
};

exports.getRoleProjects = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    let projects;

    if (role === "buyer") {
      projects =
        await sql`SELECT * FROM projects WHERE buyer_id = ${id} ORDER BY created_at DESC`;
    } else if (role === "solver") {
      projects =
        await sql`SELECT * FROM projects WHERE status = 'unassigned' ORDER BY created_at DESC`;
    } else if (role === "admin") {
      projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
    } else {
      throw new AppError("Invalid role", 403);
    }

    return sendResponse(
      res,
      200,
      true,
      "Projects fetched successfully",
      projects,
    );
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const projects = await sql`SELECT * FROM projects WHERE id = ${id}`;

    if (projects.length === 0) {
      throw new AppError("Project not found", 404);
    }
    const { userId, role } = req.user;

    // if (userId == projects.buyer_id && role == "buyer") {
    //   const requestAgainstProjects =
    //     await sql`SELECT * FROM requests WHERE project_id = ${id}`;
    //   const submissions =
    //     await sql`SELECT * FROM submissions WHERE project_id = ${id}`;
    //   const tasks =
    //     await sql`SELECT * FROM submissions WHERE project_id = ${id}`;
    //   return sendResponse(
    //     res,
    //     200,
    //     true,
    //     "Project fetched successfully",
    //     projects[0],
    //   );
    // }

    return sendResponse(
      res,
      200,
      true,
      "Project fetched successfully",
      projects[0],
    );
  } catch (err) {
    next(err);
  }
};

exports.assignSolver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const { solverId } = req.body;
    // Check project exists and belongs to buyer
    const projects =
      await sql`SELECT * FROM projects WHERE id = ${id} AND buyer_id = ${buyerId}`;

    if (projects.length === 0) {
      throw new AppError("Project not found or unauthorized", 404);
    }

    // Update project with solver
    const updated = await sql`
      UPDATE projects
      SET solver_id = ${solverId}, status = 'assigned', updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    return sendResponse(
      res,
      200,
      true,
      "Solver assigned successfully",
      updated[0],
    );
  } catch (err) {
    next(err);
  }
};
