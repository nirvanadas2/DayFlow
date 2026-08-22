import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/status.js";

// Field sets an editor is allowed to change — mirrors
// backend/src/controllers/employees.controller.js exactly, so the UI never
// offers an edit the API would reject.
const ADMIN_EDITABLE = ["photo", "name", "title", "aboutMe", "interests", "phone", "bloodGroup", "address", "emergencyContact"];
const SELF_EDITABLE = ["photo", "phone", "address", "aboutMe", "interests"];

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Field({ label, value, editable, onChange, textarea, type = "text" }) {
  if (!editable) {
    return (
      <div className="profile-field">
        <span className="profile-field-label">{label}</span>
        <span className="profile-field-value profile-field-readonly">{value || "—"}</span>
      </div>
    );
  }
  return (
    <div className="profile-field">
      <label className="profile-field-label">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={3} />
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

// Admin-only, no fields yet — real salary calculation lands in Phase 4. See
// docs/dayflow-spec.md → Employee profile → Salary Info.
function SalaryTab() {
  return (
    <div className="profile-salary-placeholder">
      Salary details (wage, PF, professional tax, and auto-calculated components) will be
      available here in Phase 4.
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
          {activeTab === "salary" && isAdmin && <SalaryTab />}
        </div>
      </div>
    </div>
  );
}
