import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  History,
  Clock3,
  Eye,
  Newspaper,
  MonitorPlay,
  Wrench,
  CheckCircle2,
  XCircle,
  CalendarDays,
  User,
  Mail,
  Building2,
  RefreshCw,
  Search,
  LogOut,
  Menu,
  X,
  Pencil,
  Trash2,
  Plus,
  Save,
  Upload,
  Image as ImageIcon,
  Users,
  AlertCircle,
  CircleCheck,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../services/supabase";
import "./AvrDashboard.css";

const CONTENT_BUCKET = "avr-media";

const DEFAULT_HOURS = [
  {
    day_name: "Monday",
    opening_time: "08:00",
    closing_time: "17:00",
    is_closed: false,
  },
  {
    day_name: "Tuesday",
    opening_time: "08:00",
    closing_time: "17:00",
    is_closed: false,
  },
  {
    day_name: "Wednesday",
    opening_time: "08:00",
    closing_time: "17:00",
    is_closed: false,
  },
  {
    day_name: "Thursday",
    opening_time: "08:00",
    closing_time: "17:00",
    is_closed: false,
  },
  {
    day_name: "Friday",
    opening_time: "08:00",
    closing_time: "17:00",
    is_closed: false,
  },
  {
    day_name: "Saturday",
    opening_time: "08:00",
    closing_time: "12:00",
    is_closed: true,
  },
  {
    day_name: "Sunday",
    opening_time: "08:00",
    closing_time: "12:00",
    is_closed: true,
  },
];

