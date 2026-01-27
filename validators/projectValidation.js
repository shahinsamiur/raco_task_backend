const yup = require("yup");

const createProjectSchema = yup.object({
  title: yup.string().required("Project title is required"),
  description: yup.string().required("Project description is required"),
});

const assignSolverSchema = yup.object({
  solverId: yup.string().required("must select slover"),
});

module.exports = { createProjectSchema, assignSolverSchema };
