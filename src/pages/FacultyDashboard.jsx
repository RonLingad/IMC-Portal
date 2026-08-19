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
  RefreshCw,
  Eye,
} from "lucide-react";

import { supabase } from "../services/supabase";
import "./FacultyDashboard.css";

function FacultyDashboard() {
  /* =====================================================
     NAVIGATION
  ===================================================== */

  const [activeSection, setActiveSection] = useState(null);
  const [activeRequestType, setActiveRequestType] =
    useState("library");

  /* =====================================================
     USER
  ===================================================== */

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* =====================================================
     REQUESTS
  ===================================================== */

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] =
    useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] =
    useState(null);
  const [refreshing, setRefreshing] =
    useState(false);

  /* =====================================================
     DETAILS MODAL
  ===================================================== */

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  /* =====================================================
     NOTIFICATION
  ===================================================== */

  const [notification, setNotification] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  /* =====================================================
     FORM
  ===================================================== */

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

  const showNotification = (
    type,
    title,
    message
  ) => {
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

  const loadRequests = async (
    email,
    showRefreshNotification = false
  ) => {
    if (!email) {
      setRequests([]);
      setLoadingRequests(false);
      return;
    }

    if (showRefreshNotification) {
      setRefreshing(true);
    } else {
      setLoadingRequests(true);
    }

    try {
      const { data, error } = await supabase
        .from("library_requests")
        .select("*")
        .eq("requester_email", email)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setRequests(data || []);

      if (showRefreshNotification) {
        showNotification(
          "success",
          "Requests updated",
          "Your request statuses have been refreshed."
        );
      }
    } catch (error) {
      console.error(
        "Request loading error:",
        error
      );

      setRequests([]);

      showNotification(
        "error",
        "Unable to load requests",
        error.message ||
          "Please try again."
      );
    } finally {
      setLoadingRequests(false);
      setRefreshing(false);
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

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

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

        await loadRequests(
          currentUser.email
        );
      } catch (error) {
        console.error(
          "User initialization error:",
          error
        );

        if (!mounted) {
          return;
        }

        setUser(null);
        setRequests([]);
        setLoadingRequests(false);
        setLoadingUser(false);

        showNotification(
          "error",
          "Unable to load account",
          error.message ||
            "Please login again."
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
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return;
          }

          const currentUser =
            session?.user || null;

          if (!currentUser) {
            setUser(null);
            setRequests([]);

            setForm((current) => ({
              ...current,
              email: "",
              fullName: "",
            }));

            setLoadingRequests(false);

            if (
              window.location.pathname !==
              "/login"
            ) {
              window.location.href =
                "/login";
            }

            return;
          }

          setUser(currentUser);

          setForm((current) => ({
            ...current,
            email:
              currentUser.email || "",
            fullName:
              currentUser.user_metadata
                ?.full_name ||
              currentUser.user_metadata
                ?.name ||
              current.fullName,
          }));

          window.setTimeout(() => {
            if (mounted) {
              loadRequests(
                currentUser.email
              );
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
     FORM HANDLERS
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
      const exists =
        current.requestItems.includes(
          value
        );

      return {
        ...current,
        requestItems: exists
          ? current.requestItems.filter(
              (item) => item !== value
            )
          : [
              ...current.requestItems,
              value,
            ],
      };
    });
  };

  const handleAVREquipmentCheckbox = (
    value
  ) => {
    setForm((current) => {
      const exists =
        current.avrEquipment.includes(
          value
        );

      return {
        ...current,
        avrEquipment: exists
          ? current.avrEquipment.filter(
              (item) => item !== value
            )
          : [
              ...current.avrEquipment,
              value,
            ],
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

    if (
      activeRequestType ===
      "library"
    ) {
      if (
        form.requestItems.length === 0
      ) {
        showNotification(
          "error",
          "Select a service",
          "Please select at least one library service."
        );
        return false;
      }

      if (
        form.requestItems.includes(
          "Other"
        ) &&
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

    if (
      activeRequestType ===
      "avr"
    ) {
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
          "Please provide a short description."
        );
        return false;
      }
    }

    if (
      activeRequestType ===
      "technical"
    ) {
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
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(`${date}T00:00:00`);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        showNotification(
          "error",
          "Session expired",
          "Please login again."
        );

        window.setTimeout(() => {
          window.location.href =
            "/login";
        }, 1000);

        return;
      }

      const authenticatedUser =
        session.user;

      const requesterEmail =
        authenticatedUser.email;

      if (!requesterEmail) {
        throw new Error(
          "Your account does not have an email address."
        );
      }

      let details = "";
      let internalRequestType = "";
      let requestDate = null;

      /* ---------------- LIBRARY ---------------- */

      if (
        activeRequestType ===
        "library"
      ) {
        internalRequestType =
          "Library Request";

        requestDate =
          form.dateNeeded;

        details = `Department: ${form.department}

Services Requested:
${form.requestItems
  .map((item) => `• ${item}`)
  .join("\n")}`;

        if (
          form.requestItems.includes(
            "Other"
          ) &&
          form.otherRequest.trim()
        ) {
          details += `

Other Request:
${form.otherRequest.trim()}`;
        }

        details += `

Date Needed: ${formatDate(
          form.dateNeeded
        )}
Time Needed: ${formatTime(
          form.timeNeeded
        )}

Description:
${form.details.trim()}`;
      }

      /* ---------------- AVR ---------------- */

      if (
        activeRequestType ===
        "avr"
      ) {
        internalRequestType =
          "AVR Request";

        requestDate =
          form.dateNeeded;

        details = `Department: ${form.department}`;

        if (
          form.avrEquipment.length >
          0
        ) {
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
          form.avrService ===
            "Other" &&
          form.otherAVRService.trim()
        ) {
          details += `

Other Service / Venue:
${form.otherAVRService.trim()}`;
        }

        if (form.venue.trim()) {
          details += `

Location / Venue:
${form.venue.trim()}`;
        }

        details += `

Date Needed: ${formatDate(
          form.dateNeeded
        )}
Time Needed: ${formatTime(
          form.timeNeeded
        )}`;

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

      if (
        activeRequestType ===
        "technical"
      ) {
        internalRequestType =
          "Technical Assistance";

        details = `Department: ${form.department}

Priority:
${form.priority}

Problem / Description:
${form.details.trim()}`;
      }

      const { data, error } =
        await supabase
          .from("library_requests")
          .insert({
            requester_name:
              form.fullName.trim(),
            requester_email:
              requesterEmail,
            request_type:
              internalRequestType,
            request_date:
              requestDate,
            details,
            status: "Pending",
          })
          .select()
          .single();

      if (error) {
        throw error;
      }

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
        error.message ||
          "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     CANCEL REQUEST
  ===================================================== */

  const handleCancelRequest = async (
    request
  ) => {
    if (!request) {
      return;
    }

    if (
      request.status !==
      "Pending"
    ) {
      showNotification(
        "error",
        "Cannot cancel request",
        "Only pending requests can be cancelled."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this request?"
      );

    if (!confirmed) {
      return;
    }

    setCancellingId(request.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        showNotification(
          "error",
          "Session expired",
          "Please login again."
        );

        return;
      }

      const userEmail =
        session.user.email;

      const { data, error } =
        await supabase
          .from("library_requests")
          .update({
            status: "Cancelled",
          })
          .eq("id", request.id)
          .eq(
            "requester_email",
            userEmail
          )
          .eq(
            "status",
            "Pending"
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? data
            : item
        )
      );

      setSelectedRequest(null);

      showNotification(
        "success",
        "Request cancelled",
        "Your request has been cancelled successfully."
      );
    } catch (error) {
      console.error(
        "Cancel request error:",
        error
      );

      showNotification(
        "error",
        "Unable to cancel request",
        error.message ||
          "Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setForm((current) => ({
      fullName:
        user?.user_metadata
          ?.full_name ||
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
    if (loggingOut) {
      return;
    }

    setShowLogoutModal(false);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

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
        error.message ||
          "Please try again."
      );
    }
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const openRequest = (type) => {
    setActiveRequestType(type);
    setActiveSection("request");
    resetForm();
  };

  const openTrack = () => {
    setActiveSection("track");
  };

  const openHistory = () => {
    setActiveSection("history");
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const getStatusClass = (status) => {
    const normalizedStatus =
      (status || "Pending")
        .toString()
        .trim()
        .toLowerCase()
        .replaceAll(" ", "-");

    return `status-${normalizedStatus}`;
  };

  const getStatusIcon = (status) => {
    const normalizedStatus =
      (status || "Pending")
        .toString()
        .trim()
        .toLowerCase();

    switch (normalizedStatus) {
      case "accepted":
      case "completed":
        return (
          <CheckCircle2 size={17} />
        );

      case "not available":
      case "cancelled":
        return (
          <XCircle size={17} />
        );

      case "in progress":
        return (
          <RefreshCw size={17} />
        );

      default:
        return <Clock3 size={17} />;
    }
  };

  const getRequestIcon = (
    requestType
  ) => {
    const type =
      requestType
        ?.toLowerCase() || "";

    if (type.includes("avr")) {
      return (
        <MonitorPlay size={19} />
      );
    }

    if (
      type.includes("technical")
    ) {
      return <Wrench size={19} />;
    }

    return <BookOpen size={19} />;
  };

  const getRequestTitle = (
    request
  ) => {
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
      return "Technical Request";
    }

    return "Library Request";
  };

  /* =====================================================
     REQUEST FILTERS
  ===================================================== */

  const activeRequests =
    requests.filter((request) => {
      const status =
        (
          request.status ||
          "Pending"
        )
          .toString()
          .trim()
          .toLowerCase();

      return (
        status !== "completed" &&
        status !== "cancelled"
      );
    });

  const historyRequests =
    requests.filter((request) => {
      const status =
        (
          request.status || ""
        )
          .toString()
          .trim()
          .toLowerCase();

      return (
        status === "completed" ||
        status === "cancelled"
      );
    });

  /* =====================================================
     PERSONAL INFORMATION
  ===================================================== */

  const renderPersonalInformation =
    () => (
      <div className="faculty-form-section">
        <div className="faculty-section-number">
          1
        </div>

        <div className="faculty-form-section-content">
          <div className="faculty-form-section-title">
            <h3>Your Information</h3>
            <p>
              Confirm your basic information.
            </p>
          </div>

          <div className="faculty-form-row">
            <div className="faculty-form-group">
              <label>
                Full Name{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={
                  handleChange
                }
                placeholder="Full name"
              />
            </div>

            <div className="faculty-form-group">
              <label>
                Email{" "}
                <span>*</span>
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={
                  handleChange
                }
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="faculty-form-group">
            <label>
              Department{" "}
              <span>*</span>
            </label>

            <input
              type="text"
              name="department"
              value={
                form.department
              }
              onChange={
                handleChange
              }
              placeholder="Department"
            />
          </div>
        </div>
      </div>
    );

  /* =====================================================
     SCHEDULE
  ===================================================== */

  const renderScheduleFields =
    () => (
      <div className="faculty-form-row faculty-form-row-three">
        <div className="faculty-form-group">
          <label>
            Date Needed{" "}
            <span>*</span>
          </label>

          <input
            type="date"
            name="dateNeeded"
            value={
              form.dateNeeded
            }
            onChange={
              handleChange
            }
          />
        </div>

        <div className="faculty-form-group">
          <label>
            Time Needed{" "}
            <span>*</span>
          </label>

          <input
            type="time"
            name="timeNeeded"
            value={
              form.timeNeeded
            }
            onChange={
              handleChange
            }
          />
        </div>

        <div className="faculty-form-group">
          <label>
            Duration
          </label>

          <input
            type="text"
            name="duration"
            value={
              form.duration
            }
            onChange={
              handleChange
            }
            placeholder="Example: 2 hours"
          />
        </div>
      </div>
    );

  /* =====================================================
     LIBRARY FORM
  ===================================================== */

  const renderLibraryForm =
    () => (
      <>
        {renderPersonalInformation()}

        <div className="faculty-form-divider" />

        <div className="faculty-form-section">
          <div className="faculty-section-number">
            2
          </div>

          <div className="faculty-form-section-content">
            <div className="faculty-form-section-title">
              <h3>
                What do you need?
              </h3>

              <p>
                Select the library
                service you need.
              </p>
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
                    form.requestItems.includes(
                      item
                    )
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
                      handleLibraryCheckbox(
                        item
                      )
                    }
                  />

                  <span>
                    {item}
                  </span>
                </label>
              ))}
            </div>

            {form.requestItems.includes(
              "Other"
            ) && (
              <div className="faculty-form-group">
                <label>
                  Other Request
                </label>

                <input
                  type="text"
                  name="otherRequest"
                  value={
                    form.otherRequest
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Please specify"
                />
              </div>
            )}
          </div>
        </div>

        <div className="faculty-form-divider" />

        <div className="faculty-form-section">
          <div className="faculty-section-number">
            3
          </div>

          <div className="faculty-form-section-content">
            <div className="faculty-form-section-title">
              <h3>
                When do you need it?
              </h3>

              <p>
                Provide the date,
                time, and details.
              </p>
            </div>

            {renderScheduleFields()}

            <div className="faculty-form-group">
              <label>
                Details{" "}
                <span>*</span>
              </label>

              <textarea
                name="details"
                value={
                  form.details
                }
                onChange={
                  handleChange
                }
                placeholder="Briefly describe what you need."
                rows={6}
              />
            </div>
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

      <div className="faculty-form-divider" />

      <div className="faculty-form-section">
        <div className="faculty-section-number">
          2
        </div>

        <div className="faculty-form-section-content">
          <div className="faculty-form-section-title">
            <h3>
              Equipment Needed
            </h3>

            <p>
              Select the equipment
              you need.
            </p>
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
                  form.avrEquipment.includes(
                    item
                  )
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
                    handleAVREquipmentCheckbox(
                      item
                    )
                  }
                />

                <span>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="faculty-form-divider" />

      <div className="faculty-form-section">
        <div className="faculty-section-number">
          3
        </div>

        <div className="faculty-form-section-content">
          <div className="faculty-form-section-title">
            <h3>
              Service / Venue
            </h3>

            <p>
              Choose what applies
              to your request.
            </p>
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
                  form.avrService ===
                  item
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
                    form.avrService ===
                    item
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  {item}
                </span>
              </label>
            ))}
          </div>

          {form.avrService ===
            "Other" && (
            <div className="faculty-form-group">
              <label>
                Other Service /
                Venue
              </label>

              <input
                type="text"
                name="otherAVRService"
                value={
                  form.otherAVRService
                }
                onChange={
                  handleChange
                }
                placeholder="Please specify"
              />
            </div>
          )}

          <div className="faculty-form-group">
            <label>
              Location / Venue
            </label>

            <input
              type="text"
              name="venue"
              value={form.venue}
              onChange={
                handleChange
              }
              placeholder="Example: Auditorium"
            />
          </div>
        </div>
      </div>

      <div className="faculty-form-divider" />

      <div className="faculty-form-section">
        <div className="faculty-section-number">
          4
        </div>

        <div className="faculty-form-section-content">
          <div className="faculty-form-section-title">
            <h3>
              Schedule & Details
            </h3>

            <p>
              Tell us when and why
              you need the service.
            </p>
          </div>

          {renderScheduleFields()}

          <div className="faculty-form-group">
            <label>
              Details{" "}
              <span>*</span>
            </label>

            <textarea
              name="details"
              value={form.details}
              onChange={
                handleChange
              }
              placeholder="Briefly describe your event or activity."
              rows={6}
            />
          </div>
        </div>
      </div>
    </>
  );

  /* =====================================================
     TECHNICAL FORM
  ===================================================== */

  const renderTechnicalForm =
    () => (
      <>
        {renderPersonalInformation()}

        <div className="faculty-form-divider" />

        <div className="faculty-form-section">
          <div className="faculty-section-number">
            2
          </div>

          <div className="faculty-form-section-content">
            <div className="faculty-form-section-title">
              <h3>
                Priority
              </h3>

              <p>
                Select the urgency
                of the problem.
              </p>
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
                    form.priority ===
                    item.value
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={
                      item.value
                    }
                    checked={
                      form.priority ===
                      item.value
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <div>
                    <strong>
                      {item.value}
                    </strong>

                    <span>
                      {
                        item.description
                      }
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="faculty-form-divider" />

        <div className="faculty-form-section">
          <div className="faculty-section-number">
            3
          </div>

          <div className="faculty-form-section-content">
            <div className="faculty-form-section-title">
              <h3>
                Problem Details
              </h3>

              <p>
                Give us enough
                information to
                assist you.
              </p>
            </div>

            <div className="faculty-form-group">
              <label>
                Problem /
                Description{" "}
                <span>*</span>
              </label>

              <textarea
                name="details"
                value={form.details}
                onChange={
                  handleChange
                }
                placeholder="Example: Projector is not displaying the laptop screen."
                rows={8}
              />
            </div>
          </div>
        </div>
      </>
    );

  /* =====================================================
     FORM CONTENT
  ===================================================== */

  const renderFormContent =
    () => {
      if (
        activeRequestType ===
        "library"
      ) {
        return renderLibraryForm();
      }

      if (
        activeRequestType ===
        "avr"
      ) {
        return renderAVRForm();
      }

      return renderTechnicalForm();
    };

  /* =====================================================
     REQUEST DETAILS MODAL
  ===================================================== */

  const renderRequestDetails =
    () => {
      if (!selectedRequest) {
        return null;
      }

      const request =
        selectedRequest;

      const status =
        request.status ||
        "Pending";

      return (
        <div
          className="faculty-details-overlay"
          onClick={() =>
            setSelectedRequest(
              null
            )
          }
        >
          <div
            className="faculty-details-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="faculty-details-header">
              <div className="faculty-details-title">
                <div className="faculty-details-icon">
                  {getRequestIcon(
                    request.request_type
                  )}
                </div>

                <div>
                  <span>
                    REQUEST DETAILS
                  </span>

                  <h2>
                    {getRequestTitle(
                      request
                    )}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="faculty-details-body">
              <div className="faculty-details-status-row">
                <span>
                  Status
                </span>

                <div
                  className={`faculty-status ${getStatusClass(
                    status
                  )}`}
                >
                  {getStatusIcon(
                    status
                  )}

                  {status}
                </div>
              </div>

              <div className="faculty-details-grid">
                <div>
                  <span>
                    Submitted
                  </span>

                  <strong>
                    {formatDateTime(
                      request.created_at
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Date Needed
                  </span>

                  <strong>
                    {formatDate(
                      request.request_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Requester
                  </span>

                  <strong>
                    {
                      request.requester_name
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Department
                  </span>

                  <strong>
                    {extractDepartment(
                      request.details
                    )}
                  </strong>
                </div>
              </div>

              <div className="faculty-details-content">
                <span>
                  Complete Request
                </span>

                <pre>
                  {request.details ||
                    "No additional details provided."}
                </pre>
              </div>
            </div>

            <div className="faculty-details-footer">
              {status ===
                "Pending" && (
                <button
                  type="button"
                  className="faculty-cancel-button"
                  onClick={() =>
                    handleCancelRequest(
                      request
                    )
                  }
                  disabled={
                    cancellingId ===
                    request.id
                  }
                >
                  <Trash2 size={16} />

                  {cancellingId ===
                  request.id
                    ? "Cancelling..."
                    : "Cancel Request"}
                </button>
              )}

              <button
                type="button"
                className="faculty-close-button"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    };

  /* =====================================================
     EXTRACT DEPARTMENT
  ===================================================== */

  const extractDepartment = (
    details
  ) => {
    if (!details) {
      return "-";
    }

    const match =
      details.match(
        /Department:\s*(.+)/
      );

    if (!match) {
      return "-";
    }

    return match[1]
      .split("\n")[0]
      .trim();
  };

  /* =====================================================
     COMPACT REQUEST ROW
  ===================================================== */

  const renderRequestRow = (
    request,
    allowCancel = false
  ) => {
    const status =
      request.status ||
      "Pending";

    return (
      <div
        className="faculty-request-row"
        key={request.id}
      >
        <div className="faculty-request-date">
          <CalendarDays size={17} />

          <div>
            <span>
              Date
            </span>

            <strong>
              {formatDate(
                request.created_at
                  ?.split("T")[0]
              )}
            </strong>
          </div>
        </div>

        <div className="faculty-request-type">
          <div className="faculty-row-icon">
            {getRequestIcon(
              request.request_type
            )}
          </div>

          <div>
            <span>
              Request Type
            </span>

            <strong>
              {getRequestTitle(
                request
              )}
            </strong>
          </div>
        </div>

        <div className="faculty-request-row-status">
          <span>
            Status
          </span>

          <div
            className={`faculty-status ${getStatusClass(
              status
            )}`}
          >
            {getStatusIcon(
              status
            )}

            {status}
          </div>
        </div>

        <div className="faculty-request-row-action">
          <button
            type="button"
            onClick={() =>
              setSelectedRequest(
                request
              )
            }
          >
            <Eye size={16} />

            View Details
          </button>

          {allowCancel &&
            status ===
              "Pending" && (
              <button
                type="button"
                className="faculty-row-cancel"
                onClick={() =>
                  handleCancelRequest(
                    request
                  )
                }
              >
                <Trash2
                  size={15}
                />
              </button>
            )}
        </div>
      </div>
    );
  };

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  const renderEmptyState = (
    type
  ) => (
    <div className="faculty-empty">
      {type === "history" ? (
        <History size={34} />
      ) : (
        <Clock3 size={34} />
      )}

      <strong>
        {type === "history"
          ? "No request history"
          : "No active requests"}
      </strong>

      <span>
        {type === "history"
          ? "Completed and cancelled requests will appear here."
          : "Your pending, accepted, or in-progress requests will appear here."}
      </span>

      {type === "track" && (
        <button
          type="button"
          onClick={() =>
            openRequest(
              "library"
            )
          }
        >
          <Send size={16} />
          Make a Request
        </button>
      )}
    </div>
  );

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

      {/* NOTIFICATION */}

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
            onClick={
              closeNotification
            }
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* LOGOUT MODAL */}

      {showLogoutModal && (
        <div
          className="faculty-modal-overlay"
          onClick={
            closeLogoutModal
          }
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
                onClick={
                  closeLogoutModal
                }
                disabled={
                  loggingOut
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="faculty-modal-body">
              <div className="faculty-modal-alert">
                <AlertCircle
                  size={27}
                />
              </div>

              <h4>
                Are you sure you want
                to logout?
              </h4>

              <p>
                You will be signed out
                of your faculty account.
              </p>

              <div className="faculty-modal-actions">
                <button
                  type="button"
                  className="faculty-modal-stay"
                  onClick={
                    closeLogoutModal
                  }
                  disabled={
                    loggingOut
                  }
                >
                  Stay
                </button>

                <button
                  type="button"
                  className="faculty-modal-logout"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
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

      {/* REQUEST DETAILS */}

      {renderRequestDetails()}

      {/* HEADER */}

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
              onClick={
                openLogoutModal
              }
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

      {/* NOTICE */}

      <div className="faculty-notice">
        <span>
          Submit your request in
          advance so the Instructional
          Media Center can prepare the
          needed service or equipment.
        </span>
      </div>

      {/* MAIN */}

      <main className="faculty-main">
        <div className="faculty-container">

          {/* TITLE */}

          <section className="faculty-page-heading">
            <div>
              <span className="faculty-label">
                FACULTY PORTAL
              </span>

              <h1>
                Service Request
              </h1>

              <p>
                Choose a service, track
                your requests, or view
                your request history.
              </p>
            </div>

            <div className="faculty-heading-mark">
              <Send size={26} />
            </div>
          </section>

          {/* =================================================
              FIVE MAIN BUTTONS
          ================================================= */}

          <div className="faculty-main-tabs">

            <button
              type="button"
              className={
                activeSection ===
                  "request" &&
                activeRequestType ===
                  "library"
                  ? "active"
                  : ""
              }
              onClick={() =>
                openRequest(
                  "library"
                )
              }
            >
              <BookOpen size={21} />

              <span>
                Library Request
              </span>
            </button>

            <button
              type="button"
              className={
                activeSection ===
                  "request" &&
                activeRequestType ===
                  "avr"
                  ? "active"
                  : ""
              }
              onClick={() =>
                openRequest(
                  "avr"
                )
              }
            >
              <MonitorPlay
                size={21}
              />

              <span>
                AVR Request
              </span>
            </button>

            <button
              type="button"
              className={
                activeSection ===
                  "request" &&
                activeRequestType ===
                  "technical"
                  ? "active"
                  : ""
              }
              onClick={() =>
                openRequest(
                  "technical"
                )
              }
            >
              <Wrench size={21} />

              <span>
                Technical Request
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
              onClick={
                openTrack
              }
            >
              <Clock3 size={21} />

              <span>
                Track Request
              </span>

              {activeRequests.length >
                0 && (
                <b className="faculty-tab-count">
                  {
                    activeRequests.length
                  }
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
              onClick={
                openHistory
              }
            >
              <History size={21} />

              <span>
                History
              </span>

              {historyRequests.length >
                0 && (
                <b className="faculty-tab-count">
                  {
                    historyRequests.length
                  }
                </b>
              )}
            </button>

          </div>

          {/* =================================================
              REQUEST FORM
          ================================================= */}

          {activeSection ===
            "request" && (
            <section className="faculty-card">

              <div className="faculty-card-header">
                <div>
                  <span className="faculty-label">
                    NEW REQUEST
                  </span>

                  <h2>
                    {activeRequestType ===
                      "library" &&
                      "Library Request"}

                    {activeRequestType ===
                      "avr" &&
                      "AVR Request"}

                    {activeRequestType ===
                      "technical" &&
                      "Technical Request"}
                  </h2>

                  <p>
                    Complete the form
                    below to submit your
                    request.
                  </p>
                </div>

                <div className="faculty-card-icon">
                  {activeRequestType ===
                    "library" && (
                    <BookOpen
                      size={23}
                    />
                  )}

                  {activeRequestType ===
                    "avr" && (
                    <MonitorPlay
                      size={23}
                    />
                  )}

                  {activeRequestType ===
                    "technical" && (
                    <Wrench
                      size={23}
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
                    Track My Requests
                  </h2>

                  <p>
                    Click View Details
                    to see the complete
                    request information.
                  </p>
                </div>

                <button
                  type="button"
                  className="faculty-refresh-button"
                  onClick={() =>
                    loadRequests(
                      user?.email,
                      true
                    )
                  }
                  disabled={
                    refreshing
                  }
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing
                        ? "faculty-spin"
                        : ""
                    }
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </button>
              </div>

              {loadingRequests ? (
                <div className="faculty-empty">
                  <Clock3
                    size={34}
                  />

                  <strong>
                    Loading requests...
                  </strong>

                  <span>
                    Please wait.
                  </span>
                </div>
              ) : activeRequests.length ===
                0 ? (
                renderEmptyState(
                  "track"
                )
              ) : (
                <div className="faculty-request-list">
                  <div className="faculty-list-header">
                    <span>
                      Request
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Action
                    </span>
                  </div>

                  {activeRequests.map(
                    (request) =>
                      renderRequestRow(
                        request,
                        true
                      )
                  )}
                </div>
              )}
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
                    Request History
                  </h2>

                  <p>
                    Completed and cancelled
                    requests are stored
                    here.
                  </p>
                </div>

                <div className="faculty-history-count">
                  {
                    historyRequests.length
                  }
                </div>
              </div>

              {loadingRequests ? (
                <div className="faculty-empty">
                  <Clock3
                    size={34}
                  />

                  <strong>
                    Loading history...
                  </strong>

                  <span>
                    Please wait.
                  </span>
                </div>
              ) : historyRequests.length ===
                0 ? (
                renderEmptyState(
                  "history"
                )
              ) : (
                <div className="faculty-request-list">
                  <div className="faculty-list-header">
                    <span>
                      Request
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Action
                    </span>
                  </div>

                  {historyRequests.map(
                    (request) =>
                      renderRequestRow(
                        request,
                        false
                      )
                  )}
                </div>
              )}
            </section>
          )}

          {/* INITIAL STATE */}

          {activeSection === null && (
            <div className="faculty-welcome">
              <div className="faculty-welcome-icon">
                <Send size={30} />
              </div>

              <h2>
                What can we help you
                with?
              </h2>

              <p>
                Select one of the request
                options above to get
                started.
              </p>
            </div>
          )}

        </div>
      </main>

      <footer className="faculty-footer">
        © 2026 Instructional Media
        Center. All rights reserved.
      </footer>
    </div>
  );
}

export default FacultyDashboard;