function AvrDashboard() {
  /* =====================================================
     USER
  ===================================================== */

  const [currentUser, setCurrentUser] = useState(null);

  const getStaffName = (user) => {
    if (!user) return "AVR Staff";

    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "AVR Staff"
    );
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =====================================================
     REQUESTS
  ===================================================== */

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState("All");
  const [requestTypeFilter, setRequestTypeFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);

  /* =====================================================
     CONFIRMATION MODAL
  ===================================================== */

  const [confirmation, setConfirmation] = useState(null);

  const openConfirmation = ({
    title,
    message,
    confirmLabel = "Confirm",
    tone = "primary",
    onConfirm,
  }) => {
    setConfirmation({
      title,
      message,
      confirmLabel,
      tone,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setConfirmation(null);
  };

  /* =====================================================
     ALERT
  ===================================================== */

  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = "success") => {
    setAlert({
      id: Date.now(),
      message,
      type,
    });

    setTimeout(() => {
      setAlert(null);
    }, 3500);
  };

  /* =====================================================
     CONTENT
  ===================================================== */

  const [hours, setHours] = useState([]);
  const [visionMission, setVisionMission] = useState(null);
  const [news, setNews] = useState([]);
  const [services, setServices] = useState([]);

  const [loadingContent, setLoadingContent] = useState(false);

  /* =====================================================
     CONTENT MODALS
  ===================================================== */

  const [contentModal, setContentModal] = useState(null);

  const [contentForm, setContentForm] = useState({
    id: null,
    title: "",
    body: "",
    image_url: "",
    published_date: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  /* =====================================================
     HOURS FORM
  ===================================================== */

  const [hoursForm, setHoursForm] = useState(DEFAULT_HOURS);

  /* =====================================================
     DATE HELPERS
  ===================================================== */

  /*
    Converts the date selected from:
    
      2026-08-17

    into:

      2026-08-17T00:00:00+00:00

    This is used specifically for saving the
    published_date to the database.
  */

  const formatDateForDatabase = (date) => {
    if (!date) return null;

    return `${date}T00:00:00+00:00`;
  };

  /*
    Converts a database timestamp such as:

      2026-08-17T00:00:00+00:00

    back to:

      2026-08-17

    so it can be used by <input type="date">.
  */

  const formatDateForInput = (date) => {
    if (!date) return "";

    return date.slice(0, 10);
  };

  /* =====================================================
     INITIAL USER
  ===================================================== */

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     LOAD REQUESTS
  ===================================================== */

  const loadRequests = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoadingRequests(true);
    }

    try {
      const { data, error } = await supabase
        .from("library_requests")
        .select("*")
        .in("request_type", [
          "AVR Request",
          "Technical Assistance",
        ])
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error("AVR request loading error:", error);

      showAlert(
        error.message || "Unable to load requests.",
        "error"
      );
    } finally {
      setLoadingRequests(false);
      setRefreshing(false);
    }
  };

  /* =====================================================
     REALTIME REQUESTS
  ===================================================== */

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("avr-dashboard-library-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_requests",
        },
        (payload) => {
          const changed = payload.new || payload.old;

          if (
            changed?.request_type === "AVR Request" ||
            changed?.request_type === "Technical Assistance"
          ) {
            loadRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =====================================================
     LOAD AVR CONTENT
  ===================================================== */

  const loadContent = async () => {
    setLoadingContent(true);

    try {
      const [
        hoursResult,
        visionResult,
        newsResult,
        servicesResult,
      ] = await Promise.all([
        supabase
          .from("avr_operating_hours")
          .select("*")
          .order("day_order", { ascending: true }),

        supabase
          .from("avr_vision_mission")
          .select("*")
          .limit(1)
          .maybeSingle(),

        supabase
          .from("avr_news")
          .select("*")
          .order("published_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("avr_information_services")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (hoursResult.error) throw hoursResult.error;
      if (visionResult.error) throw visionResult.error;
      if (newsResult.error) throw newsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      const loadedHours = hoursResult.data || [];

      setHours(loadedHours);

      if (loadedHours.length > 0) {
        setHoursForm(
          loadedHours.map((item) => ({
            id: item.id,
            day_name: item.day_name,
            opening_time: item.opening_time || "08:00",
            closing_time: item.closing_time || "17:00",
            is_closed: item.is_closed || false,
          }))
        );
      }

      setVisionMission(visionResult.data || null);
      setNews(newsResult.data || []);
      setServices(servicesResult.data || []);
    } catch (error) {
      console.error("AVR content loading error:", error);

      showAlert(
        error.message || "Unable to load AVR information.",
        "error"
      );
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  /* =====================================================
     FILTER REQUESTS
  ===================================================== */

  const filteredRequests = useMemo(() => {
    const searchValue = requestSearch
      .trim()
      .toLowerCase();

    return requests.filter((request) => {
      const status =
        request.status || "Pending";

      const matchesStatus =
        requestFilter === "All" ||
        status === requestFilter;

      const matchesType =
        requestTypeFilter === "All" ||
        request.request_type === requestTypeFilter;

      const searchable = [
        request.requester_name,
        request.requester_email,
        request.details,
        request.assigned_staff_name,
        request.request_type,
        request.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchable.includes(searchValue);

      return (
        matchesStatus &&
        matchesType &&
        matchesSearch
      );
    });
  }, [
    requests,
    requestSearch,
    requestFilter,
    requestTypeFilter,
  ]);

  /* =====================================================
     REQUEST COUNTS
  ===================================================== */

  const pendingCount = requests.filter(
    (item) =>
      (item.status || "Pending") === "Pending"
  ).length;

  const acceptedCount = requests.filter(
    (item) => item.status === "Accepted"
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === "Completed"
  ).length;

  const historyCount = requests.filter(
    (item) =>
      [
        "Completed",
        "Cancelled",
        "Not Available",
      ].includes(item.status)
  ).length;

  const technicalCount = requests.filter(
    (item) =>
      item.request_type === "Technical Assistance"
  ).length;

  const avrCount = requests.filter(
    (item) =>
      item.request_type === "AVR Request"
  ).length;

  /* =====================================================
     FORMATTERS
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    /*
      Handles both:
      2026-08-17
      2026-08-17T00:00:00+00:00
    */

    const dateOnly = date.slice(0, 10);

    const parsed = new Date(
      `${dateOnly}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";

    const [hour, minute] = time
      .slice(0, 5)
      .split(":");

    const date = new Date();

    date.setHours(
      Number(hour),
      Number(minute),
      0,
      0
    );

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const getStatusClass = (status) => {
    return (status || "Pending")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted":
        return <CheckCircle2 size={15} />;

      case "Completed":
        return <CircleCheck size={15} />;

      case "Cancelled":
      case "Not Available":
        return <XCircle size={15} />;

      default:
        return <Clock3 size={15} />;
    }
  };

  /* =====================================================
     UPDATE REQUEST
  ===================================================== */

  const updateRequestStatus = async (
    request,
    status
  ) => {
    if (!request?.id) return;

    try {
      if (
        status === "Accepted" &&
        request.assigned_staff_id
      ) {
        showAlert(
          `This request is already assigned to ${
            request.assigned_staff_name ||
            "another staff member"
          }.`,
          "error"
        );

        return;
      }

      if (status === "Accepted" && !currentUser) {
        showAlert(
          "You must be logged in before accepting a request.",
          "error"
        );

        return;
      }

      let updatePayload = {};

      if (status === "Accepted") {
        updatePayload = {
          status: "Accepted",
          assigned_staff_id: currentUser.id,
          assigned_staff_name: getStaffName(currentUser),
          assigned_at: new Date().toISOString(),
        };
      } else {
        updatePayload = { status };
      }

      let finalQuery = supabase
        .from("library_requests")
        .update(updatePayload)
        .eq("id", request.id);

      if (status === "Accepted") {
        finalQuery = finalQuery
          .is("assigned_staff_id", null)
          .eq("status", "Pending");
      }

      const { data, error } = await finalQuery
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        showAlert(
          "This request was already accepted or updated by another staff member.",
          "error"
        );

        await loadRequests();

        return;
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id ? data : item
        )
      );

      setSelectedRequest(null);

      if (status === "Accepted") {
        showAlert(
          "Request accepted and assigned to you."
        );
      } else if (status === "Completed") {
        showAlert(
          "Request marked as completed and moved to history."
        );
      } else if (status === "Cancelled") {
        showAlert(
          "Request cancelled and moved to history."
        );
      } else if (status === "Not Available") {
        showAlert(
          "Request marked as not available and moved to history."
        );
      }
    } catch (error) {
      console.error(
        "AVR request update error:",
        error
      );

      showAlert(
        error.message || "Unable to update request.",
        "error"
      );
    }
  };

  const confirmRequestStatus = (
    request,
    status
  ) => {
    const labels = {
      Accepted: {
        title: "Accept Request",
        message: `Are you sure you want to accept and assign this request to ${getStaffName(
          currentUser
        )}?`,
        confirmLabel: "Accept Request",
        tone: "success",
      },

      Completed: {
        title: "Complete Request",
        message:
          "Are you sure this request has been completed? It will be moved to Request History.",
        confirmLabel: "Mark Completed",
        tone: "success",
      },

      Cancelled: {
        title: "Cancel Request",
        message:
          "Are you sure you want to cancel this request? It will be moved to Request History.",
        confirmLabel: "Cancel Request",
        tone: "danger",
      },

      "Not Available": {
        title: "Mark Not Available",
        message:
          "Are you sure this request cannot be fulfilled? It will be moved to Request History.",
        confirmLabel: "Mark Not Available",
        tone: "danger",
      },
    };

    const config = labels[status];

    if (!config) return;

    openConfirmation({
      ...config,
      onConfirm: () =>
        updateRequestStatus(
          request,
          status
        ),
    });
  };

  /* =====================================================
     OPEN CONTENT MODAL
  ===================================================== */

  const openVisionModal = () => {
    setContentForm({
      id: visionMission?.id || null,
      title: visionMission?.title || "",
      body: visionMission?.body || "",
      image_url: visionMission?.image_url || "",
      published_date: "",
    });

    setContentModal("vision");
  };

  /*
    FIXED:
    Database may return:
      2026-08-17T00:00:00+00:00

    But <input type="date"> requires:
      2026-08-17
  */

  const openNewsModal = (item = null) => {
    setContentForm({
      id: item?.id || null,
      title: item?.title || "",
      body: item?.body || "",
      image_url: item?.image_url || "",
      published_date: item?.published_date
        ? formatDateForInput(
            item.published_date
          )
        : new Date()
            .toISOString()
            .slice(0, 10),
    });

    setContentModal("news");
  };

  const openServiceModal = (item = null) => {
    setContentForm({
      id: item?.id || null,
      title: item?.title || "",
      body: item?.body || "",
      image_url: item?.image_url || "",
      published_date: "",
    });

    setContentModal("service");
  };

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload = async (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert(
        "Please select an image file.",
        "error"
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert(
        "Image must be smaller than 5 MB.",
        "error"
      );

      return;
    }

    setUploadingImage(true);

    try {
      const extension =
        file.name.split(".").pop();

      const filePath = `content/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from(CONTENT_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicData,
      } = supabase.storage
        .from(CONTENT_BUCKET)
        .getPublicUrl(filePath);

      setContentForm((current) => ({
        ...current,
        image_url:
          publicData.publicUrl,
      }));

      showAlert(
        "Image uploaded successfully."
      );
    } catch (error) {
      console.error(
        "AVR image upload error:",
        error
      );

      showAlert(
        error.message ||
          "Unable to upload image.",
        "error"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  /* =====================================================
     SAVE CONTENT
  ===================================================== */

  const performSaveContent = async () => {
    try {
      /* ===================================================
         VISION & MISSION
      =================================================== */

      if (contentModal === "vision") {
        const payload = {
          title: contentForm.title.trim(),
          body: contentForm.body.trim(),
          image_url:
            contentForm.image_url || null,
          updated_at:
            new Date().toISOString(),
        };

        let result;

        if (contentForm.id) {
          result = await supabase
            .from("avr_vision_mission")
            .update(payload)
            .eq("id", contentForm.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from("avr_vision_mission")
            .insert(payload)
            .select()
            .single();
        }

        if (result.error) {
          throw result.error;
        }

        setVisionMission(result.data);

        showAlert(
          "Vision & Mission updated successfully."
        );
      }

      /* ===================================================
         NEWS
      =================================================== */

      if (contentModal === "news") {
        const selectedDate =
          contentForm.published_date ||
          new Date()
            .toISOString()
            .slice(0, 10);

        const payload = {
          title: contentForm.title.trim(),
          body: contentForm.body.trim(),
          image_url:
            contentForm.image_url || null,

          /*
            IMPORTANT FIX

            Example:
              selectedDate = "2026-08-17"

            Database receives:
              "2026-08-17T00:00:00+00:00"
          */
          published_date:
            formatDateForDatabase(
              selectedDate
            ),

          updated_at:
            new Date().toISOString(),
        };

        console.log(
          "Saving news published_date:",
          payload.published_date
        );

        let result;

        if (contentForm.id) {
          result = await supabase
            .from("avr_news")
            .update(payload)
            .eq("id", contentForm.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from("avr_news")
            .insert(payload)
            .select()
            .single();
        }

        if (result.error) {
          throw result.error;
        }

        await loadContent();

        showAlert(
          contentForm.id
            ? "News updated successfully."
            : "News added successfully."
        );
      }

      /* ===================================================
         INFORMATION & SERVICES
      =================================================== */

      if (contentModal === "service") {
        const payload = {
          title: contentForm.title.trim(),
          body: contentForm.body.trim(),
          image_url:
            contentForm.image_url || null,
          updated_at:
            new Date().toISOString(),
        };

        let result;

        if (contentForm.id) {
          result = await supabase
            .from("avr_information_services")
            .update(payload)
            .eq("id", contentForm.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from("avr_information_services")
            .insert(payload)
            .select()
            .single();
        }

        if (result.error) {
          throw result.error;
        }

        await loadContent();

        showAlert(
          contentForm.id
            ? "Information updated successfully."
            : "Information added successfully."
        );
      }

      setContentModal(null);
    } catch (error) {
      console.error(
        "Save content error:",
        error
      );

      showAlert(
        error.message ||
          "Unable to save content.",
        "error"
      );
    }
  };

  const saveContent = async (event) => {
    event.preventDefault();

    if (!contentForm.title.trim()) {
      showAlert(
        "Please enter a title.",
        "error"
      );

      return;
    }

    if (!contentForm.body.trim()) {
      showAlert(
        "Please enter the content.",
        "error"
      );

      return;
    }

    openConfirmation({
      title: contentForm.id
        ? "Save Changes"
        : "Add Content",

      message: contentForm.id
        ? "Are you sure you want to save these changes?"
        : "Are you sure you want to add this content?",

      confirmLabel: contentForm.id
        ? "Save Changes"
        : "Add Content",

      tone: "primary",

      onConfirm: () =>
        performSaveContent(),
    });
  };

  /* =====================================================
     DELETE CONTENT
  ===================================================== */

  const deleteContent = async (
    table,
    id,
    label
  ) => {
    try {
      const { error } =
        await supabase
          .from(table)
          .delete()
          .eq("id", id);

      if (error) throw error;

      await loadContent();

      showAlert(
        `${label} deleted successfully.`
      );
    } catch (error) {
      console.error(
        "Delete content error:",
        error
      );

      showAlert(
        error.message ||
          "Unable to delete content.",
        "error"
      );
    }
  };

  const confirmDeleteContent = (
    table,
    id,
    label
  ) => {
    openConfirmation({
      title: `Delete ${label}`,

      message:
        `Are you sure you want to delete this ${label}? This action cannot be undone.`,

      confirmLabel: "Delete",

      tone: "danger",

      onConfirm: () =>
        deleteContent(
          table,
          id,
          label
        ),
    });
  };

  /* =====================================================
     SAVE OPERATING HOURS
  ===================================================== */

  const saveHours = async () => {
    try {
      for (const item of hoursForm) {
        if (item.id) {
          const { error } =
            await supabase
              .from("avr_operating_hours")
              .update({
                day_name: item.day_name,
                opening_time:
                  item.opening_time || null,
                closing_time:
                  item.closing_time || null,
                is_closed:
                  item.is_closed,
                updated_at:
                  new Date().toISOString(),
              })
              .eq("id", item.id);

          if (error) throw error;
        } else {
          const { error } =
            await supabase
              .from("avr_operating_hours")
              .insert({
                day_name: item.day_name,
                opening_time:
                  item.opening_time || null,
                closing_time:
                  item.closing_time || null,
                is_closed:
                  item.is_closed,
              });

          if (error) throw error;
        }
      }

      await loadContent();

      showAlert(
        "Operating hours saved successfully."
      );
    } catch (error) {
      console.error(
        "Save hours error:",
        error
      );

      showAlert(
        error.message ||
          "Unable to save operating hours.",
        "error"
      );
    }
  };

  const confirmSaveHours = () => {
    openConfirmation({
      title: "Save Operating Hours",

      message:
        "Are you sure you want to save these operating hours?",

      confirmLabel: "Save Hours",

      tone: "primary",

      onConfirm: saveHours,
    });
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    openConfirmation({
      title: "Logout",

      message:
        "Are you sure you want to logout of the AVR Dashboard?",

      confirmLabel: "Logout",

      tone: "danger",

      onConfirm: async () => {
        const { error } =
          await supabase.auth.signOut();

        if (error) {
          showAlert(
            error.message ||
              "Unable to logout.",
            "error"
          );

          return;
        }

        window.location.href = "/login";
      },
    });
  };

  /* =====================================================
     SIDEBAR NAVIGATION
  ===================================================== */

  const navigateTo = (section) => {
    setActiveSection(section);
    setMobileSidebarOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     RENDER REQUEST ROW
  ===================================================== */

  const renderRequestRow = (request) => {
    const isPending =
      (request.status || "Pending") ===
      "Pending";

    const isAssignedToCurrentUser =
      currentUser &&
      request.assigned_staff_id ===
        currentUser.id;

    return (
      <tr key={request.id}>
        <td>
          <div className="avr-table-requester">
            <strong>
              {request.requester_name ||
                "Faculty Request"}
            </strong>

            <span>
              {request.requester_email ||
                "No email provided"}
            </span>
          </div>
        </td>

        <td>
          {request.request_type || "-"}
        </td>

        <td>
          {formatDate(
            request.request_date
          )}
        </td>

        <td>
          <span
            className={
              request.assigned_staff_name
                ? "assigned-name"
                : "unassigned-name"
            }
          >
            {request.assigned_staff_name ||
              "Not assigned"}
          </span>
        </td>

        <td>
          <span
            className={`avr-status ${getStatusClass(
              request.status
            )}`}
          >
            {getStatusIcon(
              request.status
            )}

            {request.status ||
              "Pending"}
          </span>
        </td>

        <td>
          <div className="avr-table-actions">
            <button
              type="button"
              className="avr-view-details-button"
              onClick={() =>
                setSelectedRequest(
                  request
                )
              }
            >
              <Eye size={16} />

              <span>
                View Details
              </span>

              <ChevronRight size={15} />
            </button>

            {isPending && (
              <button
                type="button"
                className="avr-accept-button"
                onClick={() =>
                  confirmRequestStatus(
                    request,
                    "Accepted"
                  )
                }
              >
                <CheckCircle2 size={15} />

                <span>
                  Accept
                </span>
              </button>
            )}

            {request.status ===
              "Accepted" &&
              isAssignedToCurrentUser && (
                <button
                  type="button"
                  className="avr-action-complete compact"
                  onClick={() =>
                    confirmRequestStatus(
                      request,
                      "Completed"
                    )
                  }
                >
                  <CircleCheck size={15} />
                </button>
              )}
          </div>
        </td>
      </tr>
    );
  };

  /* =====================================================
     DASHBOARD
  ===================================================== */

  const renderDashboard = () => {
    return (
      <>
        <section className="avr-welcome">
          <div>
            <span className="avr-eyebrow">
              AVR MANAGEMENT
            </span>

            <h1>
              Good day,{" "}
              {getStaffName(
                currentUser
              )}
            </h1>

            <p>
              Manage AVR requests,
              technical assistance,
              services, and AVR
              information from one
              dashboard.
            </p>
          </div>

          <button
            className="avr-refresh-main"
            onClick={() =>
              loadRequests(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "avr-spinning"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </section>

        <section className="avr-stat-grid">
          <div className="avr-stat-card">
            <div className="avr-stat-icon blue">
              <ClipboardList size={21} />
            </div>

            <div>
              <span>
                Pending Requests
              </span>

              <strong>
                {pendingCount}
              </strong>
            </div>
          </div>

          <div className="avr-stat-card">
            <div className="avr-stat-icon purple">
              <Users size={21} />
            </div>

            <div>
              <span>Assigned</span>

              <strong>
                {acceptedCount}
              </strong>
            </div>
          </div>

          <div className="avr-stat-card">
            <div className="avr-stat-icon green">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>Completed</span>

              <strong>
                {completedCount}
              </strong>
            </div>
          </div>

          <div className="avr-stat-card">
            <div className="avr-stat-icon orange">
              <History size={21} />
            </div>

            <div>
              <span>History</span>

              <strong>
                {historyCount}
              </strong>
            </div>
          </div>
        </section>

        <section className="avr-dashboard-grid">
          <div className="avr-dashboard-panel">
            <div className="avr-dashboard-panel-header">
              <div>
                <span className="avr-eyebrow">
                  REQUESTS
                </span>

                <h2>
                  Request Overview
                </h2>
              </div>

              <button
                className="avr-text-button"
                onClick={() =>
                  navigateTo(
                    "requests"
                  )
                }
              >
                View requests
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="avr-overview-list">
              <button
                onClick={() =>
                  navigateTo(
                    "requests"
                  )
                }
              >
                <div className="overview-icon blue">
                  <MonitorPlay size={18} />
                </div>

                <div>
                  <strong>
                    AVR Requests
                  </strong>

                  <span>
                    {avrCount} total
                    requests
                  </span>
                </div>

                <ChevronRight size={17} />
              </button>

              <button
                onClick={() =>
                  navigateTo(
                    "requests"
                  )
                }
              >
                <div className="overview-icon purple">
                  <Wrench size={18} />
                </div>

                <div>
                  <strong>
                    Technical Assistance
                  </strong>

                  <span>
                    {technicalCount} total
                    requests
                  </span>
                </div>

                <ChevronRight size={17} />
              </button>

              <button
                onClick={() =>
                  navigateTo(
                    "history"
                  )
                }
              >
                <div className="overview-icon green">
                  <History size={18} />
                </div>

                <div>
                  <strong>
                    Request History
                  </strong>

                  <span>
                    {historyCount} completed
                    or closed
                  </span>
                </div>

                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="avr-dashboard-panel">
            <div className="avr-dashboard-panel-header">
              <div>
                <span className="avr-eyebrow">
                  CONTENT
                </span>

                <h2>
                  AVR Information
                </h2>
              </div>
            </div>

            <div className="avr-content-shortcuts">
              <button
                onClick={() =>
                  navigateTo("hours")
                }
              >
                <Clock3 size={19} />
                Operating Hours
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() =>
                  navigateTo("vision")
                }
              >
                <Eye size={19} />
                Vision & Mission
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() =>
                  navigateTo("news")
                }
              >
                <Newspaper size={19} />
                AVR News
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() =>
                  navigateTo(
                    "services"
                  )
                }
              >
                <MonitorPlay size={19} />
                Information &
                Services
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </>
    );
  };

  /* =====================================================
     REQUESTS PAGE
  ===================================================== */

  const renderRequests = (
    historyOnly = false
  ) => {
    const historyStatuses = [
      "Completed",
      "Cancelled",
      "Not Available",
    ];

    const visibleRequests =
      historyOnly
        ? filteredRequests.filter(
            (item) =>
              historyStatuses.includes(
                item.status
              )
          )
        : filteredRequests.filter(
            (item) =>
              !historyStatuses.includes(
                item.status
              )
          );

    return (
      <section className="avr-page-section">
        <div className="avr-section-heading">
          <div>
            <span className="avr-eyebrow">
              {historyOnly
                ? "REQUEST HISTORY"
                : "SERVICE REQUESTS"}
            </span>

            <h1>
              {historyOnly
                ? "Request History"
                : "Faculty Requests"}
            </h1>

            <p>
              {historyOnly
                ? "Review completed and closed AVR and technical assistance requests."
                : "Review AVR and technical assistance requests submitted by faculty."}
            </p>
          </div>

          <button
            className="avr-refresh-main"
            onClick={() =>
              loadRequests(true)
            }
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "avr-spinning"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        <section className="avr-panel">
          <div className="avr-toolbar">
            <div className="avr-search">
              <Search size={18} />

              <input
                value={requestSearch}
                onChange={(event) =>
                  setRequestSearch(
                    event.target.value
                  )
                }
                placeholder="Search faculty, email, request, or assigned staff..."
              />
            </div>

            <div className="avr-filter-group">
              <select
                value={
                  requestTypeFilter
                }
                onChange={(event) =>
                  setRequestTypeFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Types
                </option>

                <option value="AVR Request">
                  AVR Requests
                </option>

                <option value="Technical Assistance">
                  Technical Assistance
                </option>
              </select>

              <select
                value={requestFilter}
                onChange={(event) =>
                  setRequestFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Status
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Accepted">
                  Accepted
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Not Available">
                  Not Available
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>
            </div>
          </div>

          <div className="avr-result-bar">
            <span>
              Showing{" "}
              <strong>
                {visibleRequests.length}
              </strong>{" "}
              requests
            </span>

            <span>
              {historyOnly
                ? "History"
                : "Active Requests"}
            </span>
          </div>

          {loadingRequests ? (
            <div className="avr-empty">
              <RefreshCw className="avr-spinning" />

              <strong>
                Loading requests...
              </strong>

              <span>
                Please wait.
              </span>
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="avr-empty">
              <ClipboardList size={32} />

              <strong>
                No requests found
              </strong>

              <span>
                Try changing your
                search or filters.
              </span>
            </div>
          ) : (
            <div className="avr-table-wrap">
              <table className="avr-request-table">
                <thead>
                  <tr>
                    <th>
                      Requester Name
                    </th>

                    <th>
                      Request Type
                    </th>

                    <th>
                      Date Needed
                    </th>

                    <th>
                      Assigned Staff
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      View Details
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRequests.map(
                    renderRequestRow
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    );
  };

  /* =====================================================
     OPERATING HOURS
  ===================================================== */

  const renderHours = () => {
    return (
      <section className="avr-page-section">
        <div className="avr-section-heading">
          <div>
            <span className="avr-eyebrow">
              AVR INFORMATION
            </span>

            <h1>
              Operating Hours
            </h1>

            <p>
              Set the days and hours when
              the AVR service is available.
            </p>
          </div>

          <button
            className="avr-primary-button"
            onClick={confirmSaveHours}
          >
            <Save size={17} />
            Save Hours
          </button>
        </div>

        <div className="avr-content-panel">
          <div className="avr-hours-list">
            {hoursForm.map(
              (item, index) => (
                <div
                  className="avr-hours-row"
                  key={
                    item.id ||
                    item.day_name
                  }
                >
                  <div className="avr-day">
                    <strong>
                      {item.day_name}
                    </strong>
                  </div>

                  <label className="avr-switch-label">
                    <input
                      type="checkbox"
                      checked={!item.is_closed}
                      onChange={(event) => {
                        const next = [
                          ...hoursForm,
                        ];

                        next[index] = {
                          ...next[index],
                          is_closed:
                            !event.target.checked,
                        };

                        setHoursForm(next);
                      }}
                    />

                    <span className="avr-switch" />

                    Open
                  </label>

                  <input
                    type="time"
                    value={
                      item.opening_time ||
                      ""
                    }
                    disabled={
                      item.is_closed
                    }
                    onChange={(event) => {
                      const next = [
                        ...hoursForm,
                      ];

                      next[index] = {
                        ...next[index],
                        opening_time:
                          event.target.value,
                      };

                      setHoursForm(next);
                    }}
                  />

                  <span className="avr-time-separator">
                    to
                  </span>

                  <input
                    type="time"
                    value={
                      item.closing_time ||
                      ""
                    }
                    disabled={
                      item.is_closed
                    }
                    onChange={(event) => {
                      const next = [
                        ...hoursForm,
                      ];

                      next[index] = {
                        ...next[index],
                        closing_time:
                          event.target.value,
                      };

                      setHoursForm(next);
                    }}
                  />

                  {item.is_closed && (
                    <span className="avr-closed-label">
                      Closed
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    );
  };

  /* =====================================================
     VISION & MISSION
  ===================================================== */

  const renderVisionMission = () => {
    return (
      <section className="avr-page-section">
        <div className="avr-section-heading">
          <div>
            <span className="avr-eyebrow">
              AVR INFORMATION
            </span>

            <h1>
              Vision & Mission
            </h1>

            <p>
              Manage the public Vision and
              Mission information displayed
              by the AVR.
            </p>
          </div>

          <button
            className="avr-primary-button"
            onClick={openVisionModal}
          >
            <Pencil size={17} />
            Edit
          </button>
        </div>

        <div className="avr-vision-card">
          {visionMission?.image_url && (
            <img
              src={
                visionMission.image_url
              }
              alt="Vision and Mission"
            />
          )}

          <div className="avr-vision-content">
            <span className="avr-eyebrow">
              INSTRUCTIONAL MEDIA CENTER
            </span>

            <h2>
              {visionMission?.title ||
                "Vision & Mission"}
            </h2>

            <p>
              {visionMission?.body ||
                "No Vision & Mission information has been added yet."}
            </p>
          </div>
        </div>
      </section>
    );
  };

  /* =====================================================
     NEWS
  ===================================================== */

  const renderNews = () => {
    return (
      <section className="avr-page-section">
        <div className="avr-section-heading">
          <div>
            <span className="avr-eyebrow">
              AVR INFORMATION
            </span>

            <h1>
              AVR News
            </h1>

            <p>
              Publish announcements,
              updates, and AVR-related
              news.
            </p>
          </div>

          <button
            className="avr-primary-button"
            onClick={() =>
              openNewsModal()
            }
          >
            <Plus size={17} />
            Add News
          </button>
        </div>

        {news.length === 0 ? (
          <div className="avr-content-panel">
            <div className="avr-empty">
              <Newspaper size={32} />

              <strong>
                No AVR news yet
              </strong>

              <span>
                Add your first news
                article.
              </span>
            </div>
          </div>
        ) : (
          <div className="avr-news-grid">
            {news.map((item) => (
              <article
                className="avr-news-card"
                key={item.id}
              >
                {item.image_url ? (
                  <img
                    src={
                      item.image_url
                    }
                    alt={item.title}
                  />
                ) : (
                  <div className="avr-image-placeholder">
                    <ImageIcon size={30} />
                  </div>
                )}

                <div className="avr-news-card-body">
                  <span className="avr-news-date">
                    <CalendarDays size={14} />

                    {formatDate(
                      item.published_date
                    )}
                  </span>

                  <h2>
                    {item.title}
                  </h2>

                  <p>
                    {item.body}
                  </p>

                  <div className="avr-card-actions">
                    <button
                      onClick={() =>
                        openNewsModal(
                          item
                        )
                      }
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        confirmDeleteContent(
                          "avr_news",
                          item.id,
                          "news article"
                        )
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  /* =====================================================
     SERVICES
  ===================================================== */

  const renderServices = () => {
    return (
      <section className="avr-page-section">
        <div className="avr-section-heading">
          <div>
            <span className="avr-eyebrow">
              AVR INFORMATION
            </span>

            <h1>
              AVR Information & Services
            </h1>

            <p>
              Manage information about AVR
              facilities, equipment, and
              services.
            </p>
          </div>

          <button
            className="avr-primary-button"
            onClick={() =>
              openServiceModal()
            }
          >
            <Plus size={17} />
            Add Information
          </button>
        </div>

        {services.length === 0 ? (
          <div className="avr-content-panel">
            <div className="avr-empty">
              <MonitorPlay size={32} />

              <strong>
                No information yet
              </strong>

              <span>
                Add AVR services and
                information.
              </span>
            </div>
          </div>
        ) : (
          <div className="avr-services-grid">
            {services.map((item) => (
              <article
                className="avr-service-card"
                key={item.id}
              >
                {item.image_url ? (
                  <img
                    src={
                      item.image_url
                    }
                    alt={item.title}
                  />
                ) : (
                  <div className="avr-image-placeholder">
                    <ImageIcon size={30} />
                  </div>
                )}

                <div className="avr-service-body">
                  <h2>
                    {item.title}
                  </h2>

                  <p>
                    {item.body}
                  </p>

                  <div className="avr-card-actions">
                    <button
                      onClick={() =>
                        openServiceModal(
                          item
                        )
                      }
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        confirmDeleteContent(
                          "avr_information_services",
                          item.id,
                          "information"
                        )
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  /* =====================================================
     CONTENT MODAL
  ===================================================== */

  const renderContentModal = () => {
    if (!contentModal) return null;

    const isNews =
      contentModal === "news";

    const isVision =
      contentModal === "vision";

    return (
      <div
        className="avr-modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            setContentModal(null);
          }
        }}
      >
        <div className="avr-modal">
          <div className="avr-modal-header">
            <div>
              <span className="avr-eyebrow">
                AVR CONTENT
              </span>

              <h2>
                {contentForm.id
                  ? "Edit"
                  : "Add"}{" "}
                {isVision
                  ? "Vision & Mission"
                  : isNews
                  ? "News"
                  : "Information & Service"}
              </h2>
            </div>

            <button
              className="avr-modal-close"
              onClick={() =>
                setContentModal(null)
              }
            >
              <X size={20} />
            </button>
          </div>

          <form
            className="avr-modal-form"
            onSubmit={saveContent}
          >
            <label>
              Title

              <input
                value={
                  contentForm.title
                }
                onChange={(event) =>
                  setContentForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Enter title"
              />
            </label>

            {isNews && (
              <label>
                Date

                <input
                  type="date"
                  value={
                    contentForm.published_date
                  }
                  onChange={(event) =>
                    setContentForm(
                      (current) => ({
                        ...current,
                        published_date:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>
            )}

            <label>
              Image

              <div className="avr-upload-box">
                {contentForm.image_url ? (
                  <img
                    src={
                      contentForm.image_url
                    }
                    alt="Preview"
                  />
                ) : (
                  <ImageIcon size={28} />
                )}

                <div>
                  <strong>
                    Upload image
                  </strong>

                  <span>
                    PNG, JPG or WEBP
                    up to 5 MB
                  </span>
                </div>

                <label className="avr-upload-button">
                  <Upload size={16} />

                  {uploadingImage
                    ? "Uploading..."
                    : "Choose Image"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageUpload
                    }
                    disabled={
                      uploadingImage
                    }
                  />
                </label>
              </div>
            </label>

            <label>
              Body

              <textarea
                rows="8"
                value={
                  contentForm.body
                }
                onChange={(event) =>
                  setContentForm(
                    (current) => ({
                      ...current,
                      body:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Enter information..."
              />
            </label>

            <div className="avr-modal-actions">
              <button
                type="button"
                className="avr-secondary-button"
                onClick={() =>
                  setContentModal(null)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="avr-primary-button"
                disabled={
                  uploadingImage
                }
              >
                <Save size={17} />
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  /* =====================================================
     REQUEST MODAL
  ===================================================== */

  const renderRequestModal = () => {
    if (!selectedRequest) return null;

    const request =
      selectedRequest;

    const isPending =
      (request.status || "Pending") ===
      "Pending";

    const isAssignedToCurrentUser =
      currentUser &&
      request.assigned_staff_id ===
        currentUser.id;

    return (
      <div
        className="avr-modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            setSelectedRequest(null);
          }
        }}
      >
        <div className="avr-request-modal">
          <div className="avr-modal-header">
            <div>
              <span className="avr-eyebrow">
                SERVICE REQUEST
              </span>

              <h2>
                Request Details
              </h2>
            </div>

            <button
              className="avr-modal-close"
              onClick={() =>
                setSelectedRequest(
                  null
                )
              }
            >
              <X size={20} />
            </button>
          </div>

          <div className="avr-modal-request-content">
            <div className="avr-modal-request-heading">
              <div className="avr-modal-request-icon">
                {request.request_type ===
                "Technical Assistance" ? (
                  <Wrench size={25} />
                ) : (
                  <MonitorPlay size={25} />
                )}
              </div>

              <div>
                <span>
                  {request.request_type}
                </span>

                <h3>
                  {request.requester_name ||
                    "Faculty Request"}
                </h3>
              </div>

              <div
                className={`avr-status ${getStatusClass(
                  request.status
                )}`}
              >
                {getStatusIcon(
                  request.status
                )}

                {request.status ||
                  "Pending"}
              </div>
            </div>

            <div className="avr-modal-info-grid">
              <div>
                <span>
                  Faculty
                </span>

                <strong>
                  {request.requester_name ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {request.requester_email ||
                    "-"}
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
                  Assigned Staff
                </span>

                <strong>
                  {request.assigned_staff_name ||
                    "Not assigned"}
                </strong>
              </div>
            </div>

            <div className="avr-modal-detail-box">
              <span>
                REQUEST DETAILS
              </span>

              <p>
                {request.details ||
                  "No details provided."}
              </p>
            </div>

            <div className="avr-modal-meta">
              <div>
                <CalendarDays size={16} />

                Submitted{" "}
                {formatDateTime(
                  request.created_at
                )}
              </div>

              {request.assigned_at && (
                <div>
                  <Users size={16} />

                  Assigned{" "}
                  {formatDateTime(
                    request.assigned_at
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="avr-modal-actions">
            {isPending && (
              <button
                className="avr-action-accept"
                onClick={() =>
                  confirmRequestStatus(
                    request,
                    "Accepted"
                  )
                }
              >
                <CheckCircle2 size={16} />

                Accept & Assign to Me
              </button>
            )}

            {request.status ===
              "Accepted" &&
              isAssignedToCurrentUser && (
                <button
                  className="avr-action-complete"
                  onClick={() =>
                    confirmRequestStatus(
                      request,
                      "Completed"
                    )
                  }
                >
                  <CircleCheck size={16} />

                  Complete Request
                </button>
              )}

            {(isPending ||
              request.status ===
                "Accepted") && (
              <button
                className="avr-action-unavailable"
                onClick={() =>
                  confirmRequestStatus(
                    request,
                    "Cancelled"
                  )
                }
              >
                <XCircle size={16} />

                Cancel Request
              </button>
            )}

            <button
              className="avr-secondary-button"
              onClick={() =>
                setSelectedRequest(null)
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
     CONFIRMATION MODAL RENDERER
  ===================================================== */

  const renderConfirmationModal = () => {
    if (!confirmation) return null;

    const handleConfirm = async () => {
      const action =
        confirmation.onConfirm;

      setConfirmation(null);

      await action?.();
    };

    return (
      <div
        className="avr-modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeConfirmation();
          }
        }}
      >
        <div
          className="avr-confirm-modal"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`avr-confirm-icon ${
              confirmation.tone ||
              "primary"
            }`}
          >
            {confirmation.tone ===
            "danger" ? (
              <AlertCircle size={25} />
            ) : (
              <CircleCheck size={25} />
            )}
          </div>

          <div className="avr-confirm-content">
            <h2>
              {confirmation.title}
            </h2>

            <p>
              {confirmation.message}
            </p>
          </div>

          <div className="avr-confirm-actions">
            <button
              type="button"
              className="avr-secondary-button"
              onClick={
                closeConfirmation
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className={`avr-confirm-button ${
                confirmation.tone ||
                "primary"
              }`}
              onClick={
                handleConfirm
              }
            >
              {confirmation.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     SIDEBAR
  ===================================================== */

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      id: "requests",
      label: "Requests",
      icon: ClipboardList,
      badge: pendingCount,
    },

    {
      id: "history",
      label: "History",
      icon: History,
    },

    {
      id: "hours",
      label: "Operating Hours",
      icon: Clock3,
    },

    {
      id: "vision",
      label: "Vision & Mission",
      icon: Eye,
    },

    {
      id: "news",
      label: "AVR News",
      icon: Newspaper,
    },

    {
      id: "services",
      label: "Information & Services",
      icon: MonitorPlay,
    },
  ];

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <div className="avr-dashboard">

      {/* ALERT */}

      {alert && (
        <div
          className={`avr-alert ${alert.type}`}
        >
          <div className="avr-alert-icon">
            {alert.type ===
            "error" ? (
              <AlertCircle size={19} />
            ) : (
              <CircleCheck size={19} />
            )}
          </div>

          <span>
            {alert.message}
          </span>

          <button
            onClick={() =>
              setAlert(null)
            }
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* MOBILE MENU BUTTON */}

      <button
        className="avr-mobile-menu"
        onClick={() =>
          setMobileSidebarOpen(true)
        }
      >
        <Menu size={21} />
      </button>

      {/* SIDEBAR OVERLAY */}

      {mobileSidebarOpen && (
        <div
          className="avr-sidebar-overlay"
          onClick={() =>
            setMobileSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`avr-sidebar ${
          mobileSidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="avr-sidebar-top">
          <div className="avr-sidebar-brand">
            <img
              src="/src/assets/hfalogo.png"
              alt="IMC"
            />

            <div>
              <strong>
                AVR Dashboard
              </strong>

              <span>
                Instructional Media Center
              </span>
            </div>
          </div>

          <button
            className="avr-sidebar-mobile-close"
            onClick={() =>
              setMobileSidebarOpen(
                false
              )
            }
          >
            <X size={20} />
          </button>

          <div className="avr-login-as">
            <span>
              LOGIN AS
            </span>

            <strong>
              {getStaffName(
                currentUser
              )}
            </strong>

            <small>
              {currentUser?.email ||
                "Staff account"}
            </small>
          </div>

          <nav className="avr-sidebar-nav">
            {sidebarItems.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <button
                    key={item.id}
                    className={
                      activeSection ===
                      item.id
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navigateTo(
                        item.id
                      )
                    }
                  >
                    <Icon size={19} />

                    <span>
                      {item.label}
                    </span>

                    {item.badge > 0 && (
                      <b>
                        {item.badge}
                      </b>
                    )}
                  </button>
                );
              }
            )}
          </nav>
        </div>

        <div className="avr-sidebar-bottom">
          <button
            className="avr-sidebar-logout"
            onClick={
              handleLogout
            }
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}

      <main className="avr-main">
        <div className="avr-container">
          {activeSection ===
            "dashboard" &&
            renderDashboard()}

          {activeSection ===
            "requests" &&
            renderRequests(false)}

          {activeSection ===
            "history" &&
            renderRequests(true)}

          {activeSection ===
            "hours" &&
            renderHours()}

          {activeSection ===
            "vision" &&
            renderVisionMission()}

          {activeSection ===
            "news" &&
            renderNews()}

          {activeSection ===
            "services" &&
            renderServices()}
        </div>

        <footer className="avr-footer">
          © 2026 Instructional Media
          Center. All rights reserved.
        </footer>
      </main>

      {renderContentModal()}
      {renderRequestModal()}
      {renderConfirmationModal()}
    </div>
  );
}

export default AvrDashboard;