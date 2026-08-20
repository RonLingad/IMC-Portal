
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../services/supabase";
import "./Home.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  // =====================================================
  // DATA
  // =====================================================

  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [visionMission, setVisionMission] = useState({
    vision:
      "To provide a dynamic and accessible learning environment where information resources, technology, and media services support lifelong learning, research, creativity, and academic excellence.",

    mission:
      "To deliver reliable library, audio-visual, technology, and information services that empower students, teachers, and the school community in achieving their educational and instructional goals.",
  });

  const [loading, setLoading] = useState(true);

  // =====================================================
  // CAROUSEL STATES
  // =====================================================

  const [activityIndex, setActivityIndex] = useState(0);
  const [facilityIndex, setFacilityIndex] = useState(0);

  // =====================================================
  // MODAL
  // =====================================================

  const [selectedContent, setSelectedContent] = useState(null);

  const openModal = (type, item) => {
    setSelectedContent({
      type,
      item,
    });
  };

  const closeModal = () => {
    setSelectedContent(null);
  };

  // =====================================================
  // MOBILE MENU
  // =====================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // =====================================================
  // QUICK LINKS
  // =====================================================

  const quickLinks = [
    {
      name: "Aralinks",
      url: "https://hfapgs.aralinks.net:8080/login/index.php?loginredirect=1",
      description: "Digital learning resources",
    },
    {
      name: "Follett Destiny",
      url: "https://hfa-library.follettdestiny.com/portal/portal?app=Library%20Manager&appId=destiny-DFXG-DKVF&siteGuid=6FCE2EC2-064B-4961-BE56-2AF87CAD9632&nav=%252Fcataloging%252Fservlet%252Fpresentadvancedsearchredirectorform.do%253Fl2m%253DLibrary%252520Search%2526tm%253DTopLevelCatalog%2526l2m%253DLibrary%252BSearch",
      description: "Library catalog and resources",
    },
    {
      name: "Epic Reading",
      url: "https://www.getepic.com/",
      description: "Digital reading platform",
    },
  ];

  // =====================================================
  // SERVICES
  // =====================================================

  const services = [
    {
      name: "Library",
      url: "/library",
      description: "Library resources and research",
    },
    {
      name: "AVR",
      url: "/avr",
      description: "Audio-visual facilities and equipment",
    },
    {
      name: "Technical Assistance",
      url: "/services",
      description: "Technology and equipment support",
    },
  ];

  // =====================================================
  // FETCH ACTIVITIES
  // =====================================================

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Activities fetch error:", error);
      return;
    }

    setActivities(data || []);
  };

  // =====================================================
  // FETCH ANNOUNCEMENTS
  // =====================================================

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Announcements fetch error:", error);
      return;
    }

    setAnnouncements(data || []);
  };

  // =====================================================
  // FETCH FACILITIES
  // =====================================================

  const fetchFacilities = async () => {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Facilities fetch error:", error);
      return;
    }

    setFacilities(data || []);
  };

  // =====================================================
  // FETCH VISION & MISSION
  // =====================================================

  const fetchVisionMission = async () => {
    const { data, error } = await supabase
      .from("vision_mission")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Vision & Mission fetch error:", error);
      return;
    }

    if (data && data.length > 0) {
      setVisionMission(data[0]);
    }
  };

  // =====================================================
  // FETCH ALL
  // =====================================================

  const fetchHomeData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchActivities(),
        fetchAnnouncements(),
        fetchFacilities(),
        fetchVisionMission(),
      ]);
    } catch (error) {
      console.error("Error loading Home data:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD + REALTIME
  // =====================================================

  useEffect(() => {
    // Defensive reset: the IMC page must start at the viewport's top.
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.width = "100%";
  }, []);

  useEffect(() => {
    fetchHomeData();

    const channel = supabase
      .channel("home-realtime-changes")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
        },
        () => {
          fetchActivities();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          fetchAnnouncements();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "facilities",
        },
        () => {
          fetchFacilities();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vision_mission",
        },
        () => {
          fetchVisionMission();
        }
      )

      .subscribe((status) => {
        console.log("Home realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =====================================================
  // ACTIVITY AUTO SLIDE
  // EVERY 4 SECONDS
  // =====================================================

  useEffect(() => {
    if (activities.length <= 1) return;

    const interval = setInterval(() => {
      setActivityIndex((previous) => {
        return (previous + 1) % activities.length;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  // =====================================================
  // FACILITY AUTO SLIDE
  // EVERY 4 SECONDS
  // =====================================================

  useEffect(() => {
    if (facilities.length <= 1) return;

    const interval = setInterval(() => {
      setFacilityIndex((previous) => {
        return (previous + 1) % facilities.length;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [facilities.length]);

  // =====================================================
  // ESCAPE
  // =====================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // =====================================================
  // TEXT HELPERS
  // =====================================================

  const MAX_DESCRIPTION_LENGTH = 190;

  const isLongText = (text) => {
    if (!text) return false;

    return text.length > MAX_DESCRIPTION_LENGTH;
  };

  const getShortDescription = (text) => {
    if (!text) return "";

    if (text.length <= MAX_DESCRIPTION_LENGTH) {
      return text;
    }

    return text.substring(0, MAX_DESCRIPTION_LENGTH).trimEnd() + "...";
  };

  // =====================================================
  // ACTIVITY NAVIGATION
  // =====================================================

  const nextActivity = () => {
    if (activities.length === 0) return;

    setActivityIndex(
      (previous) => (previous + 1) % activities.length
    );
  };

  const previousActivity = () => {
    if (activities.length === 0) return;

    setActivityIndex(
      (previous) =>
        (previous - 1 + activities.length) % activities.length
    );
  };

  // =====================================================
  // FACILITY NAVIGATION
  // =====================================================

  const nextFacility = () => {
    if (facilities.length === 0) return;

    setFacilityIndex(
      (previous) => (previous + 1) % facilities.length
    );
  };

  const previousFacility = () => {
    if (facilities.length === 0) return;

    setFacilityIndex(
      (previous) =>
        (previous - 1 + facilities.length) % facilities.length
    );
  };

  // =====================================================
  // CURRENT DATA
  // =====================================================

  const currentActivity =
    activities.length > 0
      ? activities[activityIndex]
      : null;

  const currentFacility =
    facilities.length > 0
      ? facilities[facilityIndex]
      : null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="imc-home">

      {/* =================================================
          HEADER
      ================================================= */}

      {createPortal(
        <>
      <header className="main-header">

        <div className="container header-container">

          <a
            href="#home"
            className="brand"
            onClick={closeMenu}
          >

            <img
              src="/hfalogo.png"
              alt="Instructional Media Center Logo"
              className="brand-logo"
            />

            <div className="brand-text">

              <span className="brand-name">
                Instructional Media Center
              </span>

              <span className="brand-subtitle">
                Library & Audio-Visual Room
              </span>

            </div>

          </a>

          {/* DESKTOP NAV */}

          <nav className="main-navigation">

            <a href="#home" onClick={closeMenu}>
              Home
            </a>

            <a href="#activities" onClick={closeMenu}>
              Activities
            </a>

            <a href="#announcements" onClick={closeMenu}>
              Announcements
            </a>

            <div className="nav-dropdown">

              <button
                type="button"
                className="nav-dropdown-button"
              >
                Services
                <span className="dropdown-arrow">
                  ▾
                </span>
              </button>

              <div className="nav-dropdown-menu">

                {services.map((service) => (

                  <a
                    href={service.url}
                    key={service.name}
                    className="nav-dropdown-item"
                  >

                    <span className="dropdown-item-title">
                      {service.name}
                    </span>

                    <span className="dropdown-item-description">
                      {service.description}
                    </span>

                  </a>

                ))}

              </div>

            </div>

            <a href="#facilities" onClick={closeMenu}>
              Facilities
            </a>

            <a href="#about" onClick={closeMenu}>
              About
            </a>

            <div className="nav-dropdown quick-links-dropdown">

              <button
                type="button"
                className="nav-dropdown-button"
              >
                Quick Links
                <span className="dropdown-arrow">
                  ▾
                </span>
              </button>

              <div className="nav-dropdown-menu">

                {quickLinks.map((link) => (

                  <a
                    href={link.url}
                    key={link.name}
                    className="nav-dropdown-item"
                    target={link.url !== "#" ? "_blank" : undefined}
                    rel={
                      link.url !== "#"
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >

                    <span className="dropdown-item-title">
                      {link.name}
                    </span>

                    <span className="dropdown-item-description">
                      {link.description}
                    </span>

                  </a>

                ))}

              </div>

            </div>

            <a href="/staff" onClick={closeMenu}>
              Staff
            </a>

          </nav>

          {/* HEADER ACTIONS */}

          <div className="header-actions">

            <a
              href="/login"
              className="header-login desktop-login"
            >
              Login
            </a>

            <button
              type="button"
              className={`burger-button ${
                menuOpen ? "active" : ""
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

          </div>

        </div>

        {/* MOBILE NAV */}

        <nav
          className={`mobile-navigation ${
            menuOpen
              ? "mobile-navigation-open"
              : ""
          }`}
        >

          <a href="#home" onClick={closeMenu}>
            Home
          </a>

          <a href="#activities" onClick={closeMenu}>
            Activities
          </a>

          <a href="#announcements" onClick={closeMenu}>
            Announcements
          </a>

          <div className="mobile-nav-group">

            <span className="mobile-nav-heading">
              Services
            </span>

            {services.map((service) => (

              <a
                href={service.url}
                key={service.name}
                onClick={closeMenu}
                className="mobile-sub-link"
              >
                {service.name}
              </a>

            ))}

          </div>

          <a href="#facilities" onClick={closeMenu}>
            Facilities
          </a>

          <a href="#about" onClick={closeMenu}>
            About
          </a>

          <div className="mobile-nav-group">

            <span className="mobile-nav-heading">
              Quick Links
            </span>

            {quickLinks.map((link) => (

              <a
                href={link.url}
                key={link.name}
                onClick={closeMenu}
                className="mobile-sub-link"
                target={link.url !== "#" ? "_blank" : undefined}
                rel={
                  link.url !== "#"
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {link.name}
              </a>

            ))}

          </div>

          <a href="/staff" onClick={closeMenu}>
            Staff
          </a>

          <a
            href="/login"
            className="mobile-login-btn"
            onClick={closeMenu}
          >
            Login
          </a>

        </nav>

      </header>
        </>,
        document.body
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="hero-section"
          id="home"
        >

          <div className="hero-background-shape hero-shape-one"></div>
          <div className="hero-background-shape hero-shape-two"></div>

          <div className="container hero-container">

            <div className="hero-content">

              <span className="hero-label">
                INSTRUCTIONAL MEDIA CENTER
              </span>

              <h1>
                Learning, Research,
                <span>
                  and Innovation.
                </span>
              </h1>

              <p>
                Welcome to the Instructional Media Center,
                a centralized learning and support environment
                designed to provide students, teachers, and the
                school community with access to information,
                technology, resources, and media services.
              </p>

              <div className="hero-actions">

                <a
                  href="#facilities"
                  className="primary-button"
                >
                  Explore Our Facilities
                </a>

                <a
                  href="#services"
                  className="secondary-button"
                >
                  View Services
                </a>

              </div>

            </div>

            <div className="hero-info-card">

              <div className="hero-card-header">
                <span className="hero-card-dot"></span>
                IMC SERVICES
              </div>

              <div className="hero-card-item">

                <strong>
                  Library
                </strong>

                <span>
                  Resources & Research
                </span>

              </div>

              <div className="hero-card-item">

                <strong>
                  AVR
                </strong>

                <span>
                  Audio-Visual Services
                </span>

              </div>

              <div className="hero-card-item">

                <strong>
                  Digital Support
                </strong>

                <span>
                  Technology & Assistance
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            LATEST NEWS
        ================================================= */}

        <section
          className="activities-section"
          id="activities"
        >

          <div className="container">

            {/* COMPACT HEADING */}

            <div className="latest-heading">

              <div className="latest-heading-left">

                <span className="section-label">
                  LATEST UPDATES
                </span>

                <h2>
                  Latest <span>News.</span>
                </h2>

              </div>

              <p>
                Stay updated with the latest library
                announcements, events, and activities.
              </p>

            </div>


            {/* CAROUSEL */}

            {loading ? (

              <div className="content-loading">
                Loading latest news...
              </div>

            ) : currentActivity ? (

              <div className="latest-carousel">

                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-left"
                  onClick={previousActivity}
                  aria-label="Previous activity"
                >
                  ←
                </button>


                <article
                  className="latest-news-card"
                  key={currentActivity.id}
                >

                  {/* IMAGE */}

                  {currentActivity.image && (

                    <div className="latest-news-image">

                      <img
                        src={currentActivity.image}
                        alt={currentActivity.title}
                      />

                    </div>

                  )}


                  {/* CONTENT */}

                  <div className="latest-news-content">

                    <div className="latest-news-meta">

                      {currentActivity.date && (
                        <span>
                          {currentActivity.date}
                        </span>
                      )}

                      <span className="latest-news-label">
                        IMC NEWS
                      </span>

                    </div>


                    <h3>
                      {currentActivity.title}
                    </h3>


                    <button
                      type="button"
                      className="blue-read-button"
                      onClick={() =>
                        openModal(
                          "activity",
                          currentActivity
                        )
                      }
                    >
                      Read More
                      <span>→</span>
                    </button>

                  </div>

                </article>


                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-right"
                  onClick={nextActivity}
                  aria-label="Next activity"
                >
                  →
                </button>

              </div>

            ) : (

              <div className="empty-content dark-empty">
                <p>
                  No activities posted yet.
                </p>
              </div>

            )}


            {/* CAROUSEL INDICATORS */}

            {activities.length > 1 && (

              <div className="carousel-indicators">

                {activities.map((activity, index) => (

                  <button
                    key={activity.id}
                    type="button"
                    className={
                      index === activityIndex
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActivityIndex(index)
                    }
                    aria-label={`Go to activity ${
                      index + 1
                    }`}
                  />

                ))}

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            ANNOUNCEMENTS
        ================================================= */}

        <section
          className="announcement-section"
          id="announcements"
        >

          <div className="container">

            <div className="announcement-heading">

              <div>

                <span className="section-label">
                  CENTER ADVISORIES
                </span>

                <h2>
                  Official <span>Announcements.</span>
                </h2>

              </div>

              <p>
                Important notices, schedules, and
                advisories from the Instructional
                Media Center.
              </p>

            </div>


            {/* MARQUEE */}

            {announcements.length > 0 && (

              <div className="announcement-marquee">

                <div className="announcement-marquee-track">

                  {[...announcements, ...announcements].map(
                    (item, index) => (

                      <div
                        className="marquee-item"
                        key={`${item.id}-${index}`}
                      >

                        <span className="marquee-dot">
                          ●
                        </span>

                        <strong>
                          {item.title}
                        </strong>

                        {item.date && (
                          <span>
                            {item.date}
                          </span>
                        )}

                      </div>

                    )
                  )}

                </div>

              </div>

            )}


            {/* ANNOUNCEMENT LIST */}

            {loading ? (

              <div className="content-loading">
                Loading announcements...
              </div>

            ) : announcements.length > 0 ? (

              <div className="announcement-list">

                {announcements.slice(0, 4).map((item) => (

                  <article
                    className="announcement-row"
                    key={item.id}
                  >

                    <div className="announcement-row-date">

                      {item.date || "NOTICE"}

                    </div>


                    <div className="announcement-row-content">

                      <div className="announcement-row-top">

                        <span>
                          {item.badge || "ADVISORY"}
                        </span>

                        {item.tag && (
                          <small>
                            {item.tag}
                          </small>
                        )}

                      </div>


                      <h3>
                        {item.title}
                      </h3>

                    </div>


                    <button
                      type="button"
                      className="announcement-read-button"
                      onClick={() =>
                        openModal(
                          "announcement",
                          item
                        )
                      }
                    >
                      Read More
                      <span>→</span>
                    </button>

                  </article>

                ))}

              </div>

            ) : (

              <div className="empty-content">
                <p>
                  No announcements posted yet.
                </p>
              </div>

            )}

          </div>

        </section>


        {/* =================================================
            SERVICES
        ================================================= */}

        <section
          className="services-section"
          id="services"
        >

          <div className="container">

            <div className="section-heading centered">

              <span className="section-label">
                WHAT WE OFFER
              </span>

              <h2>
                Services for the
                <span>
                  school community.
                </span>
              </h2>

              <p>
                Access the services and facilities
                provided by the Instructional Media Center.
              </p>

            </div>


            <div className="service-grid">

              {/* LIBRARY */}

              <article className="service-card">

                <div className="service-icon">
                  LIB
                </div>

                <h3>
                  Library Services
                </h3>

                <p>
                  Access books, research areas,
                  computers, reading spaces, and
                  other library resources.
                </p>

                <a
                  href="/library"
                  className="service-button"
                >
                  Visit Library
                  <span></span>
                </a>

              </article>


              {/* AVR */}

              <article className="service-card">

                <div className="service-icon">
                  AVR
                </div>

                <h3>
                  AVR Services
                </h3>

                <p>
                  Request audio-visual equipment,
                  technical assistance, photography,
                  videography, and AVR facilities.
                </p>

                <a
                  href="/avr"
                  className="service-button"
                >
                  Visit AVR
                  <span></span>
                </a>

              </article>


              {/* TECHNICAL */}

              <article className="service-card">

                <div className="service-icon">
                  IT
                </div>

                <h3>
                  Technical Assistance
                </h3>

                <p>
                  Request assistance for computer-related
                  concerns, equipment support, and other
                  technical needs.
                </p>

                <a
                  href="/services"
                  className="service-button"
                >
                  Request Assistance
                  <span></span>
                </a>

              </article>

            </div>

          </div>

        </section>


        {/* =================================================
            QUICK LINKS
        ================================================= */}

        <section
          className="quick-links-section"
          id="quick-links"
        >

          <div className="container">

            <div className="section-heading centered">

              <span className="section-label">
                DIGITAL RESOURCES
              </span>

              <h2>
                Quick
                <span>
                  Links.
                </span>
              </h2>

              <p>
                Quickly access digital learning,
                library, and reading resources.
              </p>

            </div>


            <div className="quick-links-grid">

              {quickLinks.map((link) => (

                <a
                  key={link.name}
                  href={link.url}
                  className="quick-link-card"
                  target={
                    link.url !== "#"
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    link.url !== "#"
                      ? "noopener noreferrer"
                      : undefined
                  }
                >

                  <div className="quick-link-icon">
                    ↗
                  </div>

                  <div>

                    <h3>
                      {link.name}
                    </h3>

                    <p>
                      {link.description}
                    </p>

                  </div>

                </a>

              ))}

            </div>

          </div>

        </section>


        {/* =================================================
            FACILITIES
        ================================================= */}

        <section
          className="facilities-section"
          id="facilities"
        >

          <div className="container">

            <div className="facility-heading">

              <div>

                <span className="section-label">
                  OUR FACILITIES
                </span>

                <h2>
                  Spaces designed for
                  <span>
                    learning.
                  </span>
                </h2>

              </div>

              <p>
                Explore the different learning spaces
                available within the Instructional
                Media Center.
              </p>

            </div>


            {loading ? (

              <div className="content-loading">
                Loading facilities...
              </div>

            ) : currentFacility ? (

              <div className="facility-slider">

                <button
                  type="button"
                  className="facility-arrow facility-arrow-left"
                  onClick={previousFacility}
                  aria-label="Previous facility"
                >
                  ↑
                </button>


                <article
                  className="simple-facility-card"
                  key={currentFacility.id}
                >

                  {currentFacility.image && (

                    <div className="simple-facility-image">

                      <img
                        src={currentFacility.image}
                        alt={currentFacility.title}
                      />

                    </div>

                  )}


                  <div className="simple-facility-content">

                    <span className="facility-number">
                      {String(
                        facilityIndex + 1
                      ).padStart(2, "0")}
                    </span>

                    <h3>
                      {currentFacility.title}
                    </h3>

                    <p>
                      {getShortDescription(
                        currentFacility.description
                      )}
                    </p>

                    <button
                      type="button"
                      className="facility-read-button"
                      onClick={() =>
                        openModal(
                          "facility",
                          currentFacility
                        )
                      }
                    >
                      Read More
                      <span>→</span>
                    </button>

                  </div>

                </article>


                <button
                  type="button"
                  className="facility-arrow facility-arrow-right"
                  onClick={nextFacility}
                  aria-label="Next facility"
                >
                  ↓
                </button>

              </div>

            ) : (

              <div className="empty-content">
                <p>
                  No facilities listed yet.
                </p>
              </div>

            )}


            {facilities.length > 1 && (

              <div className="facility-indicators">

                {facilities.map((facility, index) => (

                  <button
                    type="button"
                    key={facility.id}
                    className={
                      index === facilityIndex
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setFacilityIndex(index)
                    }
                    aria-label={`Go to facility ${
                      index + 1
                    }`}
                  />

                ))}

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            VISION & MISSION
        ================================================= */}

        <section className="vision-section">

          <div className="container vision-container">

            <div className="vision-intro">

              <span className="section-label">
                OUR PURPOSE
              </span>

              <h2>
                Supporting the school
                <span>
                  community.
                </span>
              </h2>

              <p>
                The IMC is committed to creating an
                environment where information, technology,
                and learning resources are accessible to everyone.
              </p>

            </div>


            <div className="vision-cards">

              <article className="purpose-card">

                <div className="purpose-number">
                  01
                </div>

                <h3>
                  Vision
                </h3>

                <p>
                  {visionMission.vision}
                </p>

              </article>


              <article className="purpose-card">

                <div className="purpose-number">
                  02
                </div>

                <h3>
                  Mission
                </h3>

                <p>
                  {visionMission.mission}
                </p>

              </article>

            </div>

          </div>

        </section>


        {/* =================================================
            ABOUT
        ================================================= */}

        <section
          className="intro-section"
          id="about"
        >

          <div className="container intro-container">

            <div className="section-heading">

              <span className="section-label">
                ABOUT THE IMC
              </span>

              <h2>
                A place where information
                <span>
                  meets learning.
                </span>
              </h2>

            </div>


            <div className="intro-text">

              <p>
                The Instructional Media Center serves
                as a central hub for learning resources,
                research, technology, and media services.
              </p>

              <p>
                It supports students, teachers, and the
                school community by providing accessible
                facilities, information resources, and
                technology-related services.
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className="main-footer"
        id="staff"
      >

        <div className="container footer-container">

          <div className="footer-brand">

            <h3>
              Instructional Media Center Staff
            </h3>

            <p>
              Dedicated personnel supporting learning
              through information, technology, and
              media services.
            </p>

          </div>


          <div className="footer-links">

            <div>

              <h4>
                Explore
              </h4>

              <a href="#home">
                Home
              </a>

              <a href="#activities">
                Activities
              </a>

              <a href="#announcements">
                Announcements
              </a>

              <a href="#services">
                Services
              </a>

            </div>


            <div>

              <h4>
                Resources
              </h4>

              <a href="#facilities">
                Facilities
              </a>

              <a href="#quick-links">
                Quick Links
              </a>

              <a href="#about">
                About IMC
              </a>

              <a href="/login">
                Admin Login
              </a>

            </div>

          </div>

        </div>


        <div className="footer-bottom">

          <div className="container">

            <p>
              © 2026 Instructional Media Center.
              All rights reserved.
            </p>

          </div>

        </div>

      </footer>


      {/* =================================================
          MODAL
      ================================================= */}

      {selectedContent && (

        <div
          className="content-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="content-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>


            {selectedContent.item.image && (

              <div className="modal-image-wrapper">

                <img
                  src={selectedContent.item.image}
                  alt={selectedContent.item.title}
                  className="modal-image"
                />

              </div>

            )}


            <div className="modal-content">

              {selectedContent.item.badge && (

                <span className="modal-badge">
                  {selectedContent.item.badge}
                </span>

              )}


              {selectedContent.item.date && (

                <span className="modal-date">
                  {selectedContent.item.date}
                </span>

              )}


              {selectedContent.item.tag && (

                <span className="modal-tag">
                  {selectedContent.item.tag}
                </span>

              )}


              <h2>
                {selectedContent.item.title}
              </h2>


              <div className="modal-divider"></div>


              <p className="modal-description">
                {selectedContent.item.description}
              </p>


              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Home;

