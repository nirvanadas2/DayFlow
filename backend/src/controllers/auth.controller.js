import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { generateCompanyCode, generateLoginId } from "../utils/generateLoginId.js";
import { generateTempPassword } from "../utils/generatePassword.js";

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
      companyLogo: user.companyLogo,
      mustChangePassword: user.mustChangePassword,
      attendanceStatus: user.attendanceStatus,
    },
  });
}

// POST /api/auth/signup
// Creates the company's first account (Admin/HR). There is no open employee
// self-registration — see docs/dayflow-spec.md → Auth.
export async function signup(req, res) {
  const { companyName, name, email, phone, password, companyLogo } = req.body;

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
    companyLogo,
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
    companyLogo: req.user.companyLogo,
    mustChangePassword: req.user.mustChangePassword,
    attendanceStatus: req.user.attendanceStatus,
  });
}

// POST /api/auth/change-password (protected)
// Added for Phase 1 (auth screens): there was no route to clear
// mustChangePassword before this. Used by the forced password-change screen
// — see docs/dayflow-spec.md → Auth.
export async function changePassword(req, res) {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const user = await User.findById(req.user._id).select("+password");
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.json({ message: "Password updated" });
}

// POST /api/auth/employees  (admin/HR only)
// Creates an employee account with a system-generated login ID + first
// password — see docs/dayflow-spec.md → Auth. The admin never chooses the
// password; it's returned once here so it can be relayed to the employee
// (there's no email delivery in v1).
export async function createEmployee(req, res) {
  const { name, email, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const { companyCode, companyName, companyLogo } = req.user;
  const joinYear = new Date().getFullYear();
  const serial = (await User.countDocuments({ companyCode })) + 1;
  const loginId = generateLoginId({ companyCode, name, joinYear, serial });
  const password = generateTempPassword();

  const employee = await User.create({
    companyName,
    companyCode,
    companyLogo,
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
    temporaryPassword: password,
  });
}
