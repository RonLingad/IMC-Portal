import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./AdminControl.css";

function AdminControl() {
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  // =========================================================
  // 1. USER MANAGEMENT
  // =========================================================

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");

  const [userForm, setUserForm] = useState({
    id: null,
    email: "",
    password: "",
    role: "librarystaff",
  });

  const [isEditingUser, setIsEditingUser] = useState(false);

  // =========================================================
  // 2. ACTIVITIES
  // =========================================================

  const [activities, setActivities] = useState([]);

  const [activityForm, setActivityForm] = useState({
    title: "",
    date: "",
    description: "",
    image: "",
  });

  const [activityFile, setActivityFile] = useState(null);

  // =========================================================
  // 3. ANNOUNCEMENTS
  // =========================================================

  const [announcements, setAnnouncements] = useState([]);

  const [announcementForm, setAnnouncementForm] = useState({
    badge: "",
    date: "",
    tag: "",
    title: "",
    description: "",
  });

  // =========================================================
  // 4. FACILITIES
  // =========================================================

  const [facilities, setFacilities] = useState([]);

  const [facilityForm, setFacilityForm] = useState({
    title: "",
    description: "",
    image: "",
  });

  const [facilityFile, setFacilityFile] = useState(null);

  // =========================================================
  // 5. VISION & MISSION
  // =========================================================

  const [visionMission, setVisionMission] = useState({
    vision: "",
    mission: "",
  });

  // =========================================================
  // 6. STAFF MANAGEMENT
  // =========================================================

  const [staff, setStaff] = useState([]);

  const [staffForm, setStaffForm] = useState({
    id: null,
    name: "",
    position: "",
    image: "",
  });

  const [staffFile, setStaffFile] = useState(null);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async () => {
    setLoading(true);

    try {
      if (activeTab === "users") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("email", { ascending: true });

        if (error) throw error;

        setUsers(data || []);
      }

      // -------------------------------------------------------
      // ACTIVITIES
      // -------------------------------------------------------

      else if (activeTab === "activities") {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("id", { ascending: false });

        if (error) throw error;

        setActivities(data || []);
      }

      // -------------------------------------------------------
      // ANNOUNCEMENTS
      // -------------------------------------------------------

      else if (activeTab === "announcements") {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .order("id", { ascending: false });

        if (error) throw error;

        setAnnouncements(data || []);
      }

      // -------------------------------------------------------
      // FACILITIES
      // -------------------------------------------------------

      else if (activeTab === "facilities") {
        const { data, error } = await supabase
          .from("facilities")
          .select("*")
          .order("id", { ascending: false });

        if (error) throw error;

        setFacilities(data || []);
      }

      // -------------------------------------------------------
      // VISION & MISSION
      // -------------------------------------------------------

      else if (activeTab === "vision") {
        const { data, error } = await supabase
          .from("vision_mission")
          .select("*")
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setVisionMission(data);
        }
      }

      // -------------------------------------------------------
      // STAFF
      // -------------------------------------------------------

      else if (activeTab === "staff") {
        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .order("id", { ascending: false });

        if (error) throw error;

        setStaff(data || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err.message);

      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  const uploadImageFile = async (file, bucket = "images") => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;

    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // =========================================================
  // 1. USER MANAGEMENT
  // =========================================================

  const handleSaveUser = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (isEditingUser) {
        const updatePayload = {
          role: userForm.role,
          email: userForm.email,
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userForm.id);

        if (profileError) throw profileError;

        setMessage({
          text: "User account updated successfully!",
          type: "success",
        });
      } else {
        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: userForm.email,
            password: userForm.password,
          });

        if (authError) throw authError;

        const userId = authData.user?.id;

        if (userId) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert([
              {
                id: userId,
                email: userForm.email,
                role: userForm.role,
              },
            ]);

          if (profileError) throw profileError;
        }

        setMessage({
          text: "User account created successfully!",
          type: "success",
        });
      }

      setUserForm({
        id: null,
        email: "",
        password: "",
        role: "librarystaff",
      });

      setIsEditingUser(false);

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (usr) => {
    setUserForm({
      id: usr.id,
      email: usr.email,
      password: "",
      role: usr.role,
    });

    setIsEditingUser(true);
  };

  const handleDeleteUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user account?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage({
        text: "User deleted successfully.",
        type: "success",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") return true;

    return u.role === roleFilter;
  });

  // =========================================================
  // 2. ACTIVITIES
  // =========================================================

  const handleSaveActivity = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      let imageUrl = activityForm.image;

      if (activityFile) {
        imageUrl = await uploadImageFile(activityFile);
      }

      const { error } = await supabase
        .from("activities")
        .insert([
          {
            ...activityForm,
            image: imageUrl,
          },
        ]);

      if (error) throw error;

      setMessage({
        text: "Activity posted successfully!",
        type: "success",
      });

      setActivityForm({
        title: "",
        date: "",
        description: "",
        image: "",
      });

      setActivityFile(null);

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this activity?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage({
        text: "Activity removed.",
        type: "success",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    }
  };

  // =========================================================
  // 3. ANNOUNCEMENTS
  // =========================================================

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const { error } = await supabase
        .from("announcements")
        .insert([announcementForm]);

      if (error) throw error;

      setMessage({
        text: "Announcement posted successfully!",
        type: "success",
      });

      setAnnouncementForm({
        badge: "",
        date: "",
        tag: "",
        title: "",
        description: "",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this announcement?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage({
        text: "Announcement removed.",
        type: "success",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    }
  };

  // =========================================================
  // 4. FACILITIES
  // =========================================================

  const handleSaveFacility = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      let imageUrl = facilityForm.image;

      if (facilityFile) {
        imageUrl = await uploadImageFile(facilityFile);
      }

      const { error } = await supabase
        .from("facilities")
        .insert([
          {
            ...facilityForm,
            image: imageUrl,
          },
        ]);

      if (error) throw error;

      setMessage({
        text: "Facility added successfully!",
        type: "success",
      });

      setFacilityForm({
        title: "",
        description: "",
        image: "",
      });

      setFacilityFile(null);

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFacility = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this facility?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("facilities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage({
        text: "Facility removed.",
        type: "success",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    }
  };

  // =========================================================
  // 5. VISION & MISSION
  // =========================================================

  const handleSaveVisionMission = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const { error } = await supabase
        .from("vision_mission")
        .upsert([visionMission]);

      if (error) throw error;

      setMessage({
        text: "Vision & Mission updated successfully!",
        type: "success",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 6. STAFF MANAGEMENT
  // =========================================================

  const resetStaffForm = () => {
    setStaffForm({
      id: null,
      name: "",
      position: "",
      image: "",
    });

    setStaffFile(null);
    setIsEditingStaff(false);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      let imageUrl = staffForm.image;

      // Upload new image if selected
      if (staffFile) {
        imageUrl = await uploadImageFile(staffFile);
      }

      const staffData = {
        name: staffForm.name.trim(),
        position: staffForm.position.trim(),
        image: imageUrl,
      };

      if (isEditingStaff) {
        const { error } = await supabase
          .from("staff")
          .update(staffData)
          .eq("id", staffForm.id);

        if (error) throw error;

        setMessage({
          text: "Staff information updated successfully!",
          type: "success",
        });
      } else {
        const { error } = await supabase
          .from("staff")
          .insert([staffData]);

        if (error) throw error;

        setMessage({
          text: "Staff member added successfully!",
          type: "success",
        });
      }

      resetStaffForm();

      fetchData();
    } catch (err) {
      console.error("Staff save error:", err);

      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = (item) => {
    setStaffForm({
      id: item.id,
      name: item.name || "",
      position: item.position || "",
      image: item.image || "",
    });

    setStaffFile(null);
    setIsEditingStaff(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteStaff = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this staff member?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage({
        text: "Staff member removed successfully.",
        type: "success",
      });

      fetchData();
    } catch (err) {
      setMessage({
        text: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-container">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        <div className="sidebar-header">
          <h2>Admin Control</h2>

          <span className="admin-badge">
            Panel
          </span>
        </div>

        <nav className="admin-nav">

          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            👥 User Management
          </button>

          <button
            className={activeTab === "activities" ? "active" : ""}
            onClick={() => setActiveTab("activities")}
          >
            📅 Activities & News
          </button>

          <button
            className={activeTab === "announcements" ? "active" : ""}
            onClick={() => setActiveTab("announcements")}
          >
            📢 Announcements
          </button>

          <button
            className={activeTab === "facilities" ? "active" : ""}
            onClick={() => setActiveTab("facilities")}
          >
            🏢 Facilities
          </button>

          <button
            className={activeTab === "staff" ? "active" : ""}
            onClick={() => setActiveTab("staff")}
          >
            👨‍💼 Staff Management
          </button>

          <button
            className={activeTab === "vision" ? "active" : ""}
            onClick={() => setActiveTab("vision")}
          >
            🎯 Vision & Mission
          </button>

        </nav>

        <div className="sidebar-footer">

          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="admin-content">

        {message.text && (
          <div className={`admin-alert ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* ===================================================
            TAB 1 — USERS
        ==================================================== */}

        {activeTab === "users" && (
          <section className="admin-section">

            <h3>
              User Accounts Management
            </h3>

            <form
              onSubmit={handleSaveUser}
              className="admin-form"
            >

              <h4>
                {isEditingUser
                  ? "Update User Account"
                  : "Add New User Account"}
              </h4>

              <input
                type="email"
                placeholder="User Email Address"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder={
                  isEditingUser
                    ? "New Password (optional)"
                    : "Temporary Password"
                }
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    password: e.target.value,
                  })
                }
                required={!isEditingUser}
              />

              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    role: e.target.value,
                  })
                }
              >
                <option value="librarystaff">
                  Library Staff
                </option>

                <option value="avrstaff">
                  AVR Staff
                </option>

                <option value="faculty">
                  Faculty
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

              <div className="form-buttons">

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {isEditingUser
                    ? "Update Account"
                    : "Create Account"}
                </button>

                {isEditingUser && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setIsEditingUser(false);

                      setUserForm({
                        id: null,
                        email: "",
                        password: "",
                        role: "librarystaff",
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

            <div className="user-filter-bar">

              <h4>
                All User Accounts ({filteredUsers.length})
              </h4>

              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value)
                }
              >
                <option value="all">
                  Filter: All Roles
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="librarystaff">
                  Library Staff
                </option>

                <option value="avrstaff">
                  AVR Staff
                </option>

                <option value="faculty">
                  Faculty
                </option>
              </select>

            </div>

            <div className="admin-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.length === 0 ? (

                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        No users found for this filter.
                      </td>
                    </tr>

                  ) : (

                    filteredUsers.map((u) => (

                      <tr key={u.id}>

                        <td>
                          {u.email}
                        </td>

                        <td>
                          <span
                            className={`badge-role ${u.role}`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td>

                          {u.role === "admin" ? (

                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#94a3b8",
                                fontStyle: "italic",
                              }}
                            >
                              Protected Admin
                            </span>

                          ) : (

                            <>
                              <button
                                onClick={() =>
                                  handleEditUser(u)
                                }
                                className="btn-edit"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteUser(u.id)
                                }
                                className="btn-delete"
                              >
                                Delete
                              </button>
                            </>

                          )}

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {/* ===================================================
            TAB 2 — ACTIVITIES
        ==================================================== */}

        {activeTab === "activities" && (
          <section className="admin-section">

            <h3>
              Manage Activities & Campus News
            </h3>

            <form
              onSubmit={handleSaveActivity}
              className="admin-form"
            >

              <input
                type="text"
                placeholder="Title"
                value={activityForm.title}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    title: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Date (e.g. 11 August 2026)"
                value={activityForm.date}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    date: e.target.value,
                  })
                }
                required
              />

              <div className="file-input-group">

                <label>
                  Upload Image File (Optional):
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setActivityFile(
                      e.target.files[0]
                    )
                  }
                />

              </div>

              <input
                type="text"
                placeholder="Or Image URL (Optional)"
                value={activityForm.image}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    image: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Body Description"
                value={activityForm.description}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    description: e.target.value,
                  })
                }
                rows="4"
                required
              />

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                Upload Activity
              </button>

            </form>

            <h4 style={{ marginTop: "2rem" }}>
              Posted Activities Overview ({activities.length})
            </h4>

            <div className="admin-list">

              {activities.length === 0 ? (

                <p style={{ color: "#666" }}>
                  No activities posted yet.
                </p>

              ) : (

                activities.map((item) => (

                  <div
                    key={item.id}
                    className="admin-item-card"
                  >

                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                      />
                    )}

                    <div style={{ flex: 1 }}>

                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.date}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteActivity(item.id)
                      }
                      className="btn-delete"
                    >
                      Delete
                    </button>

                  </div>

                ))

              )}

            </div>

          </section>
        )}

        {/* ===================================================
            TAB 3 — ANNOUNCEMENTS
        ==================================================== */}

        {activeTab === "announcements" && (
          <section className="admin-section">

            <h3>
              Manage Official Announcements
            </h3>

            <form
              onSubmit={handleSaveAnnouncement}
              className="admin-form"
            >

              <input
                type="text"
                placeholder="Badge Text (e.g. IMPORTANT NOTICE)"
                value={announcementForm.badge}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    badge: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Date (e.g. AUGUST 14, 2026)"
                value={announcementForm.date}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    date: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Tag (e.g. Library)"
                value={announcementForm.tag}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    tag: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Title"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Description Body"
                value={announcementForm.description}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    description: e.target.value,
                  })
                }
                rows="4"
                required
              />

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                Upload Announcement
              </button>

            </form>

            <h4 style={{ marginTop: "2rem" }}>
              Posted Announcements Overview ({announcements.length})
            </h4>

            <div className="admin-list">

              {announcements.length === 0 ? (

                <p style={{ color: "#666" }}>
                  No announcements posted yet.
                </p>

              ) : (

                announcements.map((item) => (

                  <div
                    key={item.id}
                    className="admin-item-card"
                  >

                    <div style={{ flex: 1 }}>

                      <span
                        style={{
                          background: "#e2e8f0",
                          padding: "2px 6px",
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                        }}
                      >
                        {item.badge}
                      </span>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "4px",
                        }}
                      >
                        {item.title}
                      </strong>

                      <p>
                        {item.date} | {item.tag}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteAnnouncement(item.id)
                      }
                      className="btn-delete"
                    >
                      Delete
                    </button>

                  </div>

                ))

              )}

            </div>

          </section>
        )}

        {/* ===================================================
            TAB 4 — FACILITIES
        ==================================================== */}

        {activeTab === "facilities" && (
          <section className="admin-section">

            <h3>
              Manage Facilities
            </h3>

            <form
              onSubmit={handleSaveFacility}
              className="admin-form"
            >

              <input
                type="text"
                placeholder="Facility Title"
                value={facilityForm.title}
                onChange={(e) =>
                  setFacilityForm({
                    ...facilityForm,
                    title: e.target.value,
                  })
                }
                required
              />

              <div className="file-input-group">

                <label>
                  Upload Image File (Optional):
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFacilityFile(
                      e.target.files[0]
                    )
                  }
                />

              </div>

              <input
                type="text"
                placeholder="Or Image URL (Optional)"
                value={facilityForm.image}
                onChange={(e) =>
                  setFacilityForm({
                    ...facilityForm,
                    image: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Facility Body Description"
                value={facilityForm.description}
                onChange={(e) =>
                  setFacilityForm({
                    ...facilityForm,
                    description: e.target.value,
                  })
                }
                rows="4"
                required
              />

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                Add Facility
              </button>

            </form>

            <h4 style={{ marginTop: "2rem" }}>
              Posted Facilities Overview ({facilities.length})
            </h4>

            <div className="admin-list">

              {facilities.length === 0 ? (

                <p style={{ color: "#666" }}>
                  No facilities posted yet.
                </p>

              ) : (

                facilities.map((item) => (

                  <div
                    key={item.id}
                    className="admin-item-card"
                  >

                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                      />
                    )}

                    <div style={{ flex: 1 }}>

                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.description
                          ? `${item.description.substring(
                              0,
                              60
                            )}...`
                          : ""}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteFacility(item.id)
                      }
                      className="btn-delete"
                    >
                      Delete
                    </button>

                  </div>

                ))

              )}

            </div>

          </section>
        )}

        {/* ===================================================
            TAB 5 — STAFF
        ==================================================== */}

        {activeTab === "staff" && (
          <section className="admin-section">

            <h3>
              Manage Library Staff
            </h3>

            <p className="section-description">
              Add and manage the staff members that will
              appear on the public staff page.
            </p>

            {/* STAFF FORM */}

            <form
              onSubmit={handleSaveStaff}
              className="admin-form staff-form"
            >

              <h4>
                {isEditingStaff
                  ? "Update Staff Member"
                  : "Add New Staff Member"}
              </h4>

              {/* NAME */}

              <div className="staff-form-field">

                <label>
                  Staff Full Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={staffForm.name}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      name: e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* POSITION */}

              <div className="staff-form-field">

                <label>
                  Position
                </label>

                <input
                  type="text"
                  placeholder="e.g. University Librarian"
                  value={staffForm.position}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      position: e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* IMAGE */}

              <div className="file-input-group staff-image-upload">

                <label>
                  Staff Image
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) =>
                    setStaffFile(
                      e.target.files[0] || null
                    )
                  }
                />

                <small>
                  Recommended: square staff photo,
                  JPG or PNG.
                </small>

              </div>

              {/* EXISTING IMAGE */}

              {staffForm.image && !staffFile && (
                <div className="staff-current-image">

                  <span>
                    Current Image
                  </span>

                  <img
                    src={staffForm.image}
                    alt={staffForm.name}
                  />

                </div>
              )}

              {/* BUTTONS */}

              <div className="form-buttons">

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : isEditingStaff
                    ? "Update Staff"
                    : "Add Staff"}
                </button>

                {isEditingStaff && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetStaffForm}
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

            {/* STAFF LIST */}

            <div className="staff-list-header">

              <h4>
                Staff Directory ({staff.length})
              </h4>

            </div>

            <div className="staff-admin-grid">

              {staff.length === 0 ? (

                <div className="staff-empty">

                  <div className="staff-empty-icon">
                    👨‍💼
                  </div>

                  <h4>
                    No Staff Members
                  </h4>

                  <p>
                    Add your first staff member
                    using the form above.
                  </p>

                </div>

              ) : (

                staff.map((item) => (

                  <div
                    key={item.id}
                    className="staff-admin-card"
                  >

                    <div className="staff-admin-photo">

                      {item.image ? (

                        <img
                          src={item.image}
                          alt={item.name}
                        />

                      ) : (

                        <div className="staff-no-photo">
                          👤
                        </div>

                      )}

                    </div>

                    <div className="staff-admin-info">

                      <h4>
                        {item.name}
                      </h4>

                      <p>
                        {item.position}
                      </p>

                    </div>

                    <div className="staff-admin-actions">

                      <button
                        className="btn-edit"
                        onClick={() =>
                          handleEditStaff(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleDeleteStaff(item.id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ))

              )}

            </div>

          </section>
        )}

        {/* ===================================================
            TAB 6 — VISION & MISSION
        ==================================================== */}

        {activeTab === "vision" && (
          <section className="admin-section">

            <h3>
              Manage Vision & Mission
            </h3>

            <form
              onSubmit={handleSaveVisionMission}
              className="admin-form"
            >

              <label>
                Vision Statement
              </label>

              <textarea
                value={visionMission.vision || ""}
                onChange={(e) =>
                  setVisionMission({
                    ...visionMission,
                    vision: e.target.value,
                  })
                }
                rows="4"
                required
              />

              <label>
                Mission Statement
              </label>

              <textarea
                value={visionMission.mission || ""}
                onChange={(e) =>
                  setVisionMission({
                    ...visionMission,
                    mission: e.target.value,
                  })
                }
                rows="4"
                required
              />

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                Save Changes
              </button>

            </form>

          </section>
        )}

      </main>
    </div>
  );
}

export default AdminControl;