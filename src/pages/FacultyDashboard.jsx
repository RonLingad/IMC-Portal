import { useEffect, useState } from "react";
import {
  BookOpen,
  MonitorPlay,
  Wrench,
  LogOut,
  Clock3,
  CheckCircle2,
  XCircle,
  Send,
  User,
  X,
  AlertCircle,
  CalendarDays,
  MapPin,
  Flag,
  Trash2,
  History,
} from "lucide-react";

import { supabase } from "../services/supabase";
import "./FacultyDashboard.css";

function FacultyDashboard() {
  const [activeSection, setActiveSection] = useState("request");
  const [activeTab, setActiveTab] = useState("library");

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    department: "",

    requestItems: [],
    otherRequest: "",

    avrEquipment: [],
    avrService: "",
    otherAVRService: "",
    venue: "",

    dateNeeded: "",
    timeNeeded: "",
    duration: "",

    priority: "",

    details: "",
  });

  /* =====================================================
     NOTIFICATION
  ===================================================== */

  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message,
    });

    window.setTimeout(() => {
      setNotification((current) => ({
        ...current,
        show: false,
      }));
    }, 4500);
  };

  const closeNotification = () => {
    setNotification((current) => ({
      ...current,
      show: false,
    }));
  };

  /* =====================================================
     LOAD REQUESTS
  ===================================================== */

  const loadRequests = async (email) => {
    setLoadingRequests(true);

    try {
      if (!email) {
        setRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from("library_requests")
        .select("*")
        .eq("requester_email", email)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error("Request loading error:", error);

      showNotification(
        "error",
        "Unable to load requests",
        error.message || "Please try again."
      );

      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  /* =====================================================
     AUTH
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        setLoadingUser(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!mounted) return;

        if (!session?.user) {
          setUser(null);
          setRequests([]);
          setLoadingRequests(false);
          setLoadingUser(false);

          window.location.href = "/login";
          return;
        }

        const currentUser = session.user;

        setUser(currentUser);

        setForm((current) => ({
          ...current,
          email: currentUser.email || "",
          fullName:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            "",
        }));

        await loadRequests(currentUser.email);
      } catch (error) {
        console.error("User initialization error:", error);

        if (!mounted) return;

        setUser(null);
        setRequests([]);
        setLoadingRequests(false);
        setLoadingUser(false);

        showNotification(
          "error",
          "Unable to load account",
          error.message || "Please login again."
        );

        window.setTimeout(() => {
          if (mounted) {
            window.location.href = "/login";
          }
        }, 1000);
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    initializeUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;

      if (!currentUser) {
        setUser(null);
        setRequests([]);

        setForm((current) => ({
          ...current,
          email: "",
          fullName: "",
        }));

        setLoadingRequests(false);

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return;
      }

      setUser(currentUser);

      setForm((current) => ({
        ...current,
        email: currentUser.email || "",
        fullName:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          current.fullName,
      }));

      window.setTimeout(() => {
        if (mounted) {
          loadRequests(currentUser.email);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     FORM
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleLibraryCheckbox = (value) => {
    setForm((current) => {
      const exists = current.requestItems.includes(value);

      return {
        ...current,
        requestItems: exists
          ? current.requestItems.filter(
              (item) => item !== value
            )
          : [...current.requestItems, value],
      };
    });
  };

  const handleAVREquipmentCheckbox = (value) => {
    setForm((current) => {
      const exists = current.avrEquipment.includes(value);

      return {
        ...current,
        avrEquipment: exists
          ? current.avrEquipment.filter(
              (item) => item !== value
            )
          : [...current.avrEquipment, value],
      };
    });
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm = () => {
    if (!form.fullName.trim()) {
      showNotification(
        "error",
        "Name required",
        "Please enter your full name."
      );
      return false;
    }

    if (!form.email.trim()) {
      showNotification(
        "error",
        "Email required",
        "Please enter your email address."
      );
      return false;
    }

    if (!form.department.trim()) {
      showNotification(
        "error",
        "Department required",
        "Please enter your department."
      );
      return false;
    }

    if (activeTab === "library") {
      if (form.requestItems.length === 0) {
        showNotification(
          "error",
          "Select a service",
          "Please select at least one library service."
        );
        return false;
      }

      if (
        form.requestItems.includes("Other") &&
        !form.otherRequest.trim()
      ) {
        showNotification(
          "error",
          "Please specify your request",
          "Please describe your other library request."
        );
        return false;
      }

      if (!form.dateNeeded) {
        showNotification(
          "error",
          "Date required",
          "Please select the date you need the service."
        );
        return false;
      }

      if (!form.timeNeeded) {
        showNotification(
          "error",
          "Time required",
          "Please select the time you need the service."
        );
        return false;
      }

      if (!form.details.trim()) {
        showNotification(
          "error",
          "Details required",
          "Please provide a short description of your request."
        );
        return false;
      }
    }

    if (activeTab === "avr") {
      if (!form.dateNeeded) {
        showNotification(
          "error",
          "Date required",
          "Please select the date needed."
        );
        return false;
      }

      if (!form.timeNeeded) {
        showNotification(
          "error",
          "Time required",
          "Please select the time needed."
        );
        return false;
      }

      if (!form.details.trim()) {
        showNotification(
          "error",
          "Details required",
          "Please provide a short description of your request."
        );
        return false;
      }
    }

    if (activeTab === "technical") {
      if (!form.priority) {
        showNotification(
          "error",
          "Priority required",
          "Please select the priority level."
        );
        return false;
      }

      if (!form.details.trim()) {
        showNotification(
          "error",
          "Problem required",
          "Please describe the technical problem."
        );
        return false;
      }
    }

    return true;
  };

  /* =====================================================
     DATE / TIME
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        showNotification(
          "error",
          "Session expired",
          "Please login again before submitting."
        );

        window.setTimeout(() => {
          window.location.href = "/login";
        }, 1000);

        return;
      }

      const authenticatedUser = session.user;
      const requesterEmail = authenticatedUser.email;

      if (!requesterEmail) {
        throw new Error(
          "Your account does not have an email address."
        );
      }

      let details = "";

      /* ---------------- LIBRARY ---------------- */

      if (activeTab === "library") {
        details = `Department: ${form.department}

Services Requested:
${form.requestItems
  .map((item) => `• ${item}`)
  .join("\n")}`;

        if (
          form.requestItems.includes("Other") &&
          form.otherRequest.trim()
        ) {
          details += `

Other Request:
${form.otherRequest.trim()}`;
        }

        details += `

Date Needed: ${formatDate(form.dateNeeded)}
Time Needed: ${formatTime(form.timeNeeded)}

Description:
${form.details.trim()}`;
      }

      /* ---------------- AVR ---------------- */

      if (activeTab === "avr") {
        details = `Department: ${form.department}`;

        if (form.avrEquipment.length > 0) {
          details += `

Equipment Needed:
${form.avrEquipment
  .map((item) => `• ${item}`)
  .join("\n")}`;
        }

        if (form.avrService) {
          details += `

Service / Venue:
${form.avrService}`;
        }

        if (
          form.avrService === "Other" &&
          form.otherAVRService.trim()
        ) {
          details += `

Other Service / Venue:
${form.otherAVRService.trim()}`;
        }

        if (form.venue.trim()) {
          details += `

Location / Venue Needed:
${form.venue.trim()}`;
        }

        details += `

Date Needed: ${formatDate(form.dateNeeded)}
Time Needed: ${formatTime(form.timeNeeded)}`;

        if (form.duration.trim()) {
          details += `

Duration:
${form.duration.trim()}`;
        }

        details += `

Description:
${form.details.trim()}`;
      }

      /* ---------------- TECHNICAL ---------------- */

      if (activeTab === "technical") {
        details = `Department: ${form.department}

Priority:
${form.priority}

Problem / Description:
${form.details.trim()}`;
      }

      let internalRequestType = "";

      if (activeTab === "library") {
        internalRequestType = "Library Request";
      }

      if (activeTab === "avr") {
        internalRequestType = "AVR Request";
      }

      if (activeTab === "technical") {
        internalRequestType = "Technical Assistance";
      }

      const requestDate =
        activeTab === "technical"
          ? null
          : form.dateNeeded;

      const { data, error } = await supabase
        .from("library_requests")
        .insert({
          requester_name: form.fullName.trim(),
          requester_email: requesterEmail,
          request_type: internalRequestType,
          request_date: requestDate,
          details,
          status: "Pending",
        })
        .select()
        .single();

      if (error) throw error;

      setRequests((current) => [
        data,
        ...current,
      ]);

      showNotification(
        "success",
        "Request submitted",
        "Your request has been submitted successfully."
      );

      resetForm();

      setActiveSection("track");
    } catch (error) {
      console.error(
        "Request submission error:",
        error
      );

      showNotification(
        "error",
        "Unable to submit request",
        error.message || "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     CANCEL
  ===================================================== */

  const handleCancelRequest = async (request) => {
    if (request.status !== "Pending") return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this request?"
    );

    if (!confirmed) return;

    setCancellingId(request.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        showNotification(
          "error",
          "Session expired",
          "Please login again."
        );

        window.setTimeout(() => {
          window.location.href = "/login";
        }, 1000);

        return;
      }

      const userEmail = session.user.email;

      const { data, error } = await supabase
        .from("library_requests")
        .update({
          status: "Cancelled",
        })
        .eq("id", request.id)
        .eq("requester_email", userEmail)
        .select()
        .single();

      if (error) throw error;

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? data
            : item
        )
      );

      showNotification(
        "success",
        "Request cancelled",
        "Your request has been cancelled."
      );
    } catch (error) {
      console.error(
        "Cancel request error:",
        error
      );

      showNotification(
        "error",
        "Unable to cancel request",
        error.message || "Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  /* =====================================================
     RESET
  ===================================================== */

  const resetForm = () => {
    setForm((current) => ({
      ...current,

      fullName:
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        current.fullName ||
        "",

      email:
        user?.email ||
        current.email ||
        "",

      department: "",

      requestItems: [],
      otherRequest: "",

      avrEquipment: [],
      avrService: "",
      otherAVRService: "",
      venue: "",

      dateNeeded: "",
      timeNeeded: "",
      duration: "",

      priority: "",

      details: "",
    }));
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    if (loggingOut) return;

    setShowLogoutModal(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setRequests([]);
      setShowLogoutModal(false);

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setLoggingOut(false);
      setShowLogoutModal(false);

      showNotification(
        "error",
        "Unable to logout",
        error.message || "Please try again."
      );
    }
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const changeSection = (section) => {
    setActiveSection(section);

    if (section === "request") {
      resetForm();
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  /* =====================================================
     HELPERS
  ===================================================== */

  const getStatusClass = (status) => {
    return (status || "Pending")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted":
      case "Completed":
        return <CheckCircle2 size={16} />;

      case "Not Available":
      case "Cancelled":
        return <XCircle size={16} />;

      default:
        return <Clock3 size={16} />;
    }
  };

  const getRequestIcon = (requestType) => {
    if (
      requestType?.toLowerCase().includes("avr")
    ) {
      return <MonitorPlay size={20} />;
    }

    if (
      requestType
        ?.toLowerCase()
        .includes("technical")
    ) {
      return <Wrench size={20} />;
    }

    return <BookOpen size={20} />;
  };

  const getRequestTitle = (request) => {
    if (
      request.request_type ===
      "AVR Request"
    ) {
      return "AVR Request";
    }

    if (
      request.request_type ===
      "Technical Assistance"
    ) {
      return "Technical Assistance";
    }

    return "Library Request";
  };

  /* =====================================================
     REQUEST FILTERS
  ===================================================== */

  const activeRequests = requests.filter(
    (request) =>
      request.status !== "Completed" &&
      request.status !== "Cancelled"
  );

  const historyRequests = requests.filter(
    (request) =>
      request.status === "Completed" ||
      request.status === "Cancelled"
  );

  /* =====================================================
     SCHEDULE
  ===================================================== */

  const renderScheduleFields = () => (
    <div className="faculty-form-row faculty-form-row-three">
      <div className="faculty-form-group">
        <label>
          Date Needed <span>*</span>
        </label>

        <input
          type="date"
          name="dateNeeded"
          value={form.dateNeeded}
          onChange={handleChange}
          required
        />
      </div>

      <div className="faculty-form-group">
        <label>
          Time Needed <span>*</span>
        </label>

        <input
          type="time"
          name="timeNeeded"
          value={form.timeNeeded}
          onChange={handleChange}
          required
        />
      </div>

      <div className="faculty-form-group">
        <label>
          Duration
        </label>

        <input
          type="text"
          name="duration"
          value={form.duration}
          onChange={handleChange}
          placeholder="Example: 2 hours"
        />
      </div>
    </div>
  );

  /* =====================================================
     PERSONAL INFORMATION
  ===================================================== */

  const renderPersonalInformation = () => (
    <>
      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>1</span>

          <div>
            <h3>Your Information</h3>
            <p>
              Confirm your basic information.
            </p>
          </div>
        </div>

        <div className="faculty-form-row">
          <div className="faculty-form-group">
            <label>
              Full Name <span>*</span>
            </label>

            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </div>

          <div className="faculty-form-group">
            <label>
              Email <span>*</span>
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              required
            />
          </div>
        </div>

        <div className="faculty-form-group">
          <label>
            Department <span>*</span>
          </label>

          <input
            type="text"
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="Department"
            required
          />
        </div>
      </div>
    </>
  );

  /* =====================================================
     LIBRARY FORM
  ===================================================== */

  const renderLibraryForm = () => (
    <>
      {renderPersonalInformation()}

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>2</span>

          <div>
            <h3>What do you need?</h3>
            <p>
              Select the library service you need.
            </p>
          </div>
        </div>

        <div className="faculty-check-grid">
          {[
            "Bulk Books",
            "Faculty Spaces",
            "Reserved Internet and Research Section",
            "Library Space",
            "Other",
          ].map((item) => (
            <label
              className={`faculty-check-item ${
                form.requestItems.includes(item)
                  ? "checked"
                  : ""
              }`}
              key={item}
            >
              <input
                type="checkbox"
                checked={form.requestItems.includes(
                  item
                )}
                onChange={() =>
                  handleLibraryCheckbox(item)
                }
              />

              <span>{item}</span>
            </label>
          ))}
        </div>

        {form.requestItems.includes("Other") && (
          <div className="faculty-form-group">
            <label>
              Other Request
            </label>

            <input
              type="text"
              name="otherRequest"
              value={form.otherRequest}
              onChange={handleChange}
              placeholder="Please specify"
            />
          </div>
        )}
      </div>

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>3</span>

          <div>
            <h3>When do you need it?</h3>
            <p>
              Provide the date and time.
            </p>
          </div>
        </div>

        {renderScheduleFields()}

        <div className="faculty-form-group">
          <label>
            Details <span>*</span>
          </label>

          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Briefly describe what you need."
            rows={5}
            required
          />
        </div>
      </div>
    </>
  );

  /* =====================================================
     AVR FORM
  ===================================================== */

  const renderAVRForm = () => (
    <>
      {renderPersonalInformation()}

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>2</span>

          <div>
            <h3>What do you need?</h3>
            <p>
              Select the equipment you need. This is optional.
            </p>
          </div>
        </div>

        <div className="faculty-check-grid">
          {[
            "Microphone",
            "Speaker",
            "Extension Cord",
            "Battery",
            "Laptop",
            "Projector",
            "Other",
          ].map((item) => (
            <label
              className={`faculty-check-item ${
                form.avrEquipment.includes(item)
                  ? "checked"
                  : ""
              }`}
              key={item}
            >
              <input
                type="checkbox"
                checked={form.avrEquipment.includes(
                  item
                )}
                onChange={() =>
                  handleAVREquipmentCheckbox(item)
                }
              />

              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>3</span>

          <div>
            <h3>Service / Venue</h3>
            <p>
              Choose what applies to your request.
            </p>
          </div>
        </div>

        <div className="faculty-choice-grid">
          {[
            "Technical Assistance",
            "SJ Conference Room",
            "AV Room",
            "Other",
          ].map((item) => (
            <label
              className={`faculty-choice-item ${
                form.avrService === item
                  ? "selected"
                  : ""
              }`}
              key={item}
            >
              <input
                type="radio"
                name="avrService"
                value={item}
                checked={
                  form.avrService === item
                }
                onChange={handleChange}
              />

              <span>{item}</span>
            </label>
          ))}
        </div>

        {form.avrService === "Other" && (
          <div className="faculty-form-group">
            <label>
              Other Service / Venue
            </label>

            <input
              type="text"
              name="otherAVRService"
              value={form.otherAVRService}
              onChange={handleChange}
              placeholder="Please specify"
            />
          </div>
        )}

        <div className="faculty-form-group">
          <label>
            Location / Venue Needed
          </label>

          <input
            type="text"
            name="venue"
            value={form.venue}
            onChange={handleChange}
            placeholder="Example: Grade 10 Classroom, Library, Auditorium"
          />
        </div>
      </div>

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>4</span>

          <div>
            <h3>Schedule & Details</h3>
            <p>
              Tell us when and why you need the service.
            </p>
          </div>
        </div>

        {renderScheduleFields()}

        <div className="faculty-form-group">
          <label>
            Details <span>*</span>
          </label>

          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Briefly describe your event or activity."
            rows={5}
            required
          />
        </div>
      </div>
    </>
  );

  /* =====================================================
     TECHNICAL FORM
  ===================================================== */

  const renderTechnicalForm = () => (
    <>
      {renderPersonalInformation()}

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>2</span>

          <div>
            <h3>How urgent is the problem?</h3>
            <p>
              Select the appropriate priority.
            </p>
          </div>
        </div>

        <div className="faculty-priority-grid">
          {[
            {
              value: "Low",
              description:
                "General issue.",
            },
            {
              value: "Medium",
              description:
                "Needs attention soon.",
            },
            {
              value: "High",
              description:
                "Urgent issue affecting work.",
            },
          ].map((item) => (
            <label
              key={item.value}
              className={`faculty-priority-option ${
                form.priority === item.value
                  ? "selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={item.value}
                checked={
                  form.priority === item.value
                }
                onChange={handleChange}
              />

              <div>
                <strong>{item.value}</strong>

                <span>
                  {item.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="faculty-simple-divider" />

      <div className="faculty-simple-section">
        <div className="faculty-simple-title">
          <span>3</span>

          <div>
            <h3>What is the problem?</h3>
            <p>
              Give us enough information to assist you.
            </p>
          </div>
        </div>

        <div className="faculty-form-group">
          <label>
            Problem / Description <span>*</span>
          </label>

          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Example: Projector is not displaying the laptop screen."
            rows={7}
            required
          />
        </div>
      </div>
    </>
  );

  const renderFormContent = () => {
    if (activeTab === "library") {
      return renderLibraryForm();
    }

    if (activeTab === "avr") {
      return renderAVRForm();
    }

    return renderTechnicalForm();
  };

  /* =====================================================
     REQUEST CARD
  ===================================================== */

  const renderRequestCard = (
    request,
    showCancel = false
  ) => (
    <article
      className="faculty-request-card"
      key={request.id}
    >
      <div className="faculty-request-top">
        <div className="faculty-request-title-area">
          <div className="faculty-request-icon">
            {getRequestIcon(
              request.request_type
            )}
          </div>

          <div>
            <h3>
              {getRequestTitle(request)}
            </h3>

            <span>
              Submitted{" "}
              {request.created_at
                ? new Date(
                    request.created_at
                  ).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )
                : "-"}
            </span>
          </div>
        </div>

        <div
          className={`faculty-status ${getStatusClass(
            request.status
          )}`}
        >
          {getStatusIcon(
            request.status
          )}

          <span>
            {request.status ||
              "Pending"}
          </span>
        </div>
      </div>

      <div className="faculty-request-details">
        {request.request_date && (
          <div className="faculty-request-info">
            <CalendarDays size={17} />

            <div>
              <span>Date Needed</span>

              <strong>
                {formatDate(
                  request.request_date
                )}
              </strong>
            </div>
          </div>
        )}

        {request.request_type ===
          "Technical Assistance" && (
          <div className="faculty-request-info">
            <Flag size={17} />

            <div>
              <span>Type</span>

              <strong>
                Technical Support
              </strong>
            </div>
          </div>
        )}

        {request.request_type ===
          "AVR Request" && (
          <div className="faculty-request-info">
            <MapPin size={17} />

            <div>
              <span>Request</span>

              <strong>
                AVR / Equipment
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="faculty-request-description">
        <span>Request Details</span>

        <div>
          {request.details}
        </div>
      </div>

      {showCancel &&
        request.status === "Pending" && (
          <div className="faculty-request-actions">
            <button
              type="button"
              className="faculty-cancel-request"
              onClick={() =>
                handleCancelRequest(
                  request
                )
              }
              disabled={
                cancellingId === request.id
              }
            >
              <Trash2 size={15} />

              {cancellingId === request.id
                ? "Cancelling..."
                : "Cancel Request"}
            </button>
          </div>
        )}
    </article>
  );

  /* =====================================================
     ACTIVE REQUESTS
  ===================================================== */

  const renderTrackRequests = () => {
    if (loadingRequests) {
      return (
        <div className="faculty-empty">
          <Clock3 size={28} />

          <strong>
            Loading requests...
          </strong>

          <span>
            Please wait.
          </span>
        </div>
      );
    }

    if (activeRequests.length === 0) {
      return (
        <div className="faculty-empty">
          <Clock3 size={28} />

          <strong>
            No active requests
          </strong>

          <span>
            Your pending or accepted requests will appear here.
          </span>

          <button
            type="button"
            className="faculty-empty-action"
            onClick={() =>
              changeSection("request")
            }
          >
            <Send size={16} />
            Make a Request
          </button>
        </div>
      );
    }

    return (
      <div className="faculty-request-list">
        {activeRequests.map((request) =>
          renderRequestCard(
            request,
            true
          )
        )}
      </div>
    );
  };

  /* =====================================================
     HISTORY
  ===================================================== */

  const renderHistory = () => {
    if (loadingRequests) {
      return (
        <div className="faculty-empty">
          <Clock3 size={28} />

          <strong>
            Loading history...
          </strong>

          <span>
            Please wait.
          </span>
        </div>
      );
    }

    if (historyRequests.length === 0) {
      return (
        <div className="faculty-empty">
          <History size={28} />

          <strong>
            No request history
          </strong>

          <span>
            Completed and cancelled requests will appear here.
          </span>
        </div>
      );
    }

    return (
      <div className="faculty-request-list">
        {historyRequests.map((request) =>
          renderRequestCard(
            request,
            false
          )
        )}
      </div>
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loadingUser) {
    return (
      <div className="faculty-dashboard faculty-loading">
        <Clock3 size={30} />

        <strong>
          Checking your account...
        </strong>

        <span>
          Please wait.
        </span>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="faculty-dashboard">

      {/* =================================================
          NOTIFICATION
      ================================================= */}

      {notification.show && (
        <div
          className={`faculty-notification ${notification.type}`}
        >
          <div className="faculty-notification-icon">
            {notification.type ===
            "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
          </div>

          <div className="faculty-notification-content">
            <strong>
              {notification.title}
            </strong>

            <span>
              {notification.message}
            </span>
          </div>

          <button
            type="button"
            onClick={closeNotification}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* =================================================
          LOGOUT MODAL
      ================================================= */}

      {showLogoutModal && (
        <div
          className="faculty-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeLogoutModal}
        >
          <div
            className="faculty-logout-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="faculty-modal-header">
              <div className="faculty-modal-title">
                <div>
                  <LogOut size={20} />
                </div>

                <section>
                  <h3>
                    Confirm Logout
                  </h3>

                  <span>
                    Faculty Portal
                  </span>
                </section>
              </div>

              <button
                type="button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
              >
                <X size={18} />
              </button>
            </div>

            <div className="faculty-modal-body">
              <div className="faculty-modal-alert">
                <AlertCircle size={27} />
              </div>

              <h4>
                Are you sure you want to logout?
              </h4>

              <p>
                You will be signed out of your
                faculty account and returned
                to the home page.
              </p>

              <div className="faculty-modal-actions">
                <button
                  type="button"
                  className="faculty-modal-stay"
                  onClick={
                    closeLogoutModal
                  }
                  disabled={loggingOut}
                >
                  Stay
                </button>

                <button
                  type="button"
                  className="faculty-modal-logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut size={16} />

                  {loggingOut
                    ? "Logging out..."
                    : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="faculty-header">
        <div className="faculty-header-inner">

          <a
            href="/"
            className="faculty-brand"
          >
            <div className="faculty-logo">
              <img
                src="/hfalogo.png"
                alt="Instructional Media Center"
              />
            </div>

            <div className="faculty-brand-text">
              <strong>
                Instructional Media Center
              </strong>

              <span>
                Faculty Portal
              </span>
            </div>
          </a>

          <div className="faculty-account">
            <div className="faculty-account-info">
              <div className="faculty-user-icon">
                <User size={18} />
              </div>

              <div>
                <span>
                  Logged in as
                </span>

                <strong>
                  {user?.email ||
                    form.email ||
                    "Faculty"}
                </strong>
              </div>
            </div>

            <button
              className="faculty-logout"
              onClick={openLogoutModal}
              type="button"
            >
              <LogOut size={17} />

              <span>
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================
          NOTICE
      ================================================= */}

      <div className="faculty-notice">
        <span>
          Submit your request in advance so the
          Instructional Media Center can prepare
          the needed service or equipment.
        </span>
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="faculty-main">
        <div className="faculty-container">

          {/* PAGE TITLE */}

          <section className="faculty-page-heading">
            <div>
              <span className="faculty-label">
                FACULTY PORTAL
              </span>

              <h1>
                {activeSection ===
                "request"
                  ? "Request a Service"
                  : activeSection ===
                    "track"
                  ? "Track My Requests"
                  : "Request History"}
              </h1>

              <p>
                {activeSection ===
                "request"
                  ? "Choose a service and submit your request."
                  : activeSection ===
                    "track"
                  ? "Check the status of your active requests."
                  : "View requests that have already been completed or cancelled."}
              </p>
            </div>

            <div className="faculty-heading-mark">
              {activeSection ===
              "request" ? (
                <Send size={25} />
              ) : activeSection ===
                "track" ? (
                <Clock3 size={25} />
              ) : (
                <History size={25} />
              )}
            </div>
          </section>

          {/* =================================================
              MAIN NAVIGATION
          ================================================= */}

          <div className="faculty-main-tabs">

            <button
              type="button"
              className={
                activeSection ===
                "request"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "request"
                )
              }
            >
              <Send size={18} />

              <span>
                Request Service
              </span>
            </button>

            <button
              type="button"
              className={
                activeSection ===
                "track"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "track"
                )
              }
            >
              <Clock3 size={18} />

              <span>
                Track Requests
              </span>

              {activeRequests.length >
                0 && (
                <b className="faculty-tab-count">
                  {activeRequests.length}
                </b>
              )}
            </button>

            <button
              type="button"
              className={
                activeSection ===
                "history"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "history"
                )
              }
            >
              <History size={18} />

              <span>
                History
              </span>

              {historyRequests.length >
                0 && (
                <b className="faculty-tab-count">
                  {historyRequests.length}
                </b>
              )}
            </button>

          </div>

          {/* =================================================
              REQUEST SERVICE
          ================================================= */}

          {activeSection ===
            "request" && (
            <>

              {/* SERVICE TABS */}

              <div className="faculty-service-tabs">

                <button
                  type="button"
                  className={
                    activeTab ===
                    "library"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    changeTab(
                      "library"
                    )
                  }
                >
                  <BookOpen size={20} />

                  <div>
                    <strong>
                      Library
                    </strong>

                    <span>
                      Library services
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "avr"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    changeTab("avr")
                  }
                >
                  <MonitorPlay
                    size={20}
                  />

                  <div>
                    <strong>
                      AVR
                    </strong>

                    <span>
                      Equipment & venue
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={
                    activeTab ===
                    "technical"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    changeTab(
                      "technical"
                    )
                  }
                >
                  <Wrench size={20} />

                  <div>
                    <strong>
                      Technical
                    </strong>

                    <span>
                      Technical support
                    </span>
                  </div>
                </button>

              </div>

              {/* FORM */}

              <section className="faculty-card">

                <div className="faculty-card-header">

                  <div>
                    <span className="faculty-label">
                      NEW REQUEST
                    </span>

                    <h2>
                      {activeTab ===
                        "library" &&
                        "Library Service"}

                      {activeTab ===
                        "avr" &&
                        "AVR Service"}

                      {activeTab ===
                        "technical" &&
                        "Technical Assistance"}
                    </h2>

                    <p>
                      {activeTab ===
                        "library" &&
                        "Request library services and spaces."}

                      {activeTab ===
                        "avr" &&
                        "Request equipment, technical assistance, or a venue."}

                      {activeTab ===
                        "technical" &&
                        "Report a technical problem to the support team."}
                    </p>
                  </div>

                  <div className="faculty-card-icon">
                    {activeTab ===
                      "library" && (
                      <BookOpen
                        size={22}
                      />
                    )}

                    {activeTab ===
                      "avr" && (
                      <MonitorPlay
                        size={22}
                      />
                    )}

                    {activeTab ===
                      "technical" && (
                      <Wrench
                        size={22}
                      />
                    )}
                  </div>

                </div>

                <form
                  className="faculty-form"
                  onSubmit={
                    handleSubmit
                  }
                >
                  {renderFormContent()}

                  <div className="faculty-form-footer">

                    <button
                      type="button"
                      className="faculty-reset-button"
                      onClick={
                        resetForm
                      }
                      disabled={
                        submitting
                      }
                    >
                      Clear
                    </button>

                    <button
                      type="submit"
                      className="faculty-submit-button"
                      disabled={
                        submitting
                      }
                    >
                      {submitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send
                            size={17}
                          />

                          Submit Request
                        </>
                      )}
                    </button>

                  </div>
                </form>
              </section>
            </>
          )}

          {/* =================================================
              TRACK REQUESTS
          ================================================= */}

          {activeSection ===
            "track" && (
            <section className="faculty-status-section">

              <div className="faculty-section-heading">

                <div>
                  <span className="faculty-label">
                    ACTIVE REQUESTS
                  </span>

                  <h2>
                    My Requests
                  </h2>

                  <p>
                    These are requests that are
                    still being processed.
                  </p>
                </div>

                <div className="faculty-request-count">
                  {
                    activeRequests.length
                  }
                </div>

              </div>

              {renderTrackRequests()}

            </section>
          )}

          {/* =================================================
              HISTORY
          ================================================= */}

          {activeSection ===
            "history" && (
            <section className="faculty-status-section">

              <div className="faculty-section-heading">

                <div>
                  <span className="faculty-label">
                    REQUEST HISTORY
                  </span>

                  <h2>
                    Completed & Cancelled
                  </h2>

                  <p>
                    Previous requests are stored
                    here for your reference.
                  </p>
                </div>

                <div className="faculty-request-count">
                  {
                    historyRequests.length
                  }
                </div>

              </div>

              {renderHistory()}

            </section>
          )}

        </div>
      </main>

      <footer className="faculty-footer">
        © 2026 Instructional Media Center.
        All rights reserved.
      </footer>
    </div>
  );
}

export default FacultyDashboard;