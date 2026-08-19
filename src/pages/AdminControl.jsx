import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./AdminControl.css";

function AdminControl() {
  const navigate = useNavigate();

  /* =========================================================
     GENERAL
  ========================================================= */

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const messageTimerRef = useRef(null);

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
  const [requestStatusFilter, setRequestStatusFilter] =
    useState("all");

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
     CLEANUP MESSAGE TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  /* =========================================================
     TAB DATA LOADING
  ========================================================= */

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchUsers();
      fetchRequests();
      fetchActivities();
      fetchAnnouncements();
      fetchFacilities();
      fetchStaff();
    }

    if (
      activeTab === "users" ||
      activeTab === "user-list"
    ) {
      fetchUsers();
    }

    if (activeTab === "requests") {
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
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    setMessage({
      text,
      type,
    });

    messageTimerRef.current = setTimeout(() => {
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
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/login");
    }
  };

  /* =========================================================
     USERS
  ========================================================= */

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role")
        .order("email", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Fetch users error:", error);

      showMessage(
        error?.message || "Unable to load users.",
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

  const handleUserInputChange = (field, value) => {
    setUserForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     CREATE / UPDATE USER
     
     Authentication operations are performed through
     the manage-user Edge Function.
  ========================================================= */

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const email = userForm.email
        .trim()
        .toLowerCase();

      const role = userForm.role;

      if (!email) {
        throw new Error(
          "Email address is required."
        );
      }

      const allowedRoles = [
        "librarystaff",
        "avrstaff",
        "faculty",
      ];

      if (!allowedRoles.includes(role)) {
        throw new Error(
          "Please select a valid user role."
        );
      }

      /* =====================================================
         UPDATE EXISTING USER
      ===================================================== */

      if (isEditingUser) {
        const existingUser = users.find(
          (user) => user.id === userForm.id
        );

        if (!existingUser) {
          throw new Error(
            "The selected user could not be found."
          );
        }

        if (existingUser.role === "admin") {
          throw new Error(
            "Administrator accounts cannot be edited."
          );
        }

        const { data, error } =
          await supabase.functions.invoke(
            "smooth-function",
            {
              body: {
                action: "update",
                userId: userForm.id,
                email,
                role,
              },
            }
          );

        if (error) {
          throw error;
        }

        if (!data?.success) {
          throw new Error(
            data?.error ||
              "Unable to update the user account."
          );
        }

        showMessage(
          "User account updated successfully."
        );

        resetUserForm();

        await fetchUsers();

        setActiveTab("user-list");

        return;
      }

      /* =====================================================
         CREATE NEW USER
      ===================================================== */

      const password = userForm.password;

      if (!password) {
        throw new Error(
          "An initial password is required."
        );
      }

      if (password.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      const { data, error } =
        await supabase.functions.invoke(
          "smooth-function",
          {
            body: {
              action: "create",
              email,
              password,
              role,
            },
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Unable to create the user account."
        );
      }

      showMessage(
        "User account created successfully."
      );

      resetUserForm();

      await fetchUsers();

      setActiveTab("user-list");
    } catch (error) {
      console.error(
        "User save error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to save user account.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     EDIT USER
  ========================================================= */

  const handleEditUser = (user) => {
    if (!user) {
      return;
    }

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

  /* =========================================================
     DELETE USER
  ========================================================= */

  const handleDeleteUser = async (user) => {
    if (!user) {
      return;
    }

    if (user.role === "admin") {
      showMessage(
        "Administrator accounts cannot be deleted.",
        "error"
      );

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.email}?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "smooth-function",
          {
            body: {
              action: "delete",
              userId: user.id,
            },
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Unable to delete the user account."
        );
      }

      showMessage(
        "User account deleted successfully."
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to delete user account.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const search = userSearch
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const email =
        user.email?.toLowerCase() || "";

      const matchesSearch =
        !search ||
        email.includes(search);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [
    users,
    userSearch,
    roleFilter,
  ]);

  /* =========================================================
     REQUEST TYPE MATCHING
     
     IMPORTANT:
     This is declared BEFORE filteredRequests because
     filteredRequests uses this function.
  ========================================================= */

  const requestTypeMatches = (
    type,
    filter
  ) => {
    if (filter === "library") {
      return type.includes("library");
    }

    if (filter === "avr") {
      return (
        type.includes("avr") ||
        type.includes("technical assistance") ||
        type.includes("technical")
      );
    }

    return true;
  };

  /* =========================================================
     REQUEST RECORDS
  ========================================================= */

  const fetchRequests = async () => {
    try {
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
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error(
        "Fetch library requests error:",
        error
      );

      setRequests([]);

      showMessage(
        error?.message ||
          "Unable to load library request records.",
        "error"
      );
    }
  };

  /* =========================================================
     REQUEST FILTERING
  ========================================================= */

  const filteredRequests = useMemo(() => {
    const search = requestSearch
      .trim()
      .toLowerCase();

    return requests.filter((request) => {
      const requesterName =
        request.requester_name
          ?.toLowerCase() || "";

      const requesterEmail =
        request.requester_email
          ?.toLowerCase() || "";

      const assignedStaff =
        String(
          request.assigned_staff_id || ""
        ).toLowerCase();

      const requestDetails =
        request.details
          ?.toLowerCase() || "";

      const requestType =
        request.request_type
          ?.toLowerCase()
          .trim() || "";

      const requestStatus =
        request.status
          ?.toLowerCase()
          .trim() || "";

      const matchesSearch =
        !search ||
        requesterName.includes(search) ||
        requesterEmail.includes(search) ||
        assignedStaff.includes(search) ||
        requestDetails.includes(search) ||
        requestType.includes(search);

      const matchesType =
        requestTypeFilter === "all" ||
        requestTypeMatches(
          requestType,
          requestTypeFilter
        );

      const matchesStatus =
        requestStatusFilter === "all" ||
        requestStatus ===
          requestStatusFilter
            .toLowerCase()
            .trim();

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
    const normalize = (value) =>
      value
        ?.toLowerCase()
        .trim() || "";

    const total = requests.length;

    const pending = requests.filter(
      (item) =>
        normalize(item.status) ===
        "pending"
    ).length;

    const assigned = requests.filter(
      (item) =>
        normalize(item.status) ===
        "assigned"
    ).length;

    const accepted = requests.filter(
      (item) =>
        normalize(item.status) ===
        "accepted"
    ).length;

    const completed = requests.filter(
      (item) =>
        normalize(item.status) ===
        "completed"
    ).length;

    const cancelled = requests.filter(
      (item) =>
        normalize(item.status) ===
        "cancelled"
    ).length;

    const notAvailable = requests.filter(
      (item) =>
        normalize(item.status) ===
        "not available"
    ).length;

    const library = requests.filter(
      (item) =>
        normalize(
          item.request_type
        ).includes("library")
    ).length;

    const avr = requests.filter(
      (item) => {
        const type = normalize(
          item.request_type
        );

        return (
          type.includes("avr") ||
          type.includes("technical")
        );
      }
    ).length;

    return {
      total,
      pending,
      assigned,
      accepted,
      completed,
      cancelled,
      notAvailable,
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
    if (!file) {
      return null;
    }

    const fileExt =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;

    const { error: uploadError } =
      await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return data?.publicUrl || null;
  };

  /* =========================================================
     ACTIVITIES
  ========================================================= */

  const fetchActivities = async () => {
    try {
      const { data, error } =
        await supabase
          .from("activities")
          .select("*")
          .order("id", {
            ascending: false,
          });

      if (error) {
        throw error;
      }

      setActivities(data || []);
    } catch (error) {
      console.error(
        "Fetch activities error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to load activities.",
        "error"
      );
    }
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      let imageUrl =
        activityForm.image.trim();

      if (activityFile) {
        imageUrl =
          await uploadImageFile(
            activityFile
          );
      }

      const title =
        activityForm.title.trim();

      const date =
        activityForm.date.trim();

      const description =
        activityForm.description.trim();

      if (!title) {
        throw new Error(
          "Activity title is required."
        );
      }

      if (!date) {
        throw new Error(
          "Activity date is required."
        );
      }

      if (!description) {
        throw new Error(
          "Activity description is required."
        );
      }

      const { error } =
        await supabase
          .from("activities")
          .insert([
            {
              title,
              date,
              description,
              image: imageUrl || null,
            },
          ]);

      if (error) {
        throw error;
      }

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
      console.error(
        "Save activity error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to publish activity.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (
    id
  ) => {
    if (!id) {
      return;
    }

    if (
      !window.confirm(
        "Remove this activity?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase
          .from("activities")
          .delete()
          .eq("id", id);

      if (error) {
        throw error;
      }

      showMessage(
        "Activity removed."
      );

      await fetchActivities();
    } catch (error) {
      console.error(
        "Delete activity error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to remove activity.",
        "error"
      );
    } finally {
      setLoading(false);
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

      if (error) {
        throw error;
      }

      setAnnouncements(data || []);
    } catch (error) {
      console.error(
        "Fetch announcements error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to load announcements.",
        "error"
      );
    }
  };

  const handleSaveAnnouncement =
    async (e) => {
      e.preventDefault();

      if (loading) {
        return;
      }

      setLoading(true);

      try {
        const payload = {
          badge:
            announcementForm.badge.trim(),
          date:
            announcementForm.date.trim(),
          tag:
            announcementForm.tag.trim(),
          title:
            announcementForm.title.trim(),
          description:
            announcementForm.description.trim(),
        };

        if (
          !payload.badge ||
          !payload.date ||
          !payload.tag ||
          !payload.title ||
          !payload.description
        ) {
          throw new Error(
            "Please complete all announcement fields."
          );
        }

        const { error } =
          await supabase
            .from("announcements")
            .insert([payload]);

        if (error) {
          throw error;
        }

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
        console.error(
          "Save announcement error:",
          error
        );

        showMessage(
          error?.message ||
            "Unable to publish announcement.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleDeleteAnnouncement =
    async (id) => {
      if (!id) {
        return;
      }

      if (
        !window.confirm(
          "Remove this announcement?"
        )
      ) {
        return;
      }

      setLoading(true);

      try {
        const { error } =
          await supabase
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) {
          throw error;
        }

        showMessage(
          "Announcement removed."
        );

        await fetchAnnouncements();
      } catch (error) {
        console.error(
          "Delete announcement error:",
          error
        );

        showMessage(
          error?.message ||
            "Unable to remove announcement.",
          "error"
        );
      } finally {
        setLoading(false);
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

      if (error) {
        throw error;
      }

      setFacilities(data || []);
    } catch (error) {
      console.error(
        "Fetch facilities error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to load facilities.",
        "error"
      );
    }
  };

  const handleSaveFacility = async (
    e
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      let imageUrl =
        facilityForm.image.trim();

      if (facilityFile) {
        imageUrl =
          await uploadImageFile(
            facilityFile
          );
      }

      const title =
        facilityForm.title.trim();

      const description =
        facilityForm.description.trim();

      if (!title) {
        throw new Error(
          "Facility title is required."
        );
      }

      if (!description) {
        throw new Error(
          "Facility description is required."
        );
      }

      const { error } =
        await supabase
          .from("facilities")
          .insert([
            {
              title,
              description,
              image: imageUrl || null,
            },
          ]);

      if (error) {
        throw error;
      }

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
      console.error(
        "Save facility error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to add facility.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFacility =
    async (id) => {
      if (!id) {
        return;
      }

      if (
        !window.confirm(
          "Remove this facility?"
        )
      ) {
        return;
      }

      setLoading(true);

      try {
        const { error } =
          await supabase
            .from("facilities")
            .delete()
            .eq("id", id);

        if (error) {
          throw error;
        }

        showMessage(
          "Facility removed."
        );

        await fetchFacilities();
      } catch (error) {
        console.error(
          "Delete facility error:",
          error
        );

        showMessage(
          error?.message ||
            "Unable to remove facility.",
          "error"
        );
      } finally {
        setLoading(false);
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

      if (error) {
        throw error;
      }

      setStaff(data || []);
    } catch (error) {
      console.error(
        "Fetch staff error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to load staff.",
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

  const handleSaveStaff = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      let imageUrl =
        staffForm.image.trim();

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
        image: imageUrl || null,
      };

      if (!staffData.name) {
        throw new Error(
          "Staff name is required."
        );
      }

      if (!staffData.position) {
        throw new Error(
          "Staff position is required."
        );
      }

      if (isEditingStaff) {
        const { error } =
          await supabase
            .from("staff")
            .update(staffData)
            .eq(
              "id",
              staffForm.id
            );

        if (error) {
          throw error;
        }

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

        if (error) {
          throw error;
        }

        showMessage(
          "Staff member added."
        );
      }

      resetStaffForm();

      await fetchStaff();
    } catch (error) {
      console.error(
        "Save staff error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to save staff information.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = (item) => {
    if (!item) {
      return;
    }

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

  const handleDeleteStaff = async (
    id
  ) => {
    if (!id) {
      return;
    }

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

      if (error) {
        throw error;
      }

      showMessage(
        "Staff member removed."
      );

      await fetchStaff();
    } catch (error) {
      console.error(
        "Delete staff error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to remove staff member.",
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

        if (error) {
          throw error;
        }

        if (data) {
          setVisionMission(data);
        }
      } catch (error) {
        console.error(
          "Fetch vision mission error:",
          error
        );

        showMessage(
          error?.message ||
            "Unable to load Vision and Mission.",
          "error"
        );
      }
    };

  const handleSaveVisionMission =
    async (e) => {
      e.preventDefault();

      if (loading) {
        return;
      }

      setLoading(true);

      try {
        const vision =
          visionMission.vision.trim();

        const mission =
          visionMission.mission.trim();

        if (!vision) {
          throw new Error(
            "Vision statement is required."
          );
        }

        if (!mission) {
          throw new Error(
            "Mission statement is required."
          );
        }

        const payload = {
          vision,
          mission,
        };

        if (visionMission.id) {
          payload.id =
            visionMission.id;
        }

        const { error } =
          await supabase
            .from("vision_mission")
            .upsert([payload]);

        if (error) {
          throw error;
        }

        showMessage(
          "Vision and Mission updated successfully."
        );

        await fetchVisionMission();
      } catch (error) {
        console.error(
          "Save vision mission error:",
          error
        );

        showMessage(
          error?.message ||
            "Unable to save Vision and Mission.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const dashboardStats = useMemo(() => {
    return {
      users: users.length,
      requests: requests.length,
      activities: activities.length,
      announcements:
        announcements.length,
      facilities: facilities.length,
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
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

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
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

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
    if (!type) {
      return "—";
    }

    return type
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return status
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "librarystaff":
        return "Library Staff";

      case "avrstaff":
        return "AVR Staff";

      case "faculty":
        return "Faculty";

      case "admin":
        return "Administrator";

      default:
        return role || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    return (
      status
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-") || "pending"
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

          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activeTab === item.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </button>
          ))}

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
            onClick={handleLogout}
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
              {navItems.find(
                (item) =>
                  item.id === activeTab
              )?.label || "Dashboard"}
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
            role="alert"
          >
            {message.text}
          </div>
        )}

        {/* ===================================================
            DASHBOARD
        ==================================================== */}

        {activeTab === "dashboard" && (
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
                  {dashboardStats.users}
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
                  {dashboardStats.requests}
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
                  {requestAnalytics.pending}
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
                  {requestAnalytics.completed}
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
                    {requestAnalytics.library}
                  </strong>

                </div>

                <div className="analytics-row">

                  <span>
                    AVR / Technical
                  </span>

                  <strong>
                    {requestAnalytics.avr}
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
                    {requestAnalytics.pending}
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Assigned
                  </span>

                  <strong>
                    {requestAnalytics.assigned}
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Accepted
                  </span>

                  <strong>
                    {requestAnalytics.accepted}
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Completed
                  </span>

                  <strong>
                    {requestAnalytics.completed}
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Cancelled
                  </span>

                  <strong>
                    {requestAnalytics.cancelled}
                  </strong>
                </div>

                <div className="analytics-row">
                  <span>
                    Not Available
                  </span>

                  <strong>
                    {requestAnalytics.notAvailable}
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
                    {dashboardStats.activities}
                  </strong>

                </div>

                <div className="content-stat">

                  <span>
                    Announcements
                  </span>

                  <strong>
                    {dashboardStats.announcements}
                  </strong>

                </div>

                <div className="content-stat">

                  <span>
                    Facilities
                  </span>

                  <strong>
                    {dashboardStats.facilities}
                  </strong>

                </div>

                <div className="content-stat">

                  <span>
                    Staff
                  </span>

                  <strong>
                    {dashboardStats.staff}
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

                {requests.length === 0 ? (
                  <p className="empty-text">
                    No request records found.
                  </p>
                ) : (
                  <div className="recent-list">

                    {requests
                      .slice(0, 5)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="recent-item"
                        >

                          <div>

                            <strong>
                              {request.requester_name ||
                                request.requester_email ||
                                "Unknown requester"}
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
                              className={`status-badge ${getStatusClass(
                                request.status
                              )}`}
                            >
                              {formatStatus(
                                request.status
                              )}
                            </span>

                          </div>

                        </div>
                      ))}

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            USER MANAGEMENT
        ==================================================== */}

        {activeTab === "users" && (
          <section className="page-section">

            <div className="page-heading">

              <div>

                <h3>
                  User Management
                </h3>

                <p>
                  Create and manage
                  portal user accounts.
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
                      ? "Edit User Account"
                      : "Create New User"}
                  </h4>

                </div>

              </div>

              <form
                onSubmit={handleSaveUser}
                className="admin-form"
              >

                <div className="form-grid">

                  <div className="form-field">

                    <label htmlFor="user-email">
                      Email Address
                    </label>

                    <input
                      id="user-email"
                      type="email"
                      value={userForm.email}
                      placeholder="user@example.com"
                      autoComplete="email"
                      onChange={(e) =>
                        handleUserInputChange(
                          "email",
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label htmlFor="user-role">
                      Role
                    </label>

                    <select
                      id="user-role"
                      value={userForm.role}
                      onChange={(e) =>
                        handleUserInputChange(
                          "role",
                          e.target.value
                        )
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

                    </select>

                  </div>

                </div>

                {!isEditingUser && (
                  <div className="form-field">

                    <label htmlFor="user-password">
                      Initial Password
                    </label>

                    <input
                      id="user-password"
                      type="password"
                      value={userForm.password}
                      placeholder="Enter initial password"
                      autoComplete="new-password"
                      minLength={6}
                      onChange={(e) =>
                        handleUserInputChange(
                          "password",
                          e.target.value
                        )
                      }
                      required
                    />

                    <small>
                      Minimum 6 characters.
                      The user can change
                      this password after
                      signing in.
                    </small>

                  </div>
                )}

                {isEditingUser && (
                  <div className="form-field">

                    <small>
                      Changing the email
                      address updates both
                      the Supabase Auth
                      account and the
                      portal profile.
                    </small>

                  </div>
                )}

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
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
                      disabled={loading}
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

        {activeTab === "user-list" && (
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
                    {filteredUsers.length}{" "}
                    records
                  </span>

                </div>

                <div className="table-filters">

                  <input
                    type="search"
                    placeholder="Search email..."
                    value={userSearch}
                    onChange={(e) =>
                      setUserSearch(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="all">
                      All Roles
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

                    <option value="admin">
                      Administrator
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

                    {filteredUsers.length === 0 ? (
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
                            key={user.id}
                          >

                            <td>
                              <strong className="email-cell">
                                {user.email}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={`role-badge ${user.role}`}
                              >
                                {getRoleLabel(
                                  user.role
                                )}
                              </span>
                            </td>

                            <td>
                              <span className="id-cell">
                                {user.id}
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
                                      disabled={
                                        loading
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
                                      disabled={
                                        loading
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

        {activeTab === "requests" && (
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

            <div className="request-stat-grid">

              <div className="request-stat">

                <span>
                  Total Requests
                </span>

                <strong>
                  {requestAnalytics.total}
                </strong>

              </div>

              <div className="request-stat">

                <span>
                  Pending
                </span>

                <strong>
                  {requestAnalytics.pending}
                </strong>

              </div>

              <div className="request-stat">

                <span>
                  Assigned
                </span>

                <strong>
                  {requestAnalytics.assigned}
                </strong>

              </div>

              <div className="request-stat">

                <span>
                  Completed
                </span>

                <strong>
                  {requestAnalytics.completed}
                </strong>

              </div>

              <div className="request-stat">

                <span>
                  Cancelled
                </span>

                <strong>
                  {requestAnalytics.cancelled}
                </strong>

              </div>

              <div className="request-stat">

                <span>
                  Library
                </span>

                <strong>
                  {requestAnalytics.library}
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
                    {filteredRequests.length}{" "}
                    records
                  </span>

                </div>

                <div className="table-filters request-filters">

                  <input
                    type="search"
                    placeholder="Search requester..."
                    value={requestSearch}
                    onChange={(e) =>
                      setRequestSearch(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={
                      requestTypeFilter
                    }
                    onChange={(e) =>
                      setRequestTypeFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="all">
                      All Types
                    </option>

                    <option value="library">
                      Library
                    </option>

                    <option value="avr">
                      AVR / Technical
                    </option>

                  </select>

                  <select
                    value={
                      requestStatusFilter
                    }
                    onChange={(e) =>
                      setRequestStatusFilter(
                        e.target.value
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

                    <option value="Accepted">
                      Accepted
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                    <option value="Not Available">
                      Not Available
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
                        (request) => (
                          <tr
                            key={
                              request.id
                            }
                          >

                            <td>

                              <strong>
                                {
                                  request.requester_name ||
                                  "—"
                                }
                              </strong>

                            </td>

                            <td>

                              <strong className="email-cell">
                                {
                                  request.requester_email ||
                                  "—"
                                }
                              </strong>

                            </td>

                            <td>

                              {formatDateTime(
                                request.request_date ||
                                  request.created_at
                              )}

                            </td>

                            <td>

                              <span className="request-type">
                                {formatRequestType(
                                  request.request_type
                                )}
                              </span>

                            </td>

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

                            <td>

                              {request.assigned_staff_id ||
                                "Unassigned"}

                            </td>

                            <td>

                              <span
                                className={`status-badge ${getStatusClass(
                                  request.status
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

        {activeTab === "activities" && (
          <section className="page-section">

            <div className="page-heading">

              <div>

                <h3>
                  Activities & Campus News
                </h3>

                <p>
                  Publish activities
                  and news to the
                  public portal.
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
                      setActivityForm(
                        (previous) => ({
                          ...previous,
                          title:
                            e.target
                              .value,
                        })
                      )
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
                      setActivityForm(
                        (previous) => ({
                          ...previous,
                          date:
                            e.target
                              .value,
                        })
                      )
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
                          .files?.[0] ||
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
                    type="url"
                    value={
                      activityForm.image
                    }
                    placeholder="Optional image URL"
                    onChange={(e) =>
                      setActivityForm(
                        (previous) => ({
                          ...previous,
                          image:
                            e.target
                              .value,
                        })
                      )
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
                      setActivityForm(
                        (previous) => ({
                          ...previous,
                          description:
                            e.target
                              .value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
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
                  {activities.length}
                </span>

              </div>

              {activities.map((item) => (
                <div
                  key={item.id}
                  className="content-list-item"
                >

                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                    />
                  )}

                  <div className="content-list-info">

                    <strong>
                      {item.title}
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
                    disabled={loading}
                  >
                    Delete
                  </button>

                </div>
              ))}

              {activities.length === 0 && (
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
                  portal announcements.
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
                        setAnnouncementForm(
                          (previous) => ({
                            ...previous,
                            badge:
                              e.target
                                .value,
                          })
                        )
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
                        setAnnouncementForm(
                          (previous) => ({
                            ...previous,
                            date:
                              e.target
                                .value,
                          })
                        )
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
                      setAnnouncementForm(
                        (previous) => ({
                          ...previous,
                          tag:
                            e.target.value,
                        })
                      )
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
                      setAnnouncementForm(
                        (previous) => ({
                          ...previous,
                          title:
                            e.target.value,
                        })
                      )
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
                      setAnnouncementForm(
                        (previous) => ({
                          ...previous,
                          description:
                            e.target
                              .value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Publishing..."
                    : "Publish Announcement"}
                </button>

              </form>

            </div>

            <div className="content-list-section">

              <div className="list-header">

                <h4>
                  Published Announcements
                </h4>

                <span>
                  {announcements.length}
                </span>

              </div>

              {announcements.map(
                (item) => (
                  <div
                    key={item.id}
                    className="content-list-item"
                  >

                    <div className="content-list-info">

                      <span className="mini-badge">
                        {item.badge}
                      </span>

                      <strong>
                        {item.title}
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
                      disabled={loading}
                    >
                      Delete
                    </button>

                  </div>
                )
              )}

              {announcements.length ===
                0 && (
                <p className="empty-text">
                  No announcements
                  posted.
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            FACILITIES
        ==================================================== */}

        {activeTab === "facilities" && (
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
                      setFacilityForm(
                        (previous) => ({
                          ...previous,
                          title:
                            e.target
                              .value,
                        })
                      )
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
                          .files?.[0] ||
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
                    type="url"
                    value={
                      facilityForm.image
                    }
                    onChange={(e) =>
                      setFacilityForm(
                        (previous) => ({
                          ...previous,
                          image:
                            e.target
                              .value,
                        })
                      )
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
                      setFacilityForm(
                        (previous) => ({
                          ...previous,
                          description:
                            e.target
                              .value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : "Add Facility"}
                </button>

              </form>

            </div>

            <div className="content-list-section">

              <div className="list-header">

                <h4>
                  Facilities
                </h4>

                <span>
                  {facilities.length}
                </span>

              </div>

              {facilities.map((item) => (
                <div
                  key={item.id}
                  className="content-list-item"
                >

                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                    />
                  )}

                  <div className="content-list-info">

                    <strong>
                      {item.title}
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
                    disabled={loading}
                  >
                    Delete
                  </button>

                </div>
              ))}

              {facilities.length === 0 && (
                <p className="empty-text">
                  No facilities added.
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            STAFF
        ==================================================== */}

        {activeTab === "staff" && (
          <section className="page-section">

            <div className="page-heading">

              <div>

                <h3>
                  Staff Management
                </h3>

                <p>
                  Manage staff members
                  shown on the portal.
                </p>

              </div>

            </div>

            <div className="form-card">

              <form
                onSubmit={handleSaveStaff}
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
                        setStaffForm(
                          (previous) => ({
                            ...previous,
                            name:
                              e.target
                                .value,
                          })
                        )
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
                        setStaffForm(
                          (previous) => ({
                            ...previous,
                            position:
                              e.target
                                .value,
                          })
                        )
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
                          .files?.[0] ||
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
                      onClick={
                        resetStaffForm
                      }
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>

            </div>

            <div className="staff-grid">

              {staff.map((item) => (
                <div
                  key={item.id}
                  className="staff-card"
                >

                  <div className="staff-photo">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <span>
                        {item.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                  </div>

                  <div className="staff-info">

                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      {item.position}
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
                      disabled={loading}
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
                      disabled={loading}
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

              {staff.length === 0 && (
                <p className="empty-text">
                  No staff members found.
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            VISION & MISSION
        ==================================================== */}

        {activeTab === "vision" && (
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
                      setVisionMission(
                        (previous) => ({
                          ...previous,
                          vision:
                            e.target
                              .value,
                        })
                      )
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
                      setVisionMission(
                        (previous) => ({
                          ...previous,
                          mission:
                            e.target
                              .value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : "Save Changes"}
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