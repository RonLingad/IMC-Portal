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

  /* =====================================================
     LOGOUT MODAL
  ===================================================== */

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
    avrLocations: [],
    otherAVREquipment: "",
    otherAVRLocation: "",

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
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
      }
    );

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

  const handleAVRLocationCheckbox = (value) => {
    setForm((current) => {
      const exists = current.avrLocations.includes(value);

      return {
        ...current,
        avrLocations: exists
          ? current.avrLocations.filter(
              (item) => item !== value
            )
          : [...current.avrLocations, value],
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
        "Full name required",
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
          "Other request required",
          "Please specify your other library request."
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

      if (!form.duration.trim()) {
        showNotification(
          "error",
          "Duration required",
          "Please indicate how long you will need the service."
        );
        return false;
      }

      if (!form.details.trim()) {
        showNotification(
          "error",
          "Details required",
          "Please provide details about your request."
        );
        return false;
      }
    }

    if (activeTab === "avr") {
      if (form.avrEquipment.length === 0) {
        showNotification(
          "error",
          "Equipment required",
          "Please select at least one equipment item."
        );
        return false;
      }

      if (form.avrLocations.length === 0) {
        showNotification(
          "error",
          "Location required",
          "Please select where the AVR service is needed."
        );
        return false;
      }

      if (
        form.avrEquipment.includes("Other") &&
        !form.otherAVREquipment.trim()
      ) {
        showNotification(
          "error",
          "Other equipment required",
          "Please specify the other equipment you need."
        );
        return false;
      }

      if (
        form.avrLocations.includes("Other") &&
        !form.otherAVRLocation.trim()
      ) {
        showNotification(
          "error",
          "Other location required",
          "Please specify the other location or service."
        );
        return false;
      }

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

      if (!form.duration.trim()) {
        showNotification(
          "error",
          "Duration required",
          "Please indicate how long the AVR service will be needed."
        );
        return false;
      }

      if (!form.details.trim()) {
        showNotification(
          "error",
          "Details required",
          "Please provide details about your AVR request."
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
          "Problem description required",
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
          "Please login again before submitting a request."
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
          "Your Supabase account does not have an email address."
        );
      }

      let details = "";

      if (activeTab === "library") {
        details = `Department: ${form.department}

Services Needed:
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
Duration: ${form.duration.trim()}

Description:
${form.details.trim()}`;
      }

      if (activeTab === "avr") {
        details = `Department: ${form.department}

Equipment Needed:
${form.avrEquipment
  .map((item) => `• ${item}`)
  .join("\n")}`;

        if (
          form.avrEquipment.includes("Other") &&
          form.otherAVREquipment.trim()
        ) {
          details += `

Other Equipment:
${form.otherAVREquipment.trim()}`;
        }

        details += `

Location / Service:
${form.avrLocations
  .map((item) => `• ${item}`)
  .join("\n")}`;

        if (
          form.avrLocations.includes("Other") &&
          form.otherAVRLocation.trim()
        ) {
          details += `

Other Location / Service:
${form.otherAVRLocation.trim()}`;
        }

        details += `

Date Needed: ${formatDate(form.dateNeeded)}
Time Needed: ${formatTime(form.timeNeeded)}
Duration: ${form.duration.trim()}

Description:
${form.details.trim()}`;
      }

      if (activeTab === "technical") {
        details = `Department: ${form.department}

Priority Level:
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
    } catch (error) {
      console.error("Request submission error:", error);

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
        "Your request has been cancelled successfully."
      );
    } catch (error) {
      console.error("Cancel request error:", error);

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
      avrLocations: [],
      otherAVREquipment: "",
      otherAVRLocation: "",

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

      /*
       * Logout goes directly to Home.
       */
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);

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
      setActiveTab("library");
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
    if (request.request_type === "AVR Request") {
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
          Duration <span>*</span>
        </label>

        <input
          type="text"
          name="duration"
          value={form.duration}
          onChange={handleChange}
          placeholder="Example: 2 hours"
          required
        />
      </div>
    </div>
  );

  /* =====================================================
     PERSONAL INFORMATION
  ===================================================== */

  const renderPersonalInformation = () => (
    <>
      <div className="faculty-form-section-title">
        <div className="section-number">
          01
        </div>

        <div>
          <h3>Requestor Information</h3>
          <p>
            Provide your faculty information.
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
            placeholder="Enter your full name"
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
            placeholder="Enter your email address"
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
          placeholder="Enter your department"
          required
        />
      </div>
    </>
  );

  /* =====================================================
     LIBRARY
  ===================================================== */

  const renderLibraryForm = () => (
    <>
      {renderPersonalInformation()}

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          02
        </div>

        <div>
          <h3>Library Services</h3>
          <p>
            Select all library services you need.
          </p>
        </div>
      </div>

      <div className="faculty-form-group">
        <label>
          Services Needed <span>*</span>
        </label>

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
      </div>

      {form.requestItems.includes("Other") && (
        <div className="faculty-form-group">
          <label>
            Other Library Request{" "}
            <span>*</span>
          </label>

          <input
            type="text"
            name="otherRequest"
            value={form.otherRequest}
            onChange={handleChange}
            placeholder="Please specify your request"
          />
        </div>
      )}

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          03
        </div>

        <div>
          <h3>Schedule</h3>
          <p>
            Tell us when you need the service.
          </p>
        </div>
      </div>

      {renderScheduleFields()}

      <div className="faculty-form-group">
        <label>
          Details / Description <span>*</span>
        </label>

        <textarea
          name="details"
          value={form.details}
          onChange={handleChange}
          placeholder="Please provide any important information about your request."
          rows={6}
          required
        />
      </div>
    </>
  );

  /* =====================================================
     AVR
  ===================================================== */

  const renderAVRForm = () => (
    <>
      {renderPersonalInformation()}

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          02
        </div>

        <div>
          <h3>AVR Equipment</h3>
          <p>
            Select all equipment you need.
          </p>
        </div>
      </div>

      <div className="faculty-form-group">
        <label>
          Equipment Needed <span>*</span>
        </label>

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

      {form.avrEquipment.includes("Other") && (
        <div className="faculty-form-group">
          <label>
            Other Equipment <span>*</span>
          </label>

          <input
            type="text"
            name="otherAVREquipment"
            value={form.otherAVREquipment}
            onChange={handleChange}
            placeholder="Please specify the equipment"
          />
        </div>
      )}

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          03
        </div>

        <div>
          <h3>Location / Service</h3>
          <p>
            Select where the AVR service is needed.
          </p>
        </div>
      </div>

      <div className="faculty-form-group">
        <label>
          Location / Service <span>*</span>
        </label>

        <div className="faculty-check-grid">
          {[
            "Technical Assistance",
            "AV Room",
            "SJ Conference Room",
            "Other",
          ].map((item) => (
            <label
              className={`faculty-check-item ${
                form.avrLocations.includes(item)
                  ? "checked"
                  : ""
              }`}
              key={item}
            >
              <input
                type="checkbox"
                checked={form.avrLocations.includes(
                  item
                )}
                onChange={() =>
                  handleAVRLocationCheckbox(item)
                }
              />

              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {form.avrLocations.includes("Other") && (
        <div className="faculty-form-group">
          <label>
            Other Location / Service{" "}
            <span>*</span>
          </label>

          <input
            type="text"
            name="otherAVRLocation"
            value={form.otherAVRLocation}
            onChange={handleChange}
            placeholder="Please specify"
          />
        </div>
      )}

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          04
        </div>

        <div>
          <h3>Schedule & Details</h3>
          <p>
            Provide the schedule and event information.
          </p>
        </div>
      </div>

      {renderScheduleFields()}

      <div className="faculty-form-group">
        <label>
          Details / Description <span>*</span>
        </label>

        <textarea
          name="details"
          value={form.details}
          onChange={handleChange}
          placeholder="Describe your event, activity, or AVR requirements."
          rows={6}
          required
        />
      </div>
    </>
  );

  /* =====================================================
     TECHNICAL
  ===================================================== */

  const renderTechnicalForm = () => (
    <>
      {renderPersonalInformation()}

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          02
        </div>

        <div>
          <h3>Problem Priority</h3>
          <p>
            Select how urgent the problem is.
          </p>
        </div>
      </div>

      <div className="faculty-priority-grid">
        {[
          {
            value: "Low",
            description:
              "General issue that does not require immediate attention.",
          },
          {
            value: "Medium",
            description:
              "Issue that needs attention but is not urgent.",
          },
          {
            value: "High",
            description:
              "Urgent issue affecting work or an important activity.",
          },
        ].map((item) => (
          <label
            key={item.value}
            className={`faculty-priority-option ${
              form.priority === item.value
                ? `selected ${item.value.toLowerCase()}`
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

              <span>{item.description}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="faculty-form-divider" />

      <div className="faculty-form-section-title">
        <div className="section-number">
          03
        </div>

        <div>
          <h3>Technical Problem</h3>
          <p>
            Describe the issue that needs assistance.
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
          placeholder="Describe the technical problem. Include the device, software, or equipment affected."
          rows={8}
          required
        />
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
     REQUEST HISTORY
  ===================================================== */

  const renderRequestHistory = () => {
    if (loadingRequests) {
      return (
        <div className="faculty-empty">
          <Clock3 size={28} />

          <strong>
            Loading requests...
          </strong>

          <span>
            Please wait while we load your requests.
          </span>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="faculty-empty">
          <Clock3 size={28} />

          <strong>
            No requests yet
          </strong>

          <span>
            Your submitted requests will appear here.
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
        {requests.map((request) => (
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
                    <span>Request Type</span>

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
                    <span>Service</span>

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

            {request.status === "Pending" && (
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
        ))}
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
            {notification.type === "success" ? (
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
          LOGOUT CONFIRMATION MODAL
          INLINE DESIGN — NO CSS FILE REQUIRED
      ================================================= */}

      {showLogoutModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          onClick={closeLogoutModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 20, 45, 0.60)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#ffffff",
              borderRadius: "5px",
              boxShadow:
                "0 20px 60px rgba(0, 20, 50, 0.25)",
              overflow: "hidden",
              border: "1px solid #dbe3ee",
              fontFamily:
                "Arial, Helvetica, sans-serif",
            }}
          >
            {/* Modal Top */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #062c5c 0%, #0b477f 100%)",
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "5px",
                    background:
                      "rgba(255,255,255,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  <LogOut size={21} />
                </div>

                <div>
                  <h3
                    id="logout-modal-title"
                    style={{
                      margin: 0,
                      color: "#ffffff",
                      fontSize: "18px",
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    Confirm Logout
                  </h3>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#dce9f7",
                      fontSize: "12px",
                    }}
                  >
                    Faculty Portal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
                aria-label="Close logout confirmation"
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  borderRadius: "5px",
                  background:
                    "rgba(255,255,255,0.10)",
                  color: "#ffffff",
                  cursor: loggingOut
                    ? "not-allowed"
                    : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loggingOut ? 0.5 : 1,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "28px 24px 24px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "5px",
                  background: "#eef4fa",
                  color: "#0b477f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "17px",
                }}
              >
                <AlertCircle size={27} />
              </div>

              <h4
                style={{
                  margin: "0 0 8px",
                  color: "#111827",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Are you sure you want to logout?
              </h4>

              <p
                style={{
                  margin: 0,
                  color: "#5f6b7a",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                You will be signed out of your faculty
                account and returned to the home page.
              </p>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={loggingOut}
                  style={{
                    minWidth: "105px",
                    height: "42px",
                    padding: "0 18px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#263445",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loggingOut
                      ? "not-allowed"
                      : "pointer",
                    opacity: loggingOut ? 0.6 : 1,
                  }}
                >
                  Stay
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    minWidth: "120px",
                    height: "42px",
                    padding: "0 18px",
                    borderRadius: "5px",
                    border: "1px solid #062c5c",
                    background: "#062c5c",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loggingOut
                      ? "not-allowed"
                      : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: loggingOut ? 0.7 : 1,
                  }}
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
                <span>Logged in as</span>

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
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* =================================================
          MARQUEE
      ================================================= */}

      <div className="faculty-marquee">
        <div className="faculty-marquee-track">
          <span>
            Please submit requests in advance to
            allow proper scheduling and preparation.
          </span>

          <span>
            • Instructional Media Center Faculty Portal
          </span>

          <span>
            • Library • AVR • Technical Assistance
          </span>

          <span>
            • Please check your request status regularly.
          </span>
        </div>
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="faculty-main">
        <div className="faculty-container">

          {/* PAGE HEADING */}

          <section className="faculty-page-heading">
            <div>
              <span className="faculty-label">
                FACULTY PORTAL
              </span>

              <h1>
                {activeSection === "request"
                  ? "Request Services"
                  : "Track Requests"}
              </h1>

              <p>
                {activeSection === "request"
                  ? "Submit a request to the Instructional Media Center."
                  : "View your submitted requests and monitor their status."}
              </p>
            </div>

            <div className="faculty-heading-mark">
              <BookOpen size={28} />
            </div>
          </section>

          {/* MAIN NAVIGATION */}

          <div className="faculty-main-tabs">

            <button
              type="button"
              className={
                activeSection === "request"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection("request")
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
                activeSection === "track"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection("track")
              }
            >
              <Clock3 size={18} />

              <span>
                Track Requests
              </span>

              {requests.length > 0 && (
                <b className="faculty-tab-count">
                  {requests.length}
                </b>
              )}
            </button>

          </div>

          {/* REQUEST */}

          {activeSection === "request" && (
            <>

              {/* SERVICE SELECTOR */}

              <div className="faculty-service-tabs">

                <button
                  type="button"
                  className={
                    activeTab === "library"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    changeTab("library")
                  }
                >
                  <BookOpen size={19} />

                  <div>
                    <strong>
                      Library Request
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
                  <MonitorPlay size={19} />

                  <div>
                    <strong>
                      AVR Request
                    </strong>

                    <span>
                      Equipment & venue
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "technical"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    changeTab("technical")
                  }
                >
                  <Wrench size={19} />

                  <div>
                    <strong>
                      Technical Assistance
                    </strong>

                    <span>
                      Technical support
                    </span>
                  </div>
                </button>

              </div>

              {/* FORM CARD */}

              <section className="faculty-card">

                <div className="faculty-card-header">

                  <div>
                    <span className="faculty-label">
                      SERVICE REQUEST
                    </span>

                    <h2>
                      {activeTab === "library" &&
                        "Library Request"}

                      {activeTab === "avr" &&
                        "AVR Request"}

                      {activeTab === "technical" &&
                        "Technical Assistance"}
                    </h2>

                    <p>
                      {activeTab === "library" &&
                        "Tell us what library service you need."}

                      {activeTab === "avr" &&
                        "Select the equipment and location you need."}

                      {activeTab === "technical" &&
                        "Report a technical problem to the support team."}
                    </p>
                  </div>

                  <div className="faculty-card-icon">
                    {activeTab === "library" && (
                      <BookOpen size={23} />
                    )}

                    {activeTab === "avr" && (
                      <MonitorPlay size={23} />
                    )}

                    {activeTab === "technical" && (
                      <Wrench size={23} />
                    )}
                  </div>

                </div>

                <form
                  className="faculty-form"
                  onSubmit={handleSubmit}
                >

                  {renderFormContent()}

                  <div className="faculty-form-footer">

                    <button
                      type="button"
                      className="faculty-reset-button"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Clear Form
                    </button>

                    <button
                      type="submit"
                      className="faculty-submit-button"
                      disabled={submitting}
                    >
                      {submitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send size={17} />
                          Submit Request
                        </>
                      )}
                    </button>

                  </div>

                </form>

              </section>
            </>
          )}

          {/* TRACK */}

          {activeSection === "track" && (
            <section className="faculty-status-section">

              <div className="faculty-section-heading">

                <div>
                  <span className="faculty-label">
                    REQUEST TRACKING
                  </span>

                  <h2>
                    My Requests
                  </h2>

                  <p>
                    View your submitted requests and
                    their current status.
                  </p>
                </div>

                <div className="faculty-request-count">
                  {requests.length}
                </div>

              </div>

              {renderRequestHistory()}

            </section>
          )}

        </div>
      </main>

      <footer className="faculty-footer">
        <div>
          © 2026 Instructional Media Center.
          All rights reserved.
        </div>
      </footer>

    </div>
  );
}

export default FacultyDashboard;