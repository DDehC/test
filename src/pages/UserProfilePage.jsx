import React, { useState } from "react";
import "../styles/UserProfilePage.css";
import { categories as DEPARTMENTS } from "../components/DepartmentList.js";

const ALLERGY_OPTIONS = [
  "Dairy",
  "Eggs",
  "Gluten",
  "Peanuts",
  "Shellfish",
  "Soy",
  "Tree Nuts",
  "Wheat",
];

// default profile data (replace with API response)
const DEFAULT_PROFILE = {
  fullName: "förnamn efternamn",
  email: "test.mail@example.com",
  phone: "+46 78 359 5674",
};

const toggleInList = (list, value) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

export default function UserProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [selectedAllergies, setSelectedAllergies] = useState(["Peanuts"]);
  //department names shown here → backend should map to IDs
  const [subscriptions, setSubscriptions] = useState(DEPARTMENTS.slice(0, 2));
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: false,
  });
  const [otherAllergy, setOtherAllergy] = useState("");

  const customAllergies = selectedAllergies.filter(
    (item) => !ALLERGY_OPTIONS.includes(item)
  );

  const updateProfile = ({ target: { name, value } }) =>
    setProfile((prev) => ({ ...prev, [name]: value }));

  const updateNotifications = ({ target: { name, checked } }) =>
    setNotificationPrefs((prev) => ({ ...prev, [name]: checked }));

  const handleAllergyToggle = (option) =>
    setSelectedAllergies((prev) => toggleInList(prev, option));

  const removeAllergy = (option) =>
    setSelectedAllergies((prev) => prev.filter((item) => item !== option));

  const toggleSubscription = (department) =>
    setSubscriptions((prev) => toggleInList(prev, department));

  const addOtherAllergy = () => {
    const value = otherAllergy.trim();
    if (!value) return;
    setSelectedAllergies((prev) =>
      prev.some((item) => item.toLowerCase() === value.toLowerCase())
        ? prev
        : [...prev, value]
    );
    setOtherAllergy("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: send profile,allergies, notifications, subscriptions to API
    window.alert("Profile preferences saved");
  };

  const selectedNotifications = Object.entries(notificationPrefs)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel.toUpperCase());

  return (
    <main className="profile-page">
      <div className="profile-content">
        <form className="profile-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>Contact details</h2>
            <div className="two-column">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={updateProfile}
                  placeholder="Name"
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={updateProfile}
                  placeholder="name@example.com"
                  required
                />
              </label>
            </div>
            <label>
              <span>Mobile number</span>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={updateProfile}
                placeholder="+46 70 000 0000"
              />
            </label>
            <fieldset className="notification-prefs">
              <legend>Notifications</legend>
              <label className="toggle">
                <input
                  type="checkbox"
                  name="email"
                  checked={notificationPrefs.email}
                  onChange={updateNotifications}
                />
                <span>Email updates</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  name="sms"
                  checked={notificationPrefs.sms}
                  onChange={updateNotifications}
                />
                <span>SMS alerts</span>
              </label>
            </fieldset>
          </section>

          <section className="form-section">
            <h2>Food allergies</h2>
            <p className="section-description">
              Let dining and events teams know about allergens to keep you safe
            </p>
            <div className="chip-grid">
              {ALLERGY_OPTIONS.map((option) => {
                const active = selectedAllergies.includes(option);
                return (
                  <button
                    type="button"
                    key={option}
                    className={active ? "chip active" : "chip"}
                    onClick={() => handleAllergyToggle(option)}
                    aria-pressed={active}
                  >
                    {option}
                  </button>
                );
              })}
              {customAllergies.map((option) => (
                <button
                  type="button"
                  key={option}
                  className="chip active custom"
                  onClick={() => removeAllergy(option)}
                  aria-pressed="true"
                >
                  {option}
                  <span aria-hidden="true" className="chip-remove">
                    ×
                  </span>
                  <span className="sr-only">Remove {option}</span>
                </button>
              ))}
            </div>
            <div className="other-allergy">
              <label
                className="other-allergy-label"
                htmlFor="other-allergy-input"
              >
                Add another allergy
              </label>
              <div className="other-allergy-inputs">
                <input
                  id="other-allergy-input"
                  type="text"
                  value={otherAllergy}
                  onChange={({ target }) => setOtherAllergy(target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addOtherAllergy();
                    }
                  }}
                  placeholder="e.g. Strawberries"
                />
                <button
                  type="button"
                  onClick={addOtherAllergy}
                  className="btn add-allergy-button"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Subscribed departments</h2>
            <p className="section-description">
              Choose which campus departments you want updates from
            </p>
            <div className="checkbox-grid">
              {DEPARTMENTS.map((department) => (
                <label key={department} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={subscriptions.includes(department)}
                    onChange={() => toggleSubscription(department)}
                  />
                  <span>{department}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn primary">
              Save profile
            </button>
            <button type="button" className="btn secondary">
              Cancel
            </button>
          </div>
        </form>

        <aside className="profile-preview" aria-live="polite">
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-avatar" aria-hidden="true">
                {profile.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <h3>{profile.fullName}</h3>
              </div>
            </div>
            <dl className="preview-details">
              <div>
                <dt>Email</dt>
                <dd>{profile.email}</dd>
              </div>
              {profile.phone && (
                <div>
                  <dt>Phone</dt>
                  <dd>{profile.phone}</dd>
                </div>
              )}
            </dl>
            <div className="preview-tags">
              <h4>Allergies</h4>
              <ul>
                {selectedAllergies.length > 0 ? (
                  selectedAllergies.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>None listed</li>
                )}
              </ul>
            </div>
            <div className="preview-tags">
              <h4>Departments</h4>
              <ul>
                {subscriptions.length > 0 ? (
                  subscriptions.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No subscriptions yet</li>
                )}
              </ul>
            </div>
            <div className="preview-tags">
              <h4>Notifications</h4>
              <ul>
                {selectedNotifications.length > 0 ? (
                  selectedNotifications.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>Notifications disabled</li>
                )}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
