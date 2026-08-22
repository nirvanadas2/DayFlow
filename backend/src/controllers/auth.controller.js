import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { generateCompanyCode, generateLoginId } from "../utils/generateLoginId.js";

function sendAuthResponse(res, status, user) {
  const token = generateToken(user._id, user.role);
  res.status(status).json({
    token,
    user: {
      id: user._id,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      mustChangePassword: user.mustChangePassword,
    },
  });
}

// POST /api/auth/signup
// Creates the company's first account (Admin/HR). There is no open employee
// self-registration — see docs/dayflow-spec.md → Auth.
export async function signup(req, res) {
  const { companyName, name, email, phone, password } = req.body;

  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const companyCode = generateCompanyCode(companyName);
  const joinYear = new Date().getFullYear();
  const serial = (await User.countDocuments({ companyCode })) + 1;
  const loginId = generateLoginId({ companyCode, name, joinYear, serial });

  const user = await User.create({
    companyName,
    companyCode,
    loginId,
    name,
    email,
    phone,
    password,
    role: "admin",
  });

  sendAuthResponse(res, 201, user);
}

// POST /api/auth/login
// Accepts either the auto-generated loginId or the account email.
export async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const user = await User.findOne({
    $or: [{ loginId: identifier }, { email: identifier.toLowerCase() }],
  }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  sendAuthResponse(res, 200, user);
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({
    id: req.user._id,
    loginId: req.user.loginId,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    companyName: req.user.companyName,
    mustChangePassword: req.user.mustChangePassword,
  });
}

// POST /api/auth/employees  (admin/HR only)
// Creates an employee account with a system-generated login ID + first password.
export async function createEmployee(req, res) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const { companyCode, companyName } = req.user;
  const joinYear = new Date().getFullYear();
  const serial = (await User.countDocuments({ companyCode })) + 1;
  const loginId = generateLoginId({ companyCode, name, joinYear, serial });

  const employee = await User.create({
    companyName,
    companyCode,
    loginId,
    name,
    email,
    phone,
    password,
    role: "employee",
    mustChangePassword: true,
  });

  res.status(201).json({
    id: employee._id,
    loginId: employee.loginId,
    name: employee.name,
    email: employee.email,
    role: employee.role,
  });
}
