import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/status.js";
import { calculateSalary, formatCurrency } from "../lib/salary.js";

// Field sets an editor is allowed to change — mirrors
// backend/src/controllers/employees.controller.js exactly, so the UI never
// offers an edit the API would reject.
const ADMIN_EDITABLE = [
  "photo",
  "name",
  "title",
  "aboutMe",
  "interests",
  "phone",
  "bloodGroup",
  "address",
  "emergencyContact",
  "wageType",
  "fixedWage",
  "workingDaysPerWeek",
];
const SELF_EDITABLE = ["photo", "phone", "address", "aboutMe", "interests"];

// Company-wide percentages configurable via the "Configure percentages"
// panel — mirrors backend/src/controllers/salarySettings.controller.js.
const SALARY_SETTINGS_FIELDS = [
  { key: "basicPercent", label: "Basic (% of wage)" },
  { key: "hraPercent", label: "HRA (% of Basic)" },
  { key: "standardAllowancePercent", label: "Standard Allowance (% of wage)" },
  { key: "performanceBonusPercent", label: "Performance Bonus (% of wage)" },
  { key: "leaveTravelAllowancePercent", label: "Leave Travel Allowance (% of wage)" },
  { key: "pfPercent", label: "Provident Fund (% of Basic)" },
  { key: "professionalTax", label: "Professional Tax (flat amount)" },
];

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Field({ label, value, editable, onChange, textarea, type = "text", options }) {
  if (!editable) {
    const display = options ? options.find((o) => o.value === value)?.label : value;
    return (
      <div className="profile-field">
        <span className="profile-field-label">{label}</span>
        <span className="profile-field-value profile-field-readonly">{display || "—"}</span>
      </div>
    );
  }
  return (
    <div className="profile-field">
      <label className="profile-field-label">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={3} />
      ) : options ? (
        <select value={value} onChange={onChange}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function SaveBar({ dirty, saving, error }) {
  return (
    <div className="profile-save-bar">
      {error && <span className="profile-save-error">{error}</span>}
      <button type="submit" className="profile-save-btn" disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function ProfileTab({ employee, editableFields, onSave, saving, saveError }) {
  const [draft, setDraft] = useState({
    photo: employee.photo || "",
    name: employee.name || "",
    title: employee.title || "",
    aboutMe: employee.aboutMe || "",
    interests: employee.interests || "",
  });
  const [photoError, setPhotoError] = useState("");

  const canEdit = (field) => editableFields.includes(field);
  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photo must be under 1.5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, photo: reader.result }));
    reader.readAsDataURL(file);
  }

  const dirty = Object.keys(draft).some((k) => draft[k] !== (employee[k] || ""));

  function handleSubmit(e) {
    e.preventDefault();
    const patch = {};
    for (const field of ["photo", "name", "title", "aboutMe", "interests"]) {
      if (canEdit(field)) patch[field] = draft[field];
    }
    onSave(patch);
  }

  return (
    <form className="profile-tab-form" onSubmit={handleSubmit}>
      <div className="profile-photo-row">
        {draft.photo ? (
          <img src={draft.photo} alt="" className="profile-photo" />
        ) : (
          <span
            className="profile-avatar"
            style={{ boxShadow: `0 0 0 3px ${STATUS_COLORS[employee.attendanceStatus]}` }}
          >
            {initials(employee.name)}
          </span>
        )}
        {canEdit("photo") && (
          <div className="profile-photo-upload">
            <label className="profile-photo-btn">
              Change photo
              <input type="file" accept="image/*" hidden onChange={handlePhotoFile} />
            </label>
            {photoError && <span className="profile-save-error">{photoError}</span>}
          </div>
        )}
      </div>

      <Field label="Name" value={draft.name} editable={canEdit("name")} onChange={set("name")} />
      <Field label="Title" value={draft.title} editable={canEdit("title")} onChange={set("title")} />
      <Field
        label="About Me"
        value={draft.aboutMe}
        editable={canEdit("aboutMe")}
        onChange={set("aboutMe")}
        textarea
      />
      <Field
        label="Interests / Hobbies"
        value={draft.interests}
        editable={canEdit("interests")}
        onChange={set("interests")}
        textarea
      />

      {editableFields.length > 0 && <SaveBar dirty={dirty} saving={saving} error={saveError} />}
    </form>
  );
}

