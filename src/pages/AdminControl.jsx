import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./AdminControl.css";

function AdminControl() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  /* =========================================================
     USER MANAGEMENT
  ========================================================= */

  const [users, setUsers] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [userForm, setUserForm] = useState({
    id: null,
    email: "",
    password: "",
    role: "librarystaff",
  });

  const [isEditingUser, setIsEditingUser] = useState(false);

  /* =========================================================
     REQUEST RECORDS
  ========================================================= */

  const [requests, setRequests] = useState([]);

  const [requestSearch, setRequestSearch] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  /* =========================================================
     ACTIVITIES
  ========================================================= */

  const [activities, setActivities] = useState([]);

  const [activityForm, setActivityForm] = useState({
    title: "",
    date: "",
    description: "",
    image: "",
  });

  const [activityFile, setActivityFile] = useState(null);

  /* =========================================================
     ANNOUNCEMENTS
  ========================================================= */

  const [announcements, setAnnouncements] = useState([]);

  const [announcementForm, setAnnouncementForm] = useState({
    badge: "",
    date: "",
    tag: "",
    title: "",
    description: "",
  });

  /* =========================================================
     FACILITIES
  ========================================================= */

  const [facilities, setFacilities] = useState([]);

  const [facilityForm, setFacilityForm] = useState({
    title: "",
    description: "",
    image: "",
  });

  const [facilityFile, setFacilityFile] = useState(null);

  /* =========================================================
     VISION & MISSION
  ========================================================= */

  const [visionMission, setVisionMission] = useState({
    id: null,
    vision: "",
    mission: "",
  });

  /* =========================================================
     STAFF
  ========================================================= */

  const [staff, setStaff] = useState([]);

  const [staffForm, setStaffForm] = useState({
    id: null,
    name: "",
    position: "",
    image: "",
  });

  const [staffFile, setStaffFile] = useState(null);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "users" || activeTab === "user-list") {
      fetchUsers();
    }

    if (activeTab === "requests" || activeTab === "dashboard") {
      fetchRequests();
    }

    if (activeTab === "activities") {
      fetchActivities();
    }

    if (activeTab === "announcements") {
      fetchAnnouncements();
    }

    if (activeTab === "facilities") {
      fetchFacilities();
    }

    if (activeTab === "staff") {
      fetchStaff();
    }

    if (activeTab === "vision") {
      fetchVisionMission();
    }
  }, [activeTab]);

  /* =========================================================
     MESSAGE
  ========================================================= */

  const showMessage = (text, type = "success") => {
    setMessage({
      text,
      type,
    });

    setTimeout(() => {
      setMessage({
        text: "",
        type: "",
      });
    }, 4000);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  /* =========================================================
     USERS
  ========================================================= */

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email", {
          ascending: true,
        });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Fetch users error:", error);

      showMessage(
        error.message || "Unable to load users.",
        "error"
      );
    }
  };

  const resetUserForm = () => {
    setUserForm({
      id: null,
      email: "",
      password: "",
      role: "librarystaff",
    });

    setIsEditingUser(false);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (!userForm.email.trim()) {
        throw new Error("Email address is required.");
      }

      /* =====================================================
         UPDATE EXISTING USER
      ===================================================== */

      if (isEditingUser) {
        const existingUser = users.find(
          (user) => user.id === userForm.id
        );

        if (existingUser?.role === "admin") {
          throw new Error(
            "Administrator accounts cannot be edited."
          );
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            email: userForm.email.trim(),
            role: userForm.role,
          })
          .eq("id", userForm.id);

        if (error) throw error;

        showMessage(
          "User information updated successfully."
        );

        resetUserForm();

        await fetchUsers();

        setActiveTab("user-list");

        return;
      }

      /* =====================================================
         CREATE NEW USER
      ===================================================== */

      if (!userForm.password) {
        throw new Error(
          "A password is required when creating an Auth account."
        );
      }

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email: userForm.email.trim(),
        password: userForm.password,
      });

      if (authError) throw authError;

      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error(
          "Account was not created. Supabase did not return a user ID."
        );
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert([
          {
            id: userId,
            email: userForm.email.trim(),
            role: userForm.role,
          },
        ]);

      if (profileError) throw profileError;

      showMessage(
        "User account created successfully."
      );

      resetUserForm();

      await fetchUsers();

      setActiveTab("user-list");
    } catch (error) {
      console.error("User save error:", error);

      showMessage(
        error.message || "Unable to save user.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    if (user.role === "admin") {
      showMessage(
        "Administrator accounts cannot be edited.",
        "error"
      );

      return;
    }

    setUserForm({
      id: user.id,
      email: user.email || "",
      password: "",
      role: user.role || "librarystaff",
    });

    setIsEditingUser(true);

    setActiveTab("users");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteUser = async (user) => {
    if (user.role === "admin") {
      showMessage(
        "Administrator accounts cannot be deleted.",
        "error"
      );

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.email}?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      showMessage(
        "User profile deleted successfully."
      );

      await fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);

      showMessage(
        error.message || "Unable to delete user.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = userSearch.toLowerCase();

      const matchesSearch =
        !search ||
        user.email
          ?.toLowerCase()
          .includes(search);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  /* =========================================================
     REQUEST RECORDS

     IMPORTANT:
     Your Supabase schema shows:

     library_requests
     - id
     - requester_name
     - requester_email
     - request_type
     - details
     - request_date
     - status
     - created_at
     - updated_at
     - assigned_staff_id

     Therefore we fetch library_requests instead of requests.
  ========================================================= */

  const fetchRequests = async () => {
    try {
      console.log("Fetching ALL library requests...");

      const { data, error } = await supabase
        .from("library_requests")
        .select(`
          id,
          requester_name,
          requester_email,
          request_type,
          details,
          request_date,
          status,
          created_at,
          updated_at,
          assigned_staff_id
        `)
        .order("request_date", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Supabase library_requests error:",
          error
        );

        throw error;
      }

      console.log(
        "Library requests fetched:",
        data
      );

      /*
       * IMPORTANT:
       * Do NOT filter by status here.
       *
       * This means Pending, Assigned,
       * Completed, Cancelled, etc.
       * will ALL be fetched.
       */
      setRequests(data || []);
    } catch (error) {
      console.error(
        "Fetch library requests error:",
        error
      );

      setRequests([]);

      showMessage(
        error.message ||
          "Unable to load library request records.",
        "error"
      );
    }
  };

  /* =========================================================
     REQUEST FILTERING
  ========================================================= */

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const search =
        requestSearch.trim().toLowerCase();

      const requesterName =
        request.requester_name
          ?.toLowerCase() || "";

      const requesterEmail =
        request.requester_email
          ?.toLowerCase() || "";

      const assignedStaff =
        request.assigned_staff_id
          ?.toLowerCase() || "";

      const requestDetails =
        request.details
          ?.toLowerCase() || "";

      const matchesSearch =
        !search ||
        requesterName.includes(search) ||
        requesterEmail.includes(search) ||
        assignedStaff.includes(search) ||
        requestDetails.includes(search);

      const requestType =
        request.request_type
          ?.toLowerCase()
          .trim();

      const matchesType =
        requestTypeFilter === "all" ||
        requestType ===
          requestTypeFilter.toLowerCase();

      const requestStatus =
        request.status
          ?.toLowerCase()
          .trim();

      const matchesStatus =
        requestStatusFilter === "all" ||
        requestStatus ===
          requestStatusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    requests,
    requestSearch,
    requestTypeFilter,
    requestStatusFilter,
  ]);

  /* =========================================================
     REQUEST ANALYTICS
  ========================================================= */

  const requestAnalytics = useMemo(() => {
    const total = requests.length;

    const pending = requests.filter(
      (item) =>
        item.status
          ?.toLowerCase()
          .trim() === "pending"
    ).length;

    const assigned = requests.filter(
      (item) =>
        item.status
          ?.toLowerCase()
          .trim() === "assigned"
    ).length;

    const completed = requests.filter(
      (item) =>
        item.status
          ?.toLowerCase()
          .trim() === "completed"
    ).length;

    const cancelled = requests.filter(
      (item) =>
        item.status
          ?.toLowerCase()
          .trim() === "cancelled"
    ).length;

    const library = requests.filter(
      (item) =>
        item.request_type
          ?.toLowerCase()
          .includes("library")
    ).length;

    const avr = requests.filter(
      (item) =>
        item.request_type
          ?.toLowerCase()
          .includes("avr")
    ).length;

    return {
      total,
      pending,
      assigned,
      completed,
      cancelled,
      library,
      avr,
    };
  }, [requests]);

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const uploadImageFile = async (
    file,
    bucket = "images"
  ) => {
    if (!file) return null;

    const fileExt =
      file.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;

    const { error: uploadError } =
      await supabase.storage
        .from(bucket)
        .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return data.publicUrl;
  };

  /* =========================================================
     ACTIVITIES
  ========================================================= */

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("id", {
          ascending: false,
        });

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error(
        "Fetch activities error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );
    }
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      let imageUrl =
        activityForm.image;

      if (activityFile) {
        imageUrl =
          await uploadImageFile(
            activityFile
          );
      }

      const { error } =
        await supabase
          .from("activities")
          .insert([
            {
              title:
                activityForm.title,
              date:
                activityForm.date,
              description:
                activityForm.description,
              image: imageUrl,
            },
          ]);

      if (error) throw error;

      showMessage(
        "Activity posted successfully."
      );

      setActivityForm({
        title: "",
        date: "",
        description: "",
        image: "",
      });

      setActivityFile(null);

      await fetchActivities();
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (
      !window.confirm(
        "Remove this activity?"
      )
    ) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("activities")
          .delete()
          .eq("id", id);

      if (error) throw error;

      showMessage(
        "Activity removed."
      );

      await fetchActivities();
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    }
  };

  /* =========================================================
     ANNOUNCEMENTS
  ========================================================= */

  const fetchAnnouncements = async () => {
    try {
      const { data, error } =
        await supabase
          .from("announcements")
          .select("*")
          .order("id", {
            ascending: false,
          });

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    }
  };

  const handleSaveAnnouncement =
    async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        const { error } =
          await supabase
            .from("announcements")
            .insert([
              announcementForm,
            ]);

        if (error) throw error;

        showMessage(
          "Announcement posted successfully."
        );

        setAnnouncementForm({
          badge: "",
          date: "",
          tag: "",
          title: "",
          description: "",
        });

        await fetchAnnouncements();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleDeleteAnnouncement =
    async (id) => {
      if (
        !window.confirm(
          "Remove this announcement?"
        )
      ) {
        return;
      }

      try {
        const { error } =
          await supabase
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showMessage(
          "Announcement removed."
        );

        await fetchAnnouncements();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      }
    };

  /* =========================================================
     FACILITIES
  ========================================================= */

  const fetchFacilities = async () => {
    try {
      const { data, error } =
        await supabase
          .from("facilities")
          .select("*")
          .order("id", {
            ascending: false,
          });

      if (error) throw error;

      setFacilities(data || []);
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    }
  };

  const handleSaveFacility =
    async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        let imageUrl =
          facilityForm.image;

        if (facilityFile) {
          imageUrl =
            await uploadImageFile(
              facilityFile
            );
        }

        const { error } =
          await supabase
            .from("facilities")
            .insert([
              {
                title:
                  facilityForm.title,
                description:
                  facilityForm.description,
                image: imageUrl,
              },
            ]);

        if (error) throw error;

        showMessage(
          "Facility added successfully."
        );

        setFacilityForm({
          title: "",
          description: "",
          image: "",
        });

        setFacilityFile(null);

        await fetchFacilities();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleDeleteFacility =
    async (id) => {
      if (
        !window.confirm(
          "Remove this facility?"
        )
      ) {
        return;
      }

      try {
        const { error } =
          await supabase
            .from("facilities")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showMessage(
          "Facility removed."
        );

        await fetchFacilities();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      }
    };

  /* =========================================================
     STAFF
  ========================================================= */

  const fetchStaff = async () => {
    try {
      const { data, error } =
        await supabase
          .from("staff")
          .select("*")
          .order("id", {
            ascending: false,
          });

      if (error) throw error;

      setStaff(data || []);
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    }
  };

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

  const handleSaveStaff =
    async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        let imageUrl =
          staffForm.image;

        if (staffFile) {
          imageUrl =
            await uploadImageFile(
              staffFile
            );
        }

        const staffData = {
          name:
            staffForm.name.trim(),
          position:
            staffForm.position.trim(),
          image: imageUrl,
        };

        if (isEditingStaff) {
          const { error } =
            await supabase
              .from("staff")
              .update(staffData)
              .eq(
                "id",
                staffForm.id
              );

          if (error) throw error;

          showMessage(
            "Staff information updated."
          );
        } else {
          const { error } =
            await supabase
              .from("staff")
              .insert([
                staffData,
              ]);

          if (error) throw error;

          showMessage(
            "Staff member added."
          );
        }

        resetStaffForm();

        await fetchStaff();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleEditStaff = (item) => {
    setStaffForm({
      id: item.id,
      name: item.name || "",
      position:
        item.position || "",
      image: item.image || "",
    });

    setStaffFile(null);
    setIsEditingStaff(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteStaff =
    async (id) => {
      if (
        !window.confirm(
          "Remove this staff member?"
        )
      ) {
        return;
      }

      setLoading(true);

      try {
        const { error } =
          await supabase
            .from("staff")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showMessage(
          "Staff member removed."
        );

        await fetchStaff();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     VISION & MISSION
  ========================================================= */

  const fetchVisionMission =
    async () => {
      try {
        const { data, error } =
          await supabase
            .from("vision_mission")
            .select("*")
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (data) {
          setVisionMission(data);
        }
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      }
    };

  const handleSaveVisionMission =
    async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        const payload = {
          vision:
            visionMission.vision,
          mission:
            visionMission.mission,
        };

        const { error } =
          await supabase
            .from("vision_mission")
            .upsert([
              payload,
            ]);

        if (error) throw error;

        showMessage(
          "Vision and Mission updated successfully."
        );

        await fetchVisionMission();
      } catch (error) {
        showMessage(
          error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const dashboardStats =
    useMemo(() => {
      return {
        users: users.length,
        requests: requests.length,
        activities:
          activities.length,
        announcements:
          announcements.length,
        facilities:
          facilities.length,
        staff: staff.length,
      };
    }, [
      users,
      requests,
      activities,
      announcements,
      facilities,
      staff,
    ]);

  /* =========================================================
     FORMATTERS
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatRequestType = (type) => {
    if (!type) return "—";

    return type
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navItems = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      id: "users",
      icon: "＋",
      label: "User Management",
    },
    {
      id: "user-list",
      icon: "☷",
      label: "User List",
    },
    {
      id: "requests",
      icon: "▤",
      label: "Request Records",
    },
    {
      id: "activities",
      icon: "◷",
      label: "Activities",
    },
    {
      id: "announcements",
      icon: "!",
      label: "Announcements",
    },
    {
      id: "facilities",
      icon: "□",
      label: "Facilities",
    },
    {
      id: "staff",
      icon: "♙",
      label: "Staff Management",
    },
    {
      id: "vision",
      icon: "◇",
      label: "Vision & Mission",
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="admin-container">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            IMC
          </div>

          <div>
            <h1>IMC Portal</h1>
            <span>Administration</span>
          </div>

        </div>

        <div className="sidebar-divider" />

        <nav className="admin-nav">

          {navItems.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={
                  activeTab === item.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    item.id
                  )
                }
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="admin-avatar">
              A
            </div>

            <div>
              <strong>
                Administrator
              </strong>

              <span>
                System Admin
              </span>
            </div>

          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-content">

        {/* TOP BAR */}

        <header className="admin-topbar">

          <div>
            <span className="topbar-label">
              ADMINISTRATION
            </span>

            <h2>
              {
                navItems.find(
                  (item) =>
                    item.id ===
                    activeTab
                )?.label ||
                  "Dashboard"
              }
            </h2>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            System Online
          </div>

        </header>

        {/* MESSAGE */}

        {message.text && (
          <div
            className={`admin-alert ${message.type}`}
          >
            {message.text}
          </div>
        )}

        {/* ===================================================
            DASHBOARD
        ==================================================== */}

        {activeTab ===
          "dashboard" && (
          <section className="page-section">

            <div className="page-heading">
              <div>
                <h3>
                  Dashboard Overview
                </h3>

                <p>
                  Monitor users,
                  requests, and
                  portal content.
                </p>
              </div>
            </div>

            <div className="stats-grid">

              <div className="stat-card">
                <span className="stat-label">
                  TOTAL USERS
                </span>

                <strong>
                  {
                    dashboardStats.users
                  }
                </strong>

                <small>
                  Registered accounts
                </small>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  TOTAL REQUESTS
                </span>

                <strong>
                  {
                    dashboardStats.requests
                  }
                </strong>

                <small>
                  All library requests
                </small>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  PENDING
                </span>

                <strong>
                  {
                    requestAnalytics.pending
                  }
                </strong>

                <small>
                  Awaiting action
                </small>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  COMPLETED
                </span>

                <strong>
                  {
                    requestAnalytics.completed
                  }
                </strong>

                <small>
                  Completed requests
                </small>
              </div>

            </div>

            <div className="analytics-grid">

              <div className="analytics-card">

                <div className="analytics-card-header">

                  <div>
                    <span>
                      REQUEST TYPES
                    </span>

                    <h4>
                      Service Distribution
                    </h4>
                  </div>

                </div>

                <div className="analytics-row">
                  <span>
                    Library
                  </span>

                  <strong>
                    {
                      requestAnalytics.library
                    }
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    AVR Technical
                  </span>

                  <strong>
                    {
                      requestAnalytics.avr
                    }
                  </strong>
                </div>

              </div>

              <div className="analytics-card">

                <div className="analytics-card-header">

                  <div>
                    <span>
                      REQUEST STATUS
                    </span>

                    <h4>
                      Current Status
                    </h4>
                  </div>

                </div>

                <div className="analytics-row">
                  <span>
                    Pending
                  </span>

                  <strong>
                    {
                      requestAnalytics.pending
                    }
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Assigned
                  </span>

                  <strong>
                    {
                      requestAnalytics.assigned
                    }
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Completed
                  </span>

                  <strong>
                    {
                      requestAnalytics.completed
                    }
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Cancelled
                  </span>

                  <strong>
                    {
                      requestAnalytics.cancelled
                    }
                  </strong>
                </div>

              </div>

            </div>

            <div className="dashboard-lower">

              <div className="dashboard-card">

                <h4>
                  Portal Content
                </h4>

                <div className="content-stat">
                  <span>
                    Activities
                  </span>

                  <strong>
                    {
                      dashboardStats.activities
                    }
                  </strong>
                </div>

                <div className="content-stat">
                  <span>
                    Announcements
                  </span>

                  <strong>
                    {
                      dashboardStats.announcements
                    }
                  </strong>
                </div>

                <div className="content-stat">
                  <span>
                    Facilities
                  </span>

                  <strong>
                    {
                      dashboardStats.facilities
                    }
                  </strong>
                </div>

                <div className="content-stat">
                  <span>
                    Staff
                  </span>

                  <strong>
                    {
                      dashboardStats.staff
                    }
                  </strong>
                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-header">
                  <div>
                    <h4>
                      Recent Requests
                    </h4>

                    <small>
                      Showing latest records
                    </small>
                  </div>

                  <button
                    type="button"
                    className="outline-button"
                    onClick={() =>
                      setActiveTab(
                        "requests"
                      )
                    }
                  >
                    View All
                  </button>
                </div>

                {requests.length ===
                0 ? (
                  <p className="empty-text">
                    No request records found.
                  </p>
                ) : (
                  <div className="recent-list">

                    {requests
                      .slice(0, 5)
                      .map(
                        (
                          request
                        ) => (
                          <div
                            key={
                              request.id
                            }
                            className="recent-item"
                          >

                            <div>
                              <strong>
                                {
                                  request.requester_name ||
                                  request.requester_email ||
                                  "Unknown requester"
                                }
                              </strong>

                              <span>
                                {formatRequestType(
                                  request.request_type
                                )}
                              </span>
                            </div>

                            <div>
                              <small>
                                {formatDate(
                                  request.request_date ||
                                    request.created_at
                                )}
                              </small>

                              <span
                                className={`status-badge ${request.status
                                  ?.toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  )}`}
                              >
                                {formatStatus(
                                  request.status
                                )}
                              </span>
                            </div>

                          </div>
                        )
                      )}

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            USER MANAGEMENT
        ==================================================== */}

        {activeTab ===
          "users" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  User Management
                </h3>

                <p>
                  Create portal user
                  accounts.
                </p>
              </div>

              <button
                type="button"
                className="outline-button"
                onClick={() =>
                  setActiveTab(
                    "user-list"
                  )
                }
              >
                View User List
              </button>

            </div>

            <div className="form-card">

              <div className="form-card-header">

                <div>
                  <span>
                    ACCOUNT INFORMATION
                  </span>

                  <h4>
                    {isEditingUser
                      ? "Edit User"
                      : "Create New User"}
                  </h4>
                </div>

              </div>

              <form
                onSubmit={
                  handleSaveUser
                }
                className="admin-form"
              >

                <div className="form-grid">

                  <div className="form-field">

                    <label>
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={
                        userForm.email
                      }
                      placeholder="user@example.com"
                      onChange={(
                        e
                      ) =>
                        setUserForm({
                          ...userForm,
                          email:
                            e.target
                              .value,
                        })
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Role
                    </label>

                    <select
                      value={
                        userForm.role
                      }
                      onChange={(
                        e
                      ) =>
                        setUserForm({
                          ...userForm,
                          role:
                            e.target
                              .value,
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
                        Administrator
                      </option>

                    </select>

                  </div>

                </div>

                {!isEditingUser && (
                  <div className="form-field">

                    <label>
                      Temporary Password
                    </label>

                    <input
                      type="password"
                      value={
                        userForm.password
                      }
                      placeholder="Enter temporary password"
                      onChange={(
                        e
                      ) =>
                        setUserForm({
                          ...userForm,
                          password:
                            e.target
                              .value,
                        })
                      }
                      required
                    />

                    <small>
                      Required by
                      Supabase Auth when
                      creating an
                      email/password
                      account.
                    </small>

                  </div>
                )}

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      loading
                    }
                  >
                    {loading
                      ? "Saving..."
                      : isEditingUser
                      ? "Update User"
                      : "Create User"}
                  </button>

                  {isEditingUser && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        resetUserForm
                      }
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>

            </div>

          </section>
        )}

        {/* ===================================================
            USER LIST
        ==================================================== */}

        {activeTab ===
          "user-list" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  User List
                </h3>

                <p>
                  Manage registered
                  portal accounts.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  resetUserForm();
                  setActiveTab(
                    "users"
                  );
                }}
              >
                + Add User
              </button>

            </div>

            <div className="table-card">

              <div className="table-toolbar">

                <div className="table-title">

                  <strong>
                    All Users
                  </strong>

                  <span>
                    {
                      filteredUsers.length
                    }{" "}
                    records
                  </span>

                </div>

                <div className="table-filters">

                  <input
                    type="search"
                    placeholder="Search email..."
                    value={
                      userSearch
                    }
                    onChange={(
                      e
                    ) =>
                      setUserSearch(
                        e.target
                          .value
                      )
                    }
                  />

                  <select
                    value={
                      roleFilter
                    }
                    onChange={(
                      e
                    ) =>
                      setRoleFilter(
                        e.target
                          .value
                      )
                    }
                  >

                    <option value="all">
                      All Roles
                    </option>

                    <option value="admin">
                      Administrator
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

              </div>

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>
                        Email
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        Account ID
                      </th>

                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredUsers.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="empty-table"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(
                        (user) => (
                          <tr
                            key={
                              user.id
                            }
                          >

                            <td>
                              <strong className="email-cell">
                                {
                                  user.email
                                }
                              </strong>
                            </td>

                            <td>
                              <span
                                className={`role-badge ${user.role}`}
                              >
                                {user.role ===
                                "librarystaff"
                                  ? "Library Staff"
                                  : user.role ===
                                    "avrstaff"
                                  ? "AVR Staff"
                                  : user.role ===
                                    "faculty"
                                  ? "Faculty"
                                  : "Administrator"}
                              </span>
                            </td>

                            <td>
                              <span className="id-cell">
                                {
                                  user.id
                                }
                              </span>
                            </td>

                            <td>

                              <div className="action-group">

                                {user.role ===
                                "admin" ? (
                                  <span className="protected-account">
                                    Protected
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="table-edit"
                                      onClick={() =>
                                        handleEditUser(
                                          user
                                        )
                                      }
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      className="table-delete"
                                      onClick={() =>
                                        handleDeleteUser(
                                          user
                                        )
                                      }
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}

                              </div>

                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            REQUEST RECORDS
        ==================================================== */}

        {activeTab ===
          "requests" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  Request Records
                </h3>

                <p>
                  All library service
                  requests including
                  completed records.
                </p>
              </div>

              <button
                type="button"
                className="outline-button"
                onClick={fetchRequests}
                disabled={loading}
              >
                ↻ Refresh Records
              </button>

            </div>

            {/* REQUEST STATISTICS */}

            <div className="request-stat-grid">

              <div className="request-stat">
                <span>
                  Total Requests
                </span>

                <strong>
                  {
                    requestAnalytics.total
                  }
                </strong>
              </div>

              <div className="request-stat">
                <span>
                  Pending
                </span>

                <strong>
                  {
                    requestAnalytics.pending
                  }
                </strong>
              </div>

              <div className="request-stat">
                <span>
                  Assigned
                </span>

                <strong>
                  {
                    requestAnalytics.assigned
                  }
                </strong>
              </div>

              <div className="request-stat">
                <span>
                  Completed
                </span>

                <strong>
                  {
                    requestAnalytics.completed
                  }
                </strong>
              </div>

              <div className="request-stat">
                <span>
                  Cancelled
                </span>

                <strong>
                  {
                    requestAnalytics.cancelled
                  }
                </strong>
              </div>

              <div className="request-stat">
                <span>
                  Library
                </span>

                <strong>
                  {
                    requestAnalytics.library
                  }
                </strong>
              </div>

            </div>

            <div className="table-card">

              <div className="table-toolbar">

                <div className="table-title">

                  <strong>
                    Request History
                  </strong>

                  <span>
                    {
                      filteredRequests.length
                    }{" "}
                    records
                  </span>

                </div>

                <div className="table-filters request-filters">

                  <input
                    type="search"
                    placeholder="Search requester..."
                    value={
                      requestSearch
                    }
                    onChange={(
                      e
                    ) =>
                      setRequestSearch(
                        e.target
                          .value
                      )
                    }
                  />

                  <select
                    value={
                      requestTypeFilter
                    }
                    onChange={(
                      e
                    ) =>
                      setRequestTypeFilter(
                        e.target
                          .value
                      )
                    }
                  >

                    <option value="all">
                      All Types
                    </option>

                    <option value="library">
                      Library
                    </option>

                    <option value="avr technical">
                      AVR Technical
                    </option>

                  </select>

                  <select
                    value={
                      requestStatusFilter
                    }
                    onChange={(
                      e
                    ) =>
                      setRequestStatusFilter(
                        e.target
                          .value
                      )
                    }
                  >

                    <option value="all">
                      All Status
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Assigned">
                      Assigned
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>

              </div>

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>

                    <tr>

                      <th>
                        Requester
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Date Requested
                      </th>

                      <th>
                        Request Type
                      </th>

                      <th>
                        Details
                      </th>

                      <th>
                        Assigned Staff
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredRequests.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="empty-table"
                        >
                          No request
                          records found.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map(
                        (
                          request
                        ) => (
                          <tr
                            key={
                              request.id
                            }
                          >

                            {/* REQUESTER NAME */}

                            <td>
                              <strong>
                                {
                                  request.requester_name ||
                                  "—"
                                }
                              </strong>
                            </td>

                            {/* EMAIL */}

                            <td>
                              <strong className="email-cell">
                                {
                                  request.requester_email ||
                                  "—"
                                }
                              </strong>
                            </td>

                            {/* DATE */}

                            <td>
                              {formatDateTime(
                                request.request_date ||
                                  request.created_at
                              )}
                            </td>

                            {/* REQUEST TYPE */}

                            <td>
                              <span className="request-type">
                                {formatRequestType(
                                  request.request_type
                                )}
                              </span>
                            </td>

                            {/* DETAILS */}

                            <td>
                              <span
                                title={
                                  request.details ||
                                  ""
                                }
                              >
                                {request.details
                                  ? request.details
                                      .length >
                                    60
                                    ? `${request.details.substring(
                                        0,
                                        60
                                      )}...`
                                    : request.details
                                  : "—"}
                              </span>
                            </td>

                            {/* ASSIGNED STAFF */}

                            <td>
                              {
                                request.assigned_staff_id ||
                                "Unassigned"
                              }
                            </td>

                            {/* STATUS */}

                            <td>
                              <span
                                className={`status-badge ${request.status
                                  ?.toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  )}`}
                              >
                                {formatStatus(
                                  request.status
                                )}
                              </span>
                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            ACTIVITIES
        ==================================================== */}

        {activeTab ===
          "activities" && (
          <section className="page-section">

            <div className="page-heading">
              <div>
                <h3>
                  Activities & Campus News
                </h3>

                <p>
                  Publish activities and
                  news to the public
                  portal.
                </p>
              </div>
            </div>

            <div className="form-card">

              <form
                onSubmit={
                  handleSaveActivity
                }
                className="admin-form"
              >

                <div className="form-field">

                  <label>
                    Activity Title
                  </label>

                  <input
                    type="text"
                    value={
                      activityForm.title
                    }
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        title:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Date
                  </label>

                  <input
                    type="text"
                    placeholder="11 August 2026"
                    value={
                      activityForm.date
                    }
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        date:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setActivityFile(
                        e.target
                          .files[0] ||
                          null
                      )
                    }
                  />

                </div>

                <div className="form-field">

                  <label>
                    Image URL
                  </label>

                  <input
                    type="text"
                    value={
                      activityForm.image
                    }
                    placeholder="Optional image URL"
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        image:
                          e.target.value,
                      })
                    }
                  />

                </div>

                <div className="form-field">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows="5"
                    value={
                      activityForm.description
                    }
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        description:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Publishing..."
                    : "Publish Activity"}
                </button>

              </form>

            </div>

            <div className="content-list-section">

              <div className="list-header">

                <h4>
                  Posted Activities
                </h4>

                <span>
                  {
                    activities.length
                  }
                </span>

              </div>

              {activities.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="content-list-item"
                  >

                    {item.image && (
                      <img
                        src={
                          item.image
                        }
                        alt=""
                      />
                    )}

                    <div className="content-list-info">

                      <strong>
                        {
                          item.title
                        }
                      </strong>

                      <span>
                        {item.date}
                      </span>

                    </div>

                    <button
                      type="button"
                      className="table-delete"
                      onClick={() =>
                        handleDeleteActivity(
                          item.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>
                )
              )}

              {activities.length ===
                0 && (
                <p className="empty-text">
                  No activities posted.
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            ANNOUNCEMENTS
        ==================================================== */}

        {activeTab ===
          "announcements" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  Announcements
                </h3>

                <p>
                  Manage official
                  portal
                  announcements.
                </p>
              </div>

            </div>

            <div className="form-card">

              <form
                onSubmit={
                  handleSaveAnnouncement
                }
                className="admin-form"
              >

                <div className="form-grid">

                  <div className="form-field">

                    <label>
                      Badge
                    </label>

                    <input
                      type="text"
                      value={
                        announcementForm.badge
                      }
                      onChange={(e) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          badge:
                            e.target.value,
                        })
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Date
                    </label>

                    <input
                      type="text"
                      value={
                        announcementForm.date
                      }
                      onChange={(e) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          date:
                            e.target.value,
                        })
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-field">

                  <label>
                    Tag
                  </label>

                  <input
                    type="text"
                    value={
                      announcementForm.tag
                    }
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        tag:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Title
                  </label>

                  <input
                    type="text"
                    value={
                      announcementForm.title
                    }
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        title:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows="5"
                    value={
                      announcementForm.description
                    }
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        description:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    loading
                  }
                >
                  Publish Announcement
                </button>

              </form>

            </div>

            <div className="content-list-section">

              <div className="list-header">

                <h4>
                  Published Announcements
                </h4>

                <span>
                  {
                    announcements.length
                  }
                </span>

              </div>

              {announcements.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="content-list-item"
                  >

                    <div className="content-list-info">

                      <span className="mini-badge">
                        {
                          item.badge
                        }
                      </span>

                      <strong>
                        {
                          item.title
                        }
                      </strong>

                      <span>
                        {item.date} ·{" "}
                        {item.tag}
                      </span>

                    </div>

                    <button
                      type="button"
                      className="table-delete"
                      onClick={() =>
                        handleDeleteAnnouncement(
                          item.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>
                )
              )}

              {announcements.length ===
                0 && (
                <p className="empty-text">
                  No announcements posted.
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            FACILITIES
        ==================================================== */}

        {activeTab ===
          "facilities" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  Facilities
                </h3>

                <p>
                  Manage facilities
                  displayed on the
                  portal.
                </p>
              </div>

            </div>

            <div className="form-card">

              <form
                onSubmit={
                  handleSaveFacility
                }
                className="admin-form"
              >

                <div className="form-field">

                  <label>
                    Facility Title
                  </label>

                  <input
                    type="text"
                    value={
                      facilityForm.title
                    }
                    onChange={(e) =>
                      setFacilityForm({
                        ...facilityForm,
                        title:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Facility Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFacilityFile(
                        e.target
                          .files[0] ||
                          null
                      )
                    }
                  />

                </div>

                <div className="form-field">

                  <label>
                    Image URL
                  </label>

                  <input
                    type="text"
                    value={
                      facilityForm.image
                    }
                    onChange={(e) =>
                      setFacilityForm({
                        ...facilityForm,
                        image:
                          e.target.value,
                      })
                    }
                  />

                </div>

                <div className="form-field">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows="5"
                    value={
                      facilityForm.description
                    }
                    onChange={(e) =>
                      setFacilityForm({
                        ...facilityForm,
                        description:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    loading
                  }
                >
                  Add Facility
                </button>

              </form>

            </div>

            <div className="content-list-section">

              <div className="list-header">

                <h4>
                  Facilities
                </h4>

                <span>
                  {
                    facilities.length
                  }
                </span>

              </div>

              {facilities.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="content-list-item"
                  >

                    {item.image && (
                      <img
                        src={
                          item.image
                        }
                        alt=""
                      />
                    )}

                    <div className="content-list-info">

                      <strong>
                        {
                          item.title
                        }
                      </strong>

                      <span>
                        {item.description?.substring(
                          0,
                          100
                        )}
                      </span>

                    </div>

                    <button
                      type="button"
                      className="table-delete"
                      onClick={() =>
                        handleDeleteFacility(
                          item.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>
                )
              )}

              {facilities.length ===
                0 && (
                <p className="empty-text">
                  No facilities
                  added.
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            STAFF
        ==================================================== */}

        {activeTab ===
          "staff" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  Staff Management
                </h3>

                <p>
                  Manage staff members
                  shown on the
                  portal.
                </p>
              </div>

            </div>

            <div className="form-card">

              <form
                onSubmit={
                  handleSaveStaff
                }
                className="admin-form"
              >

                <div className="form-grid">

                  <div className="form-field">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={
                        staffForm.name
                      }
                      placeholder="Juan Dela Cruz"
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          name:
                            e.target.value,
                        })
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Position
                    </label>

                    <input
                      type="text"
                      value={
                        staffForm.position
                      }
                      placeholder="University Librarian"
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          position:
                            e.target.value,
                        })
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-field">

                  <label>
                    Staff Photo
                  </label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) =>
                      setStaffFile(
                        e.target
                          .files[0] ||
                          null
                      )
                    }
                  />

                </div>

                {staffForm.image &&
                  !staffFile && (
                    <div className="current-image">

                      <span>
                        Current Photo
                      </span>

                      <img
                        src={
                          staffForm.image
                        }
                        alt={
                          staffForm.name
                        }
                      />

                    </div>
                  )}

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      loading
                    }
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
                      onClick={
                        resetStaffForm
                      }
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>

            </div>

            <div className="staff-grid">

              {staff.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="staff-card"
                  >

                    <div className="staff-photo">

                      {item.image ? (
                        <img
                          src={
                            item.image
                          }
                          alt={
                            item.name
                          }
                        />
                      ) : (
                        <span>
                          {item.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase()}
                        </span>
                      )}

                    </div>

                    <div className="staff-info">

                      <strong>
                        {
                          item.name
                        }
                      </strong>

                      <span>
                        {
                          item.position
                        }
                      </span>

                    </div>

                    <div className="action-group">

                      <button
                        type="button"
                        className="table-edit"
                        onClick={() =>
                          handleEditStaff(
                            item
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="table-delete"
                        onClick={() =>
                          handleDeleteStaff(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            VISION
        ==================================================== */}

        {activeTab ===
          "vision" && (
          <section className="page-section">

            <div className="page-heading">

              <div>
                <h3>
                  Vision & Mission
                </h3>

                <p>
                  Update the
                  institution's
                  vision and mission
                  statements.
                </p>
              </div>

            </div>

            <div className="form-card">

              <form
                onSubmit={
                  handleSaveVisionMission
                }
                className="admin-form"
              >

                <div className="form-field">

                  <label>
                    Vision Statement
                  </label>

                  <textarea
                    rows="6"
                    value={
                      visionMission.vision ||
                      ""
                    }
                    onChange={(e) =>
                      setVisionMission({
                        ...visionMission,
                        vision:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Mission Statement
                  </label>

                  <textarea
                    rows="6"
                    value={
                      visionMission.mission ||
                      ""
                    }
                    onChange={(e) =>
                      setVisionMission({
                        ...visionMission,
                        mission:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    loading
                  }
                >
                  Save Changes
                </button>

              </form>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default AdminControl;