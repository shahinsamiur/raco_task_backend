const sql = require("../config/db").sql;
const AppError = require("../utils/AppError");
const sendResponse = require("../utils/response");

// POST /api/requests/:projectId
// Role: Solver
exports.requestProject = async (req, res, next) => {
  try {
    if (req.user.role !== "solver") {
      throw new AppError("Only solvers can request projects", 403);
    }

    const { projectId } = req.params;
    const solverId = req.user.id;

    // Check project exists & unassigned
    const project = await sql`
      SELECT * FROM projects
      WHERE id = ${projectId} AND status = 'unassigned'
    `;

    if (!project.length) {
      throw new AppError("Project not available", 400);
    }

    const request = await sql`
      INSERT INTO project_requests (project_id, solver_id)
      VALUES (${projectId}, ${solverId})
      RETURNING *
    `;

    return sendResponse(res, 201, true, "Request sent", request[0]);
  } catch (err) {
    next(err);
  }
};
// GET /api/requests/:projectId
// Role: Buyer
exports.getProjectRequests = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const buyerId = req.user.id;

    // Verify ownership
    const project = await sql`
      SELECT * FROM projects
      WHERE id = ${projectId} AND buyer_id = ${buyerId}
    `;

    if (!project.length) {
      throw new AppError("Unauthorized", 403);
    }

    const requests = await sql`
      SELECT pr.*, u.name, u.email
      FROM project_requests pr
      JOIN users u ON pr.solver_id = u.id
      WHERE pr.project_id = ${projectId}
      ORDER BY pr.created_at DESC
    `;

    return sendResponse(res, 200, true, "Requests fetched", requests);
  } catch (err) {
    next(err);
  }
};
// PATCH /api/requests/:id/accept
// Role: Buyer
exports.acceptRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const buyerId = req.user.id;

    // Get request + project
    const result = await sql`
      SELECT pr.*, p.buyer_id
      FROM project_requests pr
      JOIN projects p ON pr.project_id = p.id
      WHERE pr.id = ${requestId}
    `;

    if (!result.length || result[0].buyer_id !== buyerId) {
      throw new AppError("Unauthorized", 403);
    }

    const { project_id, solver_id } = result[0];

    // Transaction (important!)
    await sql.begin(async (trx) => {
      await trx`
        UPDATE project_requests
        SET status = 'accepted', updated_at = now()
        WHERE id = ${requestId}
      `;

      await trx`
        UPDATE project_requests
        SET status = 'rejected'
        WHERE project_id = ${project_id}
        AND id != ${requestId}
      `;

      await trx`
        UPDATE projects
        SET solver_id = ${solver_id}, status = 'assigned'
        WHERE id = ${project_id}
      `;
    });

    return sendResponse(res, 200, true, "Request accepted");
  } catch (err) {
    next(err);
  }
};
// PATCH /api/requests/:id/reject
// Role: Buyer
exports.rejectRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const buyerId = req.user.id;

    const request = await sql`
      SELECT pr.*, p.buyer_id
      FROM project_requests pr
      JOIN projects p ON pr.project_id = p.id
      WHERE pr.id = ${requestId}
    `;

    if (!request.length || request[0].buyer_id !== buyerId) {
      throw new AppError("Unauthorized", 403);
    }

    await sql`
      UPDATE project_requests
      SET status = 'rejected', updated_at = now()
      WHERE id = ${requestId}
    `;

    return sendResponse(res, 200, true, "Request rejected");
  } catch (err) {
    next(err);
  }
};