function PrivateInfoTab({ employee, editableFields, onSave, saving, saveError }) {
  const [draft, setDraft] = useState({
    phone: employee.phone || "",
    bloodGroup: employee.bloodGroup || "",
    address: employee.address || "",
    emergencyContact: employee.emergencyContact || "",
  });

  const canEdit = (field) => editableFields.includes(field);
  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const dirty = Object.keys(draft).some((k) => draft[k] !== (employee[k] || ""));

  function handleSubmit(e) {
    e.preventDefault();
    const patch = {};
    for (const field of ["phone", "bloodGroup", "address", "emergencyContact"]) {
      if (canEdit(field)) patch[field] = draft[field];
    }
    onSave(patch);
  }

  return (
    <form className="profile-tab-form" onSubmit={handleSubmit}>
      <Field label="Phone" value={draft.phone} editable={canEdit("phone")} onChange={set("phone")} type="tel" />
      <Field
        label="Blood Group"
        value={draft.bloodGroup}
        editable={canEdit("bloodGroup")}
        onChange={set("bloodGroup")}
      />
      <Field label="Address" value={draft.address} editable={canEdit("address")} onChange={set("address")} textarea />
      <Field
        label="Emergency Contact"
        value={draft.emergencyContact}
        editable={canEdit("emergencyContact")}
        onChange={set("emergencyContact")}
      />

      {editableFields.length > 0 && <SaveBar dirty={dirty} saving={saving} error={saveError} />}
    </form>
  );
}

const WAGE_TYPE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

