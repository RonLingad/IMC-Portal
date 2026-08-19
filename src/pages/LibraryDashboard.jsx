import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Clock3,
  Target,
  Building2,
  Newspaper,
  Users,
  Megaphone,
  ClipboardList,
  History,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CircleCheck,
  Menu,
  Upload,
  Loader2,
  Search,
  Eye,
  UserCheck,
  User,
  LogOut,
} from "lucide-react";

import { supabase } from "../services/supabase";
import "./LibraryDashboard.css";

function LibraryDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // CURRENT STAFF
  // =====================================================

  const [currentUser, setCurrentUser] = useState(null);

  // =====================================================
  // DATA
  // =====================================================

  const [schedules, setSchedules] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [news, setNews] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [clubNews, setClubNews] = useState([]);
  const [requests, setRequests] = useState([]);

  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");

  // =====================================================
  // REQUEST FILTERS
  // =====================================================

  const [requestSearch, setRequestSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const [requestStatusFilter, setRequestStatusFilter] =
    useState("All");

  const [historyStatusFilter, setHistoryStatusFilter] =
    useState("All");

  // =====================================================
  // REQUEST DETAILS MODAL
  // =====================================================

  const [selectedRequest, setSelectedRequest] = useState(null);

  // =====================================================
  // CONTENT MODAL
  // =====================================================

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    name: "",
    body: "",
    description: "",
    date: "",
    image: null,
    existingImage: "",
    day: "Monday",
    opening: "07:00",
    closing: "19:00",
  });

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);

      await loadLibraryData();
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to load dashboard",
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LIBRARY REQUEST FILTER
  // =====================================================
  // IMPORTANT:
  // The library_requests table may contain requests
  // for Library, AVR, and Technical.
  //
  // Library Dashboard should ONLY see Library requests.
  // =====================================================

  const isLibraryRequest = (request) => {
    const type = (request.request_type || "")
      .trim()
      .toLowerCase();

    return (
      type === "library" ||
      type === "library request"
    );
  };

  // =====================================================
  // LOAD LIBRARY DATA
  // =====================================================

  const loadLibraryData = async () => {
    try {
      const [
        schedulesResult,
        spacesResult,
        newsResult,
        clubsResult,
        clubNewsResult,
        requestsResult,
        settingsResult,
      ] = await Promise.all([
        supabase
          .from("library_hours")
          .select("*")
          .order("created_at", { ascending: true }),

        supabase
          .from("library_spaces")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("library_news")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("library_clubs")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("library_club_news")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("library_requests")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("library_settings")
          .select("*")
          .limit(1)
          .maybeSingle(),
      ]);

      if (schedulesResult.error) {
        throw schedulesResult.error;
      }

      if (spacesResult.error) {
        throw spacesResult.error;
      }

      if (newsResult.error) {
        throw newsResult.error;
      }

      if (clubsResult.error) {
        throw clubsResult.error;
      }

      if (clubNewsResult.error) {
        throw clubNewsResult.error;
      }

      if (requestsResult.error) {
        throw requestsResult.error;
      }

      setSchedules(schedulesResult.data || []);
      setSpaces(spacesResult.data || []);
      setNews(newsResult.data || []);
      setClubs(clubsResult.data || []);
      setClubNews(clubNewsResult.data || []);

      // =================================================
      // IMPORTANT FIX
      // ONLY STORE LIBRARY REQUESTS
      // =================================================

      const libraryRequests = (
        requestsResult.data || []
      ).filter(isLibraryRequest);

      setRequests(libraryRequests);

      if (settingsResult.data) {
        setVision(settingsResult.data.vision || "");
        setMission(settingsResult.data.mission || "");
      }
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to load Library data",
        error.message
      );
    }
  };

  // =====================================================
  // ALERT
  // =====================================================

  const showAlert = (type, title, message) => {
    window.dispatchEvent(
      new CustomEvent("library-alert", {
        detail: {
          type,
          title,
          message,
        },
      })
    );
  };

  // =====================================================
  // MENU
  // =====================================================

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={19} />,
    },
    {
      id: "schedule",
      label: "Operating Hours",
      icon: <Clock3 size={19} />,
    },
    {
      id: "vision",
      label: "Library Information",
      icon: <Target size={19} />,
    },
    {
      id: "spaces",
      label: "Spaces & Areas",
      icon: <Building2 size={19} />,
    },
    {
      id: "news",
      label: "Library News",
      icon: <Newspaper size={19} />,
    },
    {
      id: "clubs",
      label: "Library Information",
      icon: <Users size={19} />,
    },
    {
      id: "club-news",
      label: "What To Know",
      icon: <Megaphone size={19} />,
    },
    {
      id: "requests",
      label: "Requests",
      icon: <ClipboardList size={19} />,
    },
    {
      id: "history",
      label: "History",
      icon: <History size={19} />,
    },
  ];

  const changeSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // =====================================================
  // STAFF NAME
  // =====================================================

  const getStaffName = () => {
    if (!currentUser) return "Staff";

    return (
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email ||
      "Staff"
    );
  };

  const getStaffEmail = () => {
    return currentUser?.email || "";
  };

  // =====================================================
  // REQUEST COUNTS
  // =====================================================

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  );

  const acceptedRequests = requests.filter(
    (request) => request.status === "Accepted"
  );

  const historyRequests = requests.filter((request) =>
    [
      "Completed",
      "Cancelled",
      "Not Available",
    ].includes(request.status)
  );

  // =====================================================
  // FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      title: "",
      name: "",
      body: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      image: null,
      existingImage: "",
      day: "Monday",
      opening: "07:00",
      closing: "19:00",
    });
  };

  const openAddModal = (type) => {
    setEditingItem(null);
    resetForm();
    setModalType(type);
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    setEditingItem(item);
    setModalType(type);

    setForm({
      title: item.title || "",
      name: item.name || "",
      body: item.body || "",
      description: item.description || "",
      date: item.date || "",
      image: null,
      existingImage: item.image_url || "",
      day: item.day || "Monday",
      opening: item.opening_time
        ? item.opening_time.substring(0, 5)
        : "07:00",
      closing: item.closing_time
        ? item.closing_time.substring(0, 5)
        : "19:00",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert(
        "error",
        "Invalid image",
        "Please select an image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert(
        "error",
        "Image too large",
        "Image must be smaller than 5MB."
      );
      return;
    }

    setForm((current) => ({
      ...current,
      image: file,
    }));
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const uploadImage = async (file) => {
    if (!file) return null;

    const extension = file.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;

    const filePath = `library/${fileName}`;

    const { error } = await supabase.storage
      .from("library-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("library-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const deleteImageFromUrl = async (imageUrl) => {
    if (!imageUrl) return;

    try {
      const marker = "/library-images/";

      if (!imageUrl.includes(marker)) return;

      const filePath = imageUrl.split(marker)[1];

      if (!filePath) return;

      await supabase.storage
        .from("library-images")
        .remove([filePath]);
    } catch (error) {
      console.error(
        "Image deletion error:",
        error
      );
    }
  };

  // =====================================================
  // SAVE CONTENT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      modalType !== "schedule" &&
      modalType !== "club"
    ) {
      if (!form.title.trim()) {
        showAlert(
          "warning",
          "Missing title",
          "Please enter a title."
        );
        return;
      }

      if (!form.body.trim()) {
        showAlert(
          "warning",
          "Missing content",
          "Please enter the body/content."
        );
        return;
      }

      if (!form.date) {
        showAlert(
          "warning",
          "Missing date",
          "Please select a date."
        );
        return;
      }
    }

    if (
      modalType === "club" &&
      !form.name.trim()
    ) {
      showAlert(
        "warning",
        "Missing club name",
        "Please enter the club name."
      );
      return;
    }

    setSaving(true);

    try {
      let imageUrl =
        form.existingImage || null;

      if (form.image) {
        imageUrl = await uploadImage(form.image);
      }

      // ===================================================
      // SPACE
      // ===================================================

      if (modalType === "space") {
        const payload = {
          title: form.title.trim(),
          body: form.body.trim(),
          date: form.date,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        };

        if (editingItem) {
          const { data, error } =
            await supabase
              .from("library_spaces")
              .update(payload)
              .eq("id", editingItem.id)
              .select()
              .single();

          if (error) throw error;

          setSpaces((current) =>
            current.map((item) =>
              item.id === editingItem.id
                ? data
                : item
            )
          );

          if (
            form.image &&
            editingItem.image_url &&
            editingItem.image_url !== imageUrl
          ) {
            await deleteImageFromUrl(
              editingItem.image_url
            );
          }
        } else {
          const { data, error } =
            await supabase
              .from("library_spaces")
              .insert({
                ...payload,
                created_at:
                  new Date().toISOString(),
              })
              .select()
              .single();

          if (error) throw error;

          setSpaces((current) => [
            data,
            ...current,
          ]);
        }
      }

      // ===================================================
      // NEWS
      // ===================================================

      if (modalType === "news") {
        const payload = {
          title: form.title.trim(),
          body: form.body.trim(),
          date: form.date,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        };

        if (editingItem) {
          const { data, error } =
            await supabase
              .from("library_news")
              .update(payload)
              .eq("id", editingItem.id)
              .select()
              .single();

          if (error) throw error;

          setNews((current) =>
            current.map((item) =>
              item.id === editingItem.id
                ? data
                : item
            )
          );

          if (
            form.image &&
            editingItem.image_url &&
            editingItem.image_url !== imageUrl
          ) {
            await deleteImageFromUrl(
              editingItem.image_url
            );
          }
        } else {
          const { data, error } =
            await supabase
              .from("library_news")
              .insert({
                ...payload,
                created_at:
                  new Date().toISOString(),
              })
              .select()
              .single();

          if (error) throw error;

          setNews((current) => [
            data,
            ...current,
          ]);
        }
      }

      // ===================================================
      // CLUBS
      // ===================================================

      if (modalType === "club") {
        const payload = {
          name: form.name.trim(),
          description:
            form.description.trim(),
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        };

        if (editingItem) {
          const { data, error } =
            await supabase
              .from("library_clubs")
              .update(payload)
              .eq("id", editingItem.id)
              .select()
              .single();

          if (error) throw error;

          setClubs((current) =>
            current.map((item) =>
              item.id === editingItem.id
                ? data
                : item
            )
          );

          if (
            form.image &&
            editingItem.image_url &&
            editingItem.image_url !== imageUrl
          ) {
            await deleteImageFromUrl(
              editingItem.image_url
            );
          }
        } else {
          const { data, error } =
            await supabase
              .from("library_clubs")
              .insert({
                ...payload,
                created_at:
                  new Date().toISOString(),
              })
              .select()
              .single();

          if (error) throw error;

          setClubs((current) => [
            data,
            ...current,
          ]);
        }
      }

      // ===================================================
      // CLUB NEWS
      // ===================================================

      if (modalType === "club-news") {
        const payload = {
          title: form.title.trim(),
          body: form.body.trim(),
          date: form.date,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        };

        if (editingItem) {
          const { data, error } =
            await supabase
              .from("library_club_news")
              .update(payload)
              .eq("id", editingItem.id)
              .select()
              .single();

          if (error) throw error;

          setClubNews((current) =>
            current.map((item) =>
              item.id === editingItem.id
                ? data
                : item
            )
          );

          if (
            form.image &&
            editingItem.image_url &&
            editingItem.image_url !== imageUrl
          ) {
            await deleteImageFromUrl(
              editingItem.image_url
            );
          }
        } else {
          const { data, error } =
            await supabase
              .from("library_club_news")
              .insert({
                ...payload,
                created_at:
                  new Date().toISOString(),
              })
              .select()
              .single();

          if (error) throw error;

          setClubNews((current) => [
            data,
            ...current,
          ]);
        }
      }

      // ===================================================
      // SCHEDULE
      // ===================================================

      if (modalType === "schedule") {
        const payload = {
          day: form.day,
          opening_time: form.opening,
          closing_time: form.closing,
          updated_at: new Date().toISOString(),
        };

        if (editingItem) {
          const { data, error } =
            await supabase
              .from("library_hours")
              .update(payload)
              .eq("id", editingItem.id)
              .select()
              .single();

          if (error) throw error;

          setSchedules((current) =>
            current.map((item) =>
              item.id === editingItem.id
                ? data
                : item
            )
          );
        } else {
          const { data, error } =
            await supabase
              .from("library_hours")
              .insert({
                ...payload,
                created_at:
                  new Date().toISOString(),
              })
              .select()
              .single();

          if (error) throw error;

          setSchedules((current) => [
            ...current,
            data,
          ]);
        }
      }

      closeModal();

      showAlert(
        "success",
        editingItem
          ? "Updated successfully"
          : "Added successfully",
        "The information has been saved."
      );
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to save",
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteRecord = async (
    table,
    id,
    setter,
    imageUrl = null
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;

      setter((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      if (imageUrl) {
        await deleteImageFromUrl(imageUrl);
      }

      showAlert(
        "success",
        "Deleted successfully",
        "The item has been removed."
      );
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to delete",
        error.message
      );
    }
  };

  // =====================================================
  // ASSIGN REQUEST TO ME
  // =====================================================

  const assignRequestToMe = async (requestId) => {
    if (!currentUser) {
      showAlert(
        "error",
        "Not logged in",
        "Please log in again."
      );
      return;
    }

    try {
      const { data, error } =
        await supabase.rpc(
          "assign_library_request",
          {
            p_request_id: requestId,
          }
        );

      if (error) throw error;

      if (!data) {
        showAlert(
          "warning",
          "Request already assigned",
          "Another staff member is already responsible for this request."
        );
        return;
      }

      // Extra protection:
      // Never put non-library request into this dashboard.
      if (!isLibraryRequest(data)) {
        showAlert(
          "error",
          "Invalid request",
          "This request does not belong to the Library."
        );
        return;
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? data
            : request
        )
      );

      setSelectedRequest(data);

      showAlert(
        "success",
        "Request assigned",
        "You are now responsible for this request."
      );
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to assign request",
        error.message
      );
    }
  };

  // =====================================================
  // COMPLETE REQUEST
  // =====================================================

  const completeRequest = async (request) => {
    if (!isAssignedToCurrentUser(request)) {
      showAlert(
        "error",
        "Action not allowed",
        "Only the assigned staff member can complete this request."
      );
      return;
    }

    try {
      const { data, error } =
        await supabase
          .from("library_requests")
          .update({
            status: "Completed",
            completed_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", request.id)
          .eq(
            "assigned_staff_id",
            currentUser.id
          )
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

      setSelectedRequest(null);

      showAlert(
        "success",
        "Request completed",
        "The request has been moved to History."
      );
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to complete request",
        error.message
      );
    }
  };

  // =====================================================
  // CANCEL REQUEST
  // =====================================================

  const cancelRequest = async (request) => {
    if (!isAssignedToCurrentUser(request)) {
      showAlert(
        "error",
        "Action not allowed",
        "Only the assigned staff member can cancel this request."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this request?"
    );

    if (!confirmed) return;

    try {
      const { data, error } =
        await supabase
          .from("library_requests")
          .update({
            status: "Cancelled",
            cancelled_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", request.id)
          .eq(
            "assigned_staff_id",
            currentUser.id
          )
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

      setSelectedRequest(null);

      showAlert(
        "success",
        "Request cancelled",
        "The request has been moved to History."
      );
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to cancel request",
        error.message
      );
    }
  };

  const isAssignedToCurrentUser = (request) => {
    return (
      currentUser &&
      request.assigned_staff_id ===
        currentUser.id
    );
  };

  // =====================================================
  // REQUEST SEARCH
  // =====================================================

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // =================================================
      // EXTRA SAFETY
      // =================================================
      // Even if something accidentally enters state,
      // the Library Dashboard will still reject it.
      // =================================================

      if (!isLibraryRequest(request)) {
        return false;
      }

      const isActive = [
        "Pending",
        "Accepted",
      ].includes(request.status);

      if (!isActive) return false;

      const search = requestSearch
        .trim()
        .toLowerCase();

      const matchesSearch =
        !search ||
        (request.requester_name || "")
          .toLowerCase()
          .includes(search) ||
        (request.request_type || "")
          .toLowerCase()
          .includes(search) ||
        (request.details || "")
          .toLowerCase()
          .includes(search) ||
        (request.assigned_staff_name || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        requestStatusFilter === "All" ||
        request.status ===
          requestStatusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    requests,
    requestSearch,
    requestStatusFilter,
  ]);

  // =====================================================
  // HISTORY FILTER
  // =====================================================

  const filteredHistory = useMemo(() => {
    return requests.filter((request) => {
      // Extra Library-only protection
      if (!isLibraryRequest(request)) {
        return false;
      }

      const isHistory = [
        "Completed",
        "Cancelled",
        "Not Available",
      ].includes(request.status);

      if (!isHistory) return false;

      const search = historySearch
        .trim()
        .toLowerCase();

      const matchesSearch =
        !search ||
        (request.requester_name || "")
          .toLowerCase()
          .includes(search) ||
        (request.request_type || "")
          .toLowerCase()
          .includes(search) ||
        (request.details || "")
          .toLowerCase()
          .includes(search) ||
        (request.assigned_staff_name || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        historyStatusFilter === "All" ||
        request.status ===
          historyStatusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    requests,
    historySearch,
    historyStatusFilter,
  ]);

  // =====================================================
  // DASHBOARD
  // =====================================================

  const renderDashboard = () => (
    <>
      <PageHeader
        title="Library Dashboard"
        description="Manage library information, staff requests, and content."
      />

      <div className="library-welcome-card">
        <div>
          <span className="library-eyebrow">
            LOGGED IN AS
          </span>

          <h2>{getStaffName()}</h2>

          <p>{getStaffEmail()}</p>
        </div>

        <div className="library-welcome-icon">
          <UserCheck size={28} />
        </div>
      </div>

      <div className="library-stat-grid">
        <StatCard
          icon={<ClipboardList size={22} />}
          title="Pending Requests"
          value={pendingRequests.length}
          onClick={() =>
            changeSection("requests")
          }
        />

        <StatCard
          icon={<UserCheck size={22} />}
          title="My Assigned"
          value={
            requests.filter(
              (request) =>
                request.assigned_staff_id ===
                  currentUser?.id &&
                request.status ===
                  "Accepted" &&
                isLibraryRequest(request)
            ).length
          }
          onClick={() =>
            changeSection("requests")
          }
        />

        <StatCard
          icon={<History size={22} />}
          title="History"
          value={historyRequests.length}
          onClick={() =>
            changeSection("history")
          }
        />

        <StatCard
          icon={<Building2 size={22} />}
          title="Library Spaces"
          value={spaces.length}
          onClick={() =>
            changeSection("spaces")
          }
        />
      </div>

      <div className="library-section-card">
        <div className="library-section-title">
          <div>
            <h2>
              Requests Requiring Attention
            </h2>

            <p>
              Requests that are waiting for a
              staff member.
            </p>
          </div>

          <button
            className="library-secondary-button"
            onClick={() =>
              changeSection("requests")
            }
          >
            View Requests
          </button>
        </div>

        <RequestTable
          requests={pendingRequests.slice(0, 5)}
          emptyText="No pending requests."
          onView={setSelectedRequest}
          compact
        />
      </div>
    </>
  );

  // =====================================================
  // SCHEDULE
  // =====================================================

  const renderSchedule = () => (
    <ManagementSection
      title="Operating Hours"
      description="Manage the library's operating schedule."
      addLabel="Add Schedule"
      onAdd={() =>
        openAddModal("schedule")
      }
    >
      <div className="library-table-wrapper">
        <table className="library-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Opening</th>
              <th>Closing</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {schedules.length === 0 ? (
              <EmptyTable
                colSpan={4}
                text="No schedules added yet."
              />
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>
                    <strong>
                      {schedule.day}
                    </strong>
                  </td>

                  <td>
                    {schedule.opening_time}
                  </td>

                  <td>
                    {schedule.closing_time}
                  </td>

                  <td>
                    <ActionButtons
                      onEdit={() =>
                        openEditModal(
                          "schedule",
                          schedule
                        )
                      }
                      onDelete={() =>
                        deleteRecord(
                          "library_hours",
                          schedule.id,
                          setSchedules
                        )
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ManagementSection>
  );

  // =====================================================
  // LIBRARY INFORMATION
  // =====================================================

  const renderVisionMission = () => (
    <ManagementSection
      title="Library Information"
      description="Manage the library's vision and mission."
    >
      <div className="library-content-form">
        <div className="library-form-group">
          <label>Vision</label>

          <textarea
            value={vision}
            onChange={(e) =>
              setVision(e.target.value)
            }
            rows={6}
          />
        </div>

        <div className="library-form-group">
          <label>Mission</label>

          <textarea
            value={mission}
            onChange={(e) =>
              setMission(e.target.value)
            }
            rows={6}
          />
        </div>

        <button
          className="library-primary-button"
          onClick={saveVisionMission}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2
                className="spin"
                size={17}
              />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </ManagementSection>
  );

  // =====================================================
  // SPACES
  // =====================================================

  const renderSpaces = () => (
    <ManagementSection
      title="Spaces & Areas"
      description="Manage library spaces and areas."
      addLabel="Add Space"
      onAdd={() =>
        openAddModal("space")
      }
    >
      <div className="library-content-list">
        {spaces.length === 0 ? (
          <EmptyState text="No library spaces added yet." />
        ) : (
          spaces.map((space) => (
            <ContentItem
              key={space.id}
              title={space.title}
              date={space.date}
              body={space.body}
              image={space.image_url}
              onEdit={() =>
                openEditModal(
                  "space",
                  space
                )
              }
              onDelete={() =>
                deleteRecord(
                  "library_spaces",
                  space.id,
                  setSpaces,
                  space.image_url
                )
              }
            />
          ))
        )}
      </div>
    </ManagementSection>
  );

  // =====================================================
  // NEWS
  // =====================================================

  const renderNews = () => (
    <ManagementSection
      title="Library News"
      description="Manage library news and announcements."
      addLabel="Add News"
      onAdd={() =>
        openAddModal("news")
      }
    >
      <div className="library-content-list">
        {news.length === 0 ? (
          <EmptyState text="No library news added yet." />
        ) : (
          news.map((item) => (
            <ContentItem
              key={item.id}
              title={item.title}
              date={item.date}
              body={item.body}
              image={item.image_url}
              onEdit={() =>
                openEditModal(
                  "news",
                  item
                )
              }
              onDelete={() =>
                deleteRecord(
                  "library_news",
                  item.id,
                  setNews,
                  item.image_url
                )
              }
            />
          ))
        )}
      </div>
    </ManagementSection>
  );

  // =====================================================
  // CLUBS
  // =====================================================

  const renderClubs = () => (
    <ManagementSection
      title="Library Information"
      description="Manage library clubs and organizations."
      addLabel="Add Club"
      onAdd={() =>
        openAddModal("club")
      }
    >
      <div className="library-content-list">
        {clubs.length === 0 ? (
          <EmptyState text="No library clubs added yet." />
        ) : (
          clubs.map((club) => (
            <div
              className="library-list-item"
              key={club.id}
            >
              <div className="library-image-placeholder">
                {club.image_url ? (
                  <img
                    src={club.image_url}
                    alt={club.name}
                  />
                ) : (
                  <Users size={25} />
                )}
              </div>

              <div className="library-list-content">
                <h3>{club.name}</h3>

                <p>
                  {club.description}
                </p>
              </div>

              <ActionButtons
                onEdit={() =>
                  openEditModal(
                    "club",
                    club
                  )
                }
                onDelete={() =>
                  deleteRecord(
                    "library_clubs",
                    club.id,
                    setClubs,
                    club.image_url
                  )
                }
              />
            </div>
          ))
        )}
      </div>
    </ManagementSection>
  );

  // =====================================================
  // CLUB NEWS
  // =====================================================

  const renderClubNews = () => (
    <ManagementSection
      title="Club News"
      description="Manage news and announcements from library clubs."
      addLabel="Add Club News"
      onAdd={() =>
        openAddModal("club-news")
      }
    >
      <div className="library-content-list">
        {clubNews.length === 0 ? (
          <EmptyState text="No club news added yet." />
        ) : (
          clubNews.map((item) => (
            <ContentItem
              key={item.id}
              title={item.title}
              date={item.date}
              body={item.body}
              image={item.image_url}
              onEdit={() =>
                openEditModal(
                  "club-news",
                  item
                )
              }
              onDelete={() =>
                deleteRecord(
                  "library_club_news",
                  item.id,
                  setClubNews,
                  item.image_url
                )
              }
            />
          ))
        )}
      </div>
    </ManagementSection>
  );

  // =====================================================
  // REQUESTS
  // =====================================================

  const renderRequests = () => (
    <ManagementSection
      title="Requests"
      description="Review Library requests and assign responsibility to yourself."
    >
      <RequestToolbar
        search={requestSearch}
        setSearch={setRequestSearch}
        status={requestStatusFilter}
        setStatus={setRequestStatusFilter}
        active
      />

      <RequestTable
        requests={filteredRequests}
        emptyText="No active Library requests found."
        onView={setSelectedRequest}
      />
    </ManagementSection>
  );

  // =====================================================
  // HISTORY
  // =====================================================

  const renderHistory = () => (
    <ManagementSection
      title="Request History"
      description="View completed and cancelled Library requests."
    >
      <RequestToolbar
        search={historySearch}
        setSearch={setHistorySearch}
        status={historyStatusFilter}
        setStatus={setHistoryStatusFilter}
      />

      <RequestTable
        requests={filteredHistory}
        emptyText="No Library request history found."
        onView={setSelectedRequest}
        history
      />
    </ManagementSection>
  );

  // =====================================================
  // SAVE VISION / MISSION
  // =====================================================

  const saveVisionMission = async () => {
    try {
      setSaving(true);

      const existing = await supabase
        .from("library_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        throw existing.error;
      }

      if (existing.data) {
        const { error } =
          await supabase
            .from("library_settings")
            .update({
              vision,
              mission,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              existing.data.id
            );

        if (error) throw error;
      } else {
        const { error } =
          await supabase
            .from("library_settings")
            .insert({
              vision,
              mission,
            });

        if (error) throw error;
      }

      showAlert(
        "success",
        "Saved successfully",
        "Library information has been updated."
      );
    } catch (error) {
      console.error(error);

      showAlert(
        "error",
        "Unable to save",
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CONTENT
  // =====================================================

  const renderContent = () => {
    if (loading) {
      return (
        <div className="library-loading">
          <Loader2
            className="spin"
            size={30}
          />

          <p>
            Loading Library data...
          </p>
        </div>
      );
    }

    switch (activeSection) {
      case "schedule":
        return renderSchedule();

      case "vision":
        return renderVisionMission();

      case "spaces":
        return renderSpaces();

      case "news":
        return renderNews();

      case "clubs":
        return renderClubs();

      case "club-news":
        return renderClubNews();

      case "requests":
        return renderRequests();

      case "history":
        return renderHistory();

      default:
        return renderDashboard();
    }
  };

  return (
    <div className="library-dashboard">

      {/* ALERT */}

      <LibraryAlert />

      {/* MOBILE HEADER */}

      <div className="library-mobile-header">
        <button
          className="library-menu-button"
          onClick={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
        >
          <Menu size={22} />
        </button>

        <strong>
          Library Management
        </strong>
      </div>

      {/* SIDEBAR */}

      <aside
        className={`library-sidebar ${
          sidebarOpen
            ? "library-sidebar-open"
            : ""
        }`}
      >
        <div className="library-sidebar-header">
          <div className="library-logo">
            <Building2 size={22} />
          </div>

          <div>
            <strong>
              Library
            </strong>

            <span>
              Management
            </span>
          </div>
        </div>

        <nav className="library-navigation">
          <p className="library-nav-label">
            MAIN MENU
          </p>

          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`library-nav-item ${
                activeSection === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeSection(item.id)
              }
            >
              {item.icon}

              <span>
                {item.label}
              </span>

              {item.id === "requests" &&
                pendingRequests.length >
                  0 && (
                  <b>
                    {
                      pendingRequests.length
                    }
                  </b>
                )}
            </button>
          ))}
        </nav>

        <div className="library-sidebar-user">
          <div className="library-user-icon">
            <User size={17} />
          </div>

          <div>
            <strong>
              {getStaffName()}
            </strong>

            <span>
              Staff
            </span>
          </div>
        </div>

        <div className="library-sidebar-footer">
          <button
            onClick={() =>
              (window.location.href = "/")
            }
            className="library-back-button"
          >
            <LogOut size={16} />
            Back to Home
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="library-main">
        <div className="library-content">
          {renderContent()}
        </div>
      </main>

      {/* CONTENT MODAL */}

      {showModal && (
        <ContentModal
          type={modalType}
          editing={editingItem}
          form={form}
          saving={saving}
          onChange={handleFormChange}
          onImageChange={handleImageChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* REQUEST DETAILS */}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          currentUser={currentUser}
          onClose={() =>
            setSelectedRequest(null)
          }
          onAssign={() =>
            assignRequestToMe(
              selectedRequest.id
            )
          }
          onComplete={() =>
            completeRequest(
              selectedRequest
            )
          }
          onCancel={() =>
            cancelRequest(
              selectedRequest
            )
          }
        />
      )}
    </div>
  );
}

// =====================================================
// PAGE HEADER
// =====================================================

function PageHeader({
  title,
  description,
}) {
  return (
    <div className="library-page-header">
      <div>
        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  title,
  value,
  onClick,
}) {
  return (
    <button
      className="library-stat-card"
      onClick={onClick}
    >
      <div className="library-stat-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>

        <strong>{value}</strong>
      </div>
    </button>
  );
}

// =====================================================
// MANAGEMENT SECTION
// =====================================================

function ManagementSection({
  title,
  description,
  addLabel,
  onAdd,
  children,
}) {
  return (
    <div>
      <div className="library-page-header">
        <div>
          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        {addLabel && (
          <button
            className="library-primary-button"
            onClick={onAdd}
          >
            <Plus size={18} />

            {addLabel}
          </button>
        )}
      </div>

      <div className="library-section-card">
        {children}
      </div>
    </div>
  );
}

// =====================================================
// REQUEST TOOLBAR
// =====================================================

function RequestToolbar({
  search,
  setSearch,
  status,
  setStatus,
}) {
  return (
    <div className="library-request-toolbar">
      <div className="library-search-box">
        <Search size={17} />

        <input
          type="text"
          placeholder="Search name, request type, staff..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <div className="library-status-filter">
        {[
          "All",
          "Pending",
          "Accepted",
          "Completed",
          "Cancelled",
        ].map((item) => (
          <button
            key={item}
            className={
              status === item
                ? "active"
                : ""
            }
            onClick={() =>
              setStatus(item)
            }
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// REQUEST TABLE
// =====================================================

function RequestTable({
  requests,
  emptyText,
  onView,
  history = false,
}) {
  return (
    <div className="library-table-wrapper">
      <table className="library-table library-request-table">
        <thead>
          <tr>
            <th>Requester</th>
            <th>Request Type</th>
            <th>Date</th>
            <th>Status</th>
            <th>Assigned Staff</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {requests.length === 0 ? (
            <EmptyTable
              colSpan={6}
              text={emptyText}
            />
          ) : (
            requests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onView={onView}
                history={history}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// REQUEST ROW
// =====================================================

function RequestRow({
  request,
  onView,
}) {
  return (
    <tr>
      <td>
        <strong>
          {request.requester_name ||
            "Unknown"}
        </strong>
      </td>

      <td>
        {request.request_type || "—"}
      </td>

      <td>
        {request.request_date
          ? new Date(
              request.request_date
            ).toLocaleDateString()
          : "—"}
      </td>

      <td>
        <StatusBadge
          status={request.status}
        />
      </td>

      <td>
        {request.assigned_staff_name ? (
          <div className="library-assigned-staff">
            <div className="library-assigned-avatar">
              <UserCheck size={14} />
            </div>

            <span>
              {
                request.assigned_staff_name
              }
            </span>
          </div>
        ) : (
          <span className="library-unassigned">
            Unassigned
          </span>
        )}
      </td>

      <td>
        <button
          className="library-view-button"
          onClick={() =>
            onView(request)
          }
        >
          <Eye size={16} />

          View Details
        </button>
      </td>
    </tr>
  );
}

// =====================================================
// REQUEST DETAILS MODAL
// =====================================================

function RequestDetailsModal({
  request,
  currentUser,
  onClose,
  onAssign,
  onComplete,
  onCancel,
}) {
  const isAssigned =
    currentUser &&
    request.assigned_staff_id ===
      currentUser.id;

  const isPending =
    request.status === "Pending";

  const isAccepted =
    request.status === "Accepted";

  return (
    <div
      className="library-modal-overlay"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="library-request-modal">

        <div className="library-request-modal-header">
          <div>
            <div className="library-modal-label">
              REQUEST DETAILS
            </div>

            <h2>
              {request.request_type ||
                "Library Request"}
            </h2>

            <p>
              Submitted by{" "}
              <strong>
                {request.requester_name}
              </strong>
            </p>
          </div>

          <button
            className="library-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="library-request-modal-body">

          <div className="library-request-status-header">
            <StatusBadge
              status={request.status}
            />

            <span>
              {request.request_date
                ? new Date(
                    request.request_date
                  ).toLocaleDateString()
                : "No date"}
            </span>
          </div>

          <div className="library-request-detail-grid">

            <RequestDetail
              label="Requester"
              value={
                request.requester_name ||
                "—"
              }
            />

            <RequestDetail
              label="Request Type"
              value={
                request.request_type ||
                "—"
              }
            />

            <RequestDetail
              label="Request Date"
              value={
                request.request_date
                  ? new Date(
                      request.request_date
                    ).toLocaleDateString()
                  : "—"
              }
            />

            <RequestDetail
              label="Assigned Staff"
              value={
                request.assigned_staff_name ||
                "Not assigned"
              }
            />

          </div>

          <div className="library-request-description">
            <label>
              Request Details
            </label>

            <div>
              {request.details ||
                "No additional details provided."}
            </div>
          </div>

          {request.assigned_staff_name && (
            <div className="library-assignment-card">
              <div className="library-assignment-icon">
                <UserCheck size={20} />
              </div>

              <div>
                <strong>
                  Assigned Staff
                </strong>

                <p>
                  {
                    request.assigned_staff_name
                  }
                </p>

                {request.assigned_staff_email && (
                  <span>
                    {
                      request.assigned_staff_email
                    }
                  </span>
                )}
              </div>
            </div>
          )}

          {!request.assigned_staff_id &&
            isPending && (
              <div className="library-assignment-warning">
                <UserCheck size={18} />

                <div>
                  <strong>
                    This request is
                    unassigned.
                  </strong>

                  <p>
                    Click "Accept & Assign
                    to Me" if you will be
                    responsible for this
                    request.
                  </p>
                </div>
              </div>
            )}

        </div>

        <div className="library-request-modal-footer">

          <button
            className="library-secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          {!request.assigned_staff_id &&
            isPending && (
              <button
                className="library-primary-button"
                onClick={onAssign}
              >
                <UserCheck size={17} />

                Accept & Assign to Me
              </button>
            )}

          {isAccepted &&
            isAssigned && (
              <>
                <button
                  className="library-danger-button"
                  onClick={onCancel}
                >
                  <X size={17} />

                  Cancel Request
                </button>

                <button
                  className="library-success-button"
                  onClick={onComplete}
                >
                  <CircleCheck size={17} />

                  Mark Completed
                </button>
              </>
            )}

          {isAccepted &&
            !isAssigned && (
              <div className="library-not-responsible">
                Assigned to{" "}
                <strong>
                  {
                    request.assigned_staff_name
                  }
                </strong>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}

// =====================================================
// REQUEST DETAIL
// =====================================================

function RequestDetail({
  label,
  value,
}) {
  return (
    <div className="library-request-detail">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({ status }) {
  const normalized = (
    status || "Pending"
  )
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span
      className={`library-status ${normalized}`}
    >
      {status || "Pending"}
    </span>
  );
}

// =====================================================
// CONTENT MODAL
// =====================================================

function ContentModal({
  type,
  editing,
  form,
  saving,
  onChange,
  onImageChange,
  onSubmit,
  onClose,
}) {
  const titles = {
    space: "Library Space",
    news: "Library News",
    club: "Library Club",
    "club-news": "Club News",
    schedule: "Operating Schedule",
  };

  const isSchedule =
    type === "schedule";

  const isClub =
    type === "club";

  return (
    <div
      className="library-modal-overlay"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="library-modal">

        <div className="library-modal-header">
          <div>
            <div className="library-modal-label">
              LIBRARY MANAGEMENT
            </div>

            <h2>
              {editing ? "Edit" : "Add"}{" "}
              {titles[type]}
            </h2>

            <p>
              {editing
                ? "Update the existing information."
                : "Add new information to the library."}
            </p>
          </div>

          <button
            className="library-modal-close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="library-modal-form"
          onSubmit={onSubmit}
        >
          {isSchedule ? (
            <>
              <div className="library-form-group">
                <label>Day</label>

                <select
                  name="day"
                  value={form.day}
                  onChange={onChange}
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>

              <div className="library-form-row">
                <div className="library-form-group">
                  <label>
                    Opening Time
                  </label>

                  <input
                    type="time"
                    name="opening"
                    value={form.opening}
                    onChange={onChange}
                    required
                  />
                </div>

                <div className="library-form-group">
                  <label>
                    Closing Time
                  </label>

                  <input
                    type="time"
                    name="closing"
                    value={form.closing}
                    onChange={onChange}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="library-form-group">
                <label>Image</label>

                <label className="library-upload-box">
                  {form.existingImage &&
                  !form.image ? (
                    <img
                      src={
                        form.existingImage
                      }
                      alt="Current"
                      className="library-upload-preview"
                    />
                  ) : (
                    <div className="library-upload-content">
                      <Upload size={25} />

                      <strong>
                        {form.image
                          ? form.image.name
                          : "Click to upload image"}
                      </strong>

                      <span>
                        PNG, JPG or WEBP —
                        Max 5MB
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={
                      onImageChange
                    }
                    hidden
                  />
                </label>
              </div>

              {isClub ? (
                <>
                  <div className="library-form-group">
                    <label>
                      Club Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Enter club name"
                      required
                    />
                  </div>

                  <div className="library-form-group">
                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={onChange}
                      placeholder="Enter club description"
                      rows={6}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="library-form-group">
                    <label>Title</label>

                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={onChange}
                      placeholder="Enter title"
                      required
                    />
                  </div>

                  <div className="library-form-group">
                    <label>Date</label>

                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="library-form-group">
                    <label>
                      Body / Description
                    </label>

                    <textarea
                      name="body"
                      value={form.body}
                      onChange={onChange}
                      placeholder="Write the content here..."
                      rows={8}
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="library-modal-footer">
            <button
              type="button"
              className="library-secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="library-primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  {editing
                    ? "Save Changes"
                    : "Add"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// CONTENT ITEM
// =====================================================

function ContentItem({
  title,
  date,
  body,
  image,
  onEdit,
  onDelete,
}) {
  return (
    <div className="library-list-item">
      <div className="library-image-placeholder">
        {image ? (
          <img
            src={image}
            alt={title}
          />
        ) : (
          <Building2 size={25} />
        )}
      </div>

      <div className="library-list-content">
        <h3>{title}</h3>

        <span className="library-date">
          {date}
        </span>

        <p>{body}</p>
      </div>

      <ActionButtons
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// =====================================================
// ACTION BUTTONS
// =====================================================

function ActionButtons({
  onEdit,
  onDelete,
}) {
  return (
    <div className="library-action-group">
      <button
        className="library-icon-button edit"
        onClick={onEdit}
        title="Edit"
      >
        <Pencil size={17} />
      </button>

      <button
        className="library-icon-button delete"
        onClick={onDelete}
        title="Delete"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

// =====================================================
// EMPTY
// =====================================================

function EmptyState({ text }) {
  return (
    <div className="library-empty-state">
      {text}
    </div>
  );
}

function EmptyTable({
  colSpan,
  text,
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="library-empty-state">
          {text}
        </div>
      </td>
    </tr>
  );
}

// =====================================================
// ALERT COMPONENT
// =====================================================

function LibraryAlert() {
  const [alert, setAlert] =
    useState(null);

  useEffect(() => {
    const handler = (event) => {
      setAlert(event.detail);

      setTimeout(() => {
        setAlert(null);
      }, 4000);
    };

    window.addEventListener(
      "library-alert",
      handler
    );

    return () => {
      window.removeEventListener(
        "library-alert",
        handler
      );
    };
  }, []);

  if (!alert) return null;

  return (
    <div
      className={`library-alert library-alert-${alert.type}`}
    >
      <div className="library-alert-icon">
        {alert.type === "success" && (
          <Check size={18} />
        )}

        {alert.type === "error" && (
          <X size={18} />
        )}

        {alert.type === "warning" && (
          <span>!</span>
        )}
      </div>

      <div className="library-alert-content">
        <strong>
          {alert.title}
        </strong>

        <p>
          {alert.message}
        </p>
      </div>

      <button
        onClick={() =>
          setAlert(null)
        }
        className="library-alert-close"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default LibraryDashboard;