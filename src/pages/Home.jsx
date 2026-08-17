import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import "./Home.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  // ================= DATA STATES =================

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

  // ================= MODAL =================

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

  // ================= MOBILE MENU =================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ================= QUICK LINKS =================
  //
  // You can replace the "#" with the actual links later.
  //
// ================= QUICK LINKS =================

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

  // ================= SERVICES =================

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

  // ================= FETCH ACTIVITIES =================

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

  // ================= FETCH ANNOUNCEMENTS =================

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Announcements fetch error:", error);
      return;
    }

    console.log("Announcements loaded:", data);

    setAnnouncements(data || []);
  };

  // ================= FETCH FACILITIES =================

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

  // ================= FETCH VISION & MISSION =================

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

  // ================= FETCH ALL HOME DATA =================

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

  // ================= INITIAL LOAD + REALTIME =================

  useEffect(() => {
    fetchHomeData();

    const channel = supabase
      .channel("home-realtime-changes")

      // ACTIVITIES
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

      // ANNOUNCEMENTS
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

      // FACILITIES
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

      // VISION & MISSION
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

  // ================= ESCAPE KEY =================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }

      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // ================= TEXT HELPERS =================

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

    return (
      text.substring(0, MAX_DESCRIPTION_LENGTH).trimEnd() + "..."
    );
  };

  // ================= RENDER =================

  return (
    <div className="imc-home">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="main-header">

        <div className="container header-container">

          {/* BRAND */}

          <a
            href="#home"
            className="brand"
            onClick={closeMenu}
          >

            <img
              src="/src/assets/hfalogo.png"
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


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav className="main-navigation">

            <a
              href="#home"
              onClick={closeMenu}
            >
              Home
            </a>


            <a
              href="#activities"
              onClick={closeMenu}
            >
              Activities
            </a>


            <a
              href="#announcements"
              onClick={closeMenu}
            >
              Announcements
            </a>


            {/* ===============================================
                SERVICES DROPDOWN
            =============================================== */}

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


            <a
              href="#facilities"
              onClick={closeMenu}
            >
              Facilities
            </a>


            <a
              href="#about"
              onClick={closeMenu}
            >
              About
            </a>


            {/* ===============================================
                QUICK LINKS DROPDOWN
            =============================================== */}

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


            <a
              href="/staff"
              onClick={closeMenu}
            >
              Staff
            </a>

          </nav>


          {/* =================================================
              HEADER ACTIONS
          ================================================= */}

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


        {/* =================================================
            MOBILE NAVIGATION
        ================================================= */}

        <nav
          className={`mobile-navigation ${
            menuOpen
              ? "mobile-navigation-open"
              : ""
          }`}
        >

          <a
            href="#home"
            onClick={closeMenu}
          >
            Home
          </a>


          <a
            href="#activities"
            onClick={closeMenu}
          >
            Activities
          </a>


          <a
            href="#announcements"
            onClick={closeMenu}
          >
            Announcements
          </a>


          {/* MOBILE SERVICES */}

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


          <a
            href="#facilities"
            onClick={closeMenu}
          >
            Facilities
          </a>


          <a
            href="#about"
            onClick={closeMenu}
          >
            About
          </a>


          {/* MOBILE QUICK LINKS */}

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


          <a
            href="/staff"
            onClick={closeMenu}
          >
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


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* =====================================================
            HERO
        ===================================================== */}

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


            {/* HERO INFORMATION CARD */}

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


        {/* =====================================================
            ACTIVITIES
        ===================================================== */}

        <section
          className="activities-section"
          id="activities"
        >

          <div className="container">

            <div className="section-heading centered">

              <span className="section-label">
                LATEST UPDATES
              </span>


              <h2>
                Activities &
                <span>
                  Campus News.
                </span>
              </h2>


              <p>
                Stay updated with the latest events,
                programs, and activities from the
                Instructional Media Center.
              </p>

            </div>


            {loading ? (

              <div className="content-loading">
                Loading activities...
              </div>

            ) : activities.length > 0 ? (

              <div className="activities-grid">

                {activities.map((activity) => (

                  <article
                    className="activity-card"
                    key={activity.id}
                  >

                    {activity.image && (

                      <div className="activity-image-wrapper">

                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="activity-image"
                        />

                      </div>

                    )}


                    <div className="activity-content">

                      {activity.date && (

                        <span className="activity-date">
                          {activity.date}
                        </span>

                      )}


                      <h3>
                        {activity.title}
                      </h3>


                      <p>
                        {getShortDescription(
                          activity.description
                        )}
                      </p>


                      {isLongText(
                        activity.description
                      ) && (

                        <button
                          type="button"
                          className="read-more-button"
                          onClick={() =>
                            openModal(
                              "activity",
                              activity
                            )
                          }
                        >
                          Read More
                          <span></span>
                        </button>

                      )}

                    </div>

                  </article>

                ))}

              </div>

            ) : (

              <div className="empty-content">

                <p>
                  No activities posted yet.
                </p>

              </div>

            )}

          </div>

        </section>


        {/* =====================================================
            ANNOUNCEMENTS
        ===================================================== */}

        <section
          className="announcement-section"
          id="announcements"
        >

          <div className="container">

            <div className="section-heading centered">

              <span className="section-label">
                CENTER ADVISORIES
              </span>


              <h2>
                Official
                <span>
                  Announcements.
                </span>
              </h2>


              <p>
                Important notices, schedule updates,
                and advisories from the Instructional
                Media Center.
              </p>

            </div>


            {loading ? (

              <div className="content-loading">
                Loading announcements...
              </div>

            ) : announcements.length > 0 ? (

              <div className="announcements-news-grid">

                {announcements.map((item) => (

                  <article
                    className="announcement-news-card"
                    key={item.id}
                  >

                    <div className="announcement-news-header-bar">

                      <span className="announcement-badge">
                        {item.badge || "ADVISORY"}
                      </span>


                      {item.date && (

                        <span className="announcement-date-text">
                          {item.date}
                        </span>

                      )}

                    </div>


                    <div className="announcement-news-body">

                      {item.tag && (

                        <span className="announcement-tag">
                          {item.tag}
                        </span>

                      )}


                      <h3>
                        {item.title}
                      </h3>


                      <p>
                        {getShortDescription(
                          item.description
                        )}
                      </p>


                      {isLongText(
                        item.description
                      ) && (

                        <button
                          type="button"
                          className="read-more-button"
                          onClick={() =>
                            openModal(
                              "announcement",
                              item
                            )
                          }
                        >
                          Read More
                          <span></span>
                        </button>

                      )}

                    </div>

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


        {/* =====================================================
            SERVICES
        ===================================================== */}

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


                <a href="/library">
                  Visit Library 
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


                <a href="/avr">
                  Visit AVR 
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


                <a href="/services">
                  Request Assistance 
                </a>

              </article>

            </div>

          </div>

        </section>


        {/* =====================================================
            QUICK LINKS SECTION
        ===================================================== */}

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


        {/* =====================================================
            FACILITIES
        ===================================================== */}

        <section
          className="facilities-section"
          id="facilities"
        >

          <div className="container">

            <div className="section-heading centered">

              <span className="section-label">
                OUR FACILITIES
              </span>


              <h2>
                Spaces designed for
                <span>
                  learning.
                </span>
              </h2>


              <p>
                Explore the different areas available
                within the Instructional Media Center.
              </p>

            </div>


            {loading ? (

              <div className="content-loading">
                Loading facilities...
              </div>

            ) : facilities.length > 0 ? (

              <div className="facility-grid">

                {facilities.map((facility) => (

                  <article
                    className="facility-card"
                    key={facility.id}
                  >

                    {facility.image && (

                      <div className="facility-image-wrapper">

                        <img
                          src={facility.image}
                          alt={facility.title}
                          className="facility-image"
                        />

                      </div>

                    )}


                    <div className="facility-content">

                      <h3>
                        {facility.title}
                      </h3>


                      <p>
                        {facility.description}
                      </p>

                    </div>

                  </article>

                ))}

              </div>

            ) : (

              <div className="empty-content">

                <p>
                  No facilities listed yet.
                </p>

              </div>

            )}

          </div>

        </section>


        {/* =====================================================
            VISION & MISSION
        ===================================================== */}

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


        {/* =====================================================
            ABOUT
        ===================================================== */}

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


      {/* =====================================================
          FOOTER
      ===================================================== */}

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


      {/* =====================================================
          READ MORE MODAL
      ===================================================== */}

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


            {/* MODAL IMAGE */}

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