// Admin-only — see docs/dayflow-spec.md → Employee profile → Salary Info.
// Wage / working-days fields go through the same admin Edit/Save flow as the
// Profile and Private Info tabs; the percentage settings below are
// company-wide and save independently since they aren't tied to this one
// employee.
function SalaryTab({ employee, editableFields, onSave, saving, saveError, token }) {
  const [draft, setDraft] = useState({
    wageType: employee.wageType || "",
    fixedWage: employee.fixedWage ?? "",
    workingDaysPerWeek: employee.workingDaysPerWeek ?? "",
  });

  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoadError, setSettingsLoadError] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState("");

  useEffect(() => {
    api
      .getSalarySettings(token)
      .then((s) => {
        setSettings(s);
        setSettingsDraft(s);
      })
      .catch((err) => setSettingsLoadError(err.message))
      .finally(() => setSettingsLoading(false));
  }, [token]);

  const canEdit = (field) => editableFields.includes(field);
  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const dirty = Object.keys(draft).some((k) => String(draft[k]) !== String(employee[k] ?? ""));

  function handleSubmit(e) {
    e.preventDefault();
    const patch = {};
    for (const field of ["wageType", "fixedWage", "workingDaysPerWeek"]) {
      if (canEdit(field)) {
        patch[field] = field === "fixedWage" || field === "workingDaysPerWeek"
          ? Number(draft[field]) || 0
          : draft[field];
      }
    }
    onSave(patch);
  }

  const setSettingsField = (field) => (e) =>
    setSettingsDraft((d) => ({ ...d, [field]: e.target.value }));

  const settingsDirty =
    settings && settingsDraft
      ? SALARY_SETTINGS_FIELDS.some((f) => String(settingsDraft[f.key]) !== String(settings[f.key]))
      : false;

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaveError("");
    const patch = {};
    for (const f of SALARY_SETTINGS_FIELDS) {
      patch[f.key] = Number(settingsDraft[f.key]) || 0;
    }
    try {
      const updated = await api.updateSalarySettings(patch, token);
      setSettings(updated);
      setSettingsDraft(updated);
    } catch (err) {
      setSettingsSaveError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  const calc = settings ? calculateSalary(draft.fixedWage, settings) : null;

  return (
    <div>
      <form className="profile-tab-form" onSubmit={handleSubmit}>
        <Field
          label="Wage Type"
          value={draft.wageType}
          editable={canEdit("wageType")}
          onChange={set("wageType")}
          options={WAGE_TYPE_OPTIONS}
        />
        <Field
          label="Fixed Wage"
          value={draft.fixedWage}
          editable={canEdit("fixedWage")}
          onChange={set("fixedWage")}
          type="number"
        />
        <Field
          label="No. of Working Days / Week"
          value={draft.workingDaysPerWeek}
          editable={canEdit("workingDaysPerWeek")}
          onChange={set("workingDaysPerWeek")}
          type="number"
        />

        {editableFields.length > 0 && (
          <SaveBar dirty={dirty && !calc?.overage} saving={saving} error={saveError} />
        )}
      </form>

      <div className="salary-breakdown">
        <h3 className="salary-section-title">Salary Breakdown</h3>
        {settingsLoading && <div className="profile-field-value profile-field-readonly">Loading…</div>}
        {settingsLoadError && <span className="profile-save-error">{settingsLoadError}</span>}
        {calc && (
          <>
            {calc.overage > 0 && (
              <div className="salary-overage-error">
                Basic + HRA + Standard Allowance + Performance Bonus + Leave Travel Allowance exceeds
                the wage by {formatCurrency(calc.overage)}. Reduce the percentages or increase the
                wage.
              </div>
            )}
            <div className="salary-components-grid">
              <div className="salary-component-box">
                <span className="profile-field-label">Basic</span>
                <span className="salary-component-value">{formatCurrency(calc.basic)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">HRA</span>
                <span className="salary-component-value">{formatCurrency(calc.hra)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Standard Allowance</span>
                <span className="salary-component-value">{formatCurrency(calc.standardAllowance)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Performance Bonus</span>
                <span className="salary-component-value">{formatCurrency(calc.performanceBonus)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Leave Travel Allowance</span>
                <span className="salary-component-value">
                  {formatCurrency(calc.leaveTravelAllowance)}
                </span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Fixed Allowance</span>
                <span className="salary-component-value">{formatCurrency(calc.fixedAllowance)}</span>
              </div>
            </div>

            <div className="salary-components-grid">
              <div className="salary-component-box">
                <span className="profile-field-label">Provident Fund (PF)</span>
                <span className="salary-component-value">{formatCurrency(calc.pf)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Professional Tax</span>
                <span className="salary-component-value">{formatCurrency(calc.professionalTax)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="salary-config">
        <button
          type="button"
          className="salary-config-toggle"
          onClick={() => setShowConfig((v) => !v)}
        >
          {showConfig ? "Hide" : "Configure"} percentages
        </button>

        {showConfig && settingsDraft && (
          <form className="profile-tab-form" onSubmit={handleSettingsSubmit}>
            <div className="salary-config-warning">
              These percentages are company-wide — changing them affects every employee, not just{" "}
              {employee.name}.
            </div>
            {SALARY_SETTINGS_FIELDS.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                value={settingsDraft[f.key]}
                editable
                onChange={setSettingsField(f.key)}
                type="number"
              />
            ))}
            <SaveBar dirty={settingsDirty} saving={settingsSaving} error={settingsSaveError} />
          </form>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "private", label: "Private Info" },
];

// Route target for /admin/employees/:id and /employee/profile (self, no id
// param). See docs/dayflow-spec.md → Employee profile.
export default function EmployeeProfile() {
  const { id } = useParams();
  const { token, user: viewer } = useAuth();
  const targetId = id || viewer.id;
  const isAdmin = viewer.role === "admin";

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Admin only — cards open read-only by default (matches the wireframe);
  // Edit unlocks the same form. Employees self-editing their own limited
  // field set are unaffected by this and never toggle it.
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getEmployee(targetId, token)
      .then(setEmployee)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [targetId, token]);

  if (loading) return null;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!employee) return null;

  const editableFields = isAdmin ? (isEditing ? ADMIN_EDITABLE : []) : SELF_EDITABLE;
  const tabs = isAdmin ? [...TABS, { key: "salary", label: "Salary Info" }] : TABS;

  async function handleSave(patch) {
    setSaving(true);
    setSaveError("");
    try {
      const updated = await api.updateEmployee(targetId, patch, token);
      setEmployee(updated);
      if (isAdmin) setIsEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setSaveError("");
  }

  return (
    <div className="profile-page">
      {id && (
        <Link to="/admin" className="profile-back-link">
          ← Back to Employees
        </Link>
      )}
      <div className="profile-card">
        <div className="profile-status">{STATUS_LABELS[employee.attendanceStatus]}</div>
        <h1>{employee.name}</h1>
        {employee.title && <div className="profile-title">{employee.title}</div>}
        <div className="profile-loginid">{employee.loginId}</div>

        {isAdmin && (
          <div className="profile-actions">
            {isEditing ? (
              <button type="button" className="profile-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            ) : (
              <button type="button" className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
        )}

        <nav className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="profile-panel">
          {activeTab === "profile" && (
            <ProfileTab
              key={`profile-${isEditing}`}
              employee={employee}
              editableFields={editableFields}
              onSave={handleSave}
              saving={saving}
              saveError={saveError}
            />
          )}
          {activeTab === "private" && (
            <PrivateInfoTab
              key={`private-${isEditing}`}
              employee={employee}
              editableFields={editableFields}
              onSave={handleSave}
              saving={saving}
              saveError={saveError}
            />
          )}
          {activeTab === "salary" && isAdmin && (
            <SalaryTab
              key={`salary-${isEditing}`}
              employee={employee}
              editableFields={editableFields}
              onSave={handleSave}
              saving={saving}
              saveError={saveError}
              token={token}
            />
          )}
        </div>
      </div>
    </div>
  );
}
