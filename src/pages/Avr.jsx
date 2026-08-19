import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Avr.css";

function Avr() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [information, setInformation] = useState([]);
  const [news, setNews] = useState([]);

  const [visionMission, setVisionMission] = useState({
    title: "",
    body: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     NEWS MODAL
  ===================================================== */

  const [selectedNews, setSelectedNews] = useState(null);

  /* =====================================================
     CAROUSEL
  ===================================================== */

  const [newsIndex, setNewsIndex] = useState(0);

  /* =====================================================
     MOBILE MENU
  ===================================================== */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =====================================================
     FETCH OPERATING HOURS
  ===================================================== */

  const fetchSchedules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("avr_operating_hours")
        .select("*")
        .order("day_order", {
          ascending: true,
        });

      if (error) {
        console.error("AVR OPERATING HOURS ERROR:", error);
        throw error;
      }

      setSchedules(data || []);
    } catch (error) {
      console.error("Unexpected AVR hours error:", error);
      setSchedules([]);
    }
  }, []);

  /* =====================================================
     FETCH AVR INFORMATION
  ===================================================== */

  const fetchInformation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("avr_information_services")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("AVR INFORMATION ERROR:", error);
        throw error;
      }

      setInformation(data || []);
    } catch (error) {
      console.error("Unexpected AVR information error:", error);
      setInformation([]);
    }
  }, []);

  /* =====================================================
     FETCH VISION & MISSION
  ===================================================== */

  const fetchVisionMission = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("avr_vision_mission")
        .select("*")
        .order("updated_at", {
          ascending: false,
        })
        .limit(1);

      if (error) {
        console.error("AVR VISION MISSION ERROR:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const item = data[0];

        setVisionMission({
          title: item.title || "",
          body: item.body || "",
          image_url: item.image_url || "",
        });
      } else {
        setVisionMission({
          title: "",
          body: "",
          image_url: "",
        });
      }
    } catch (error) {
      console.error(
        "Unexpected AVR vision mission error:",
        error
      );

      setVisionMission({
        title: "",
        body: "",
        image_url: "",
      });
    }
  }, []);

  /* =====================================================
     FETCH AVR NEWS
  ===================================================== */

  const fetchNews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("avr_news")
        .select("*")
        .order("published_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("AVR NEWS ERROR:", error);
        throw error;
      }

      setNews(data || []);
      setNewsIndex(0);
    } catch (error) {
      console.error("Unexpected AVR news error:", error);
      setNews([]);
    }
  }, []);

  /* =====================================================
     FETCH EVERYTHING
  ===================================================== */

  const fetchAvrData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const results = await Promise.allSettled([
        fetchSchedules(),
        fetchInformation(),
        fetchVisionMission(),
        fetchNews(),
      ]);

      const hasError = results.some(
        (result) => result.status === "rejected"
      );

      if (hasError) {
        setErrorMessage(
          "Some AVR information could not be loaded. Please try again."
        );
      }
    } catch (error) {
      console.error("AVR loading error:", error);

      setErrorMessage(
        "Unable to load AVR information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    fetchSchedules,
    fetchInformation,
    fetchVisionMission,
    fetchNews,
  ]);

  /* =====================================================
     INITIAL LOAD + REALTIME
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      await fetchAvrData();
    };

    initialize();

    const channel = supabase
      .channel("avr-public-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_operating_hours",
        },
        () => {
          fetchSchedules();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_information_services",
        },
        () => {
          fetchInformation();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_vision_mission",
        },
        () => {
          fetchVisionMission();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_news",
        },
        () => {
          fetchNews();
        }
      )

      .subscribe();

    return () => {
      mounted = false;

      supabase.removeChannel(channel);
    };
  }, [
    fetchAvrData,
    fetchSchedules,
    fetchInformation,
    fetchVisionMission,
    fetchNews,
  ]);

  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSelectedNews(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =====================================================
     LOCK BODY WHEN NEWS MODAL IS OPEN
  ===================================================== */

  useEffect(() => {
    if (selectedNews) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflowX = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflowX = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflowX = "";
    };
  }, [selectedNews]);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = (time) => {
    if (!time) return "";

    const value = String(time);
    const parts = value.split(":");

    if (parts.length < 2) {
      return value;
    }

    const hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) {
      return value;
    }

    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes} ${suffix}`;
  };

  /* =====================================================
     NEWS CAROUSEL
  ===================================================== */

  const nextNews = () => {
    if (!news.length) return;

    setNewsIndex((current) =>
      current >= news.length - 1 ? 0 : current + 1
    );
  };

  const previousNews = () => {
    if (!news.length) return;

    setNewsIndex((current) =>
      current <= 0 ? news.length - 1 : current - 1
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="avr-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="main-header">

        <div className="container header-container">

          <a
            href="/"
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

            <a href="/" onClick={closeMenu}>
              Home
            </a>

            <a
              href="/#activities"
              onClick={closeMenu}
            >
              Activities
            </a>

            <a
              href="/#announcements"
              onClick={closeMenu}
            >
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

                <a
                  href="/library"
                  className="nav-dropdown-item"
                >
                  <span className="dropdown-item-title">
                    Library
                  </span>

                  <span className="dropdown-item-description">
                    Library resources and research
                  </span>
                </a>

                <a
                  href="/avr"
                  className="nav-dropdown-item active"
                >
                  <span className="dropdown-item-title">
                    AVR
                  </span>

                  <span className="dropdown-item-description">
                    Audio-visual facilities and equipment
                  </span>
                </a>

                <a
                  href="/services"
                  className="nav-dropdown-item"
                >
                  <span className="dropdown-item-title">
                    Technical Assistance
                  </span>

                  <span className="dropdown-item-description">
                    Technology and equipment support
                  </span>
                </a>

              </div>
            </div>

            <a
              href="/#facilities"
              onClick={closeMenu}
            >
              Facilities
            </a>

            <a
              href="/#about"
              onClick={closeMenu}
            >
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

                <a
                  href="https://hfapgs.aralinks.net:8080/login/index.php?loginredirect=1"
                  className="nav-dropdown-item"
                >
                  <span className="dropdown-item-title">
                    Aralinks
                  </span>

                  <span className="dropdown-item-description">
                    Digital learning resources
                  </span>
                </a>

                <a
                  href="https://hfa-library.follettdestiny.com/portal/portal?app=Library%20Manager&appId=destiny-DFXG-DKVF&siteGuid=6FCE2EC2-064B-4961-BE56-2AF87CAD9632&nav=%252Fcataloging%252Fservlet%252Fpresentadvancedsearchredirectorform.do%253Fl2m%253DLibrary%252520Search%2526tm%253DTopLevelCatalog%2526l2m%253DLibrary%252BSearch"
                  className="nav-dropdown-item"
                >
                  <span className="dropdown-item-title">
                    Follett Destiny
                  </span>

                  <span className="dropdown-item-description">
                    Library catalog and resources
                  </span>
                </a>

                <a
                  href="https://www.getepic.com/"
                  className="nav-dropdown-item"
                >
                  <span className="dropdown-item-title">
                    Epic Reading
                  </span>

                  <span className="dropdown-item-description">
                    Digital reading platform
                  </span>
                </a>

              </div>
            </div>

            <a
              href="/staff"
              onClick={closeMenu}
            >
              Staff
            </a>

          </nav>

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
              onClick={() =>
                setMenuOpen(
                  (previous) => !previous
                )
              }
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

          <a href="/" onClick={closeMenu}>
            Home
          </a>

          <a
            href="/#activities"
            onClick={closeMenu}
          >
            Activities
          </a>

          <a
            href="/#announcements"
            onClick={closeMenu}
          >
            Announcements
          </a>

          <div className="mobile-nav-group">

            <span className="mobile-nav-heading">
              Services
            </span>

            <a
              href="/library"
              className="mobile-sub-link"
              onClick={closeMenu}
            >
              Library
            </a>

            <a
              href="/avr"
              className="mobile-sub-link active"
              onClick={closeMenu}
            >
              AVR
            </a>

            <a
              href="/services"
              className="mobile-sub-link"
              onClick={closeMenu}
            >
              Technical Assistance
            </a>

          </div>

          <a
            href="/#facilities"
            onClick={closeMenu}
          >
            Facilities
          </a>

          <a
            href="/#about"
            onClick={closeMenu}
          >
            About
          </a>

          <div className="mobile-nav-group">

            <span className="mobile-nav-heading">
              Quick Links
            </span>

            <a
              href="https://hfapgs.aralinks.net:8080/login/index.php?loginredirect=1"
              className="mobile-sub-link"
              onClick={closeMenu}
            >
              Aralinks
            </a>

            <a
              href="https://hfa-library.follettdestiny.com/portal/portal?app=Library%20Manager&appId=destiny-DFXG-DKVF&siteGuid=6FCE2EC2-064B-4961-BE56-2AF87CAD9632&nav=%252Fcataloging%252Fservlet%2Fpresentadvancedsearchredirectorform.do%253Fl2m%253DLibrary%252520Search%2526tm%253DTopLevelCatalog%2526l2m%253DLibrary%252BSearch"
              className="mobile-sub-link"
              onClick={closeMenu}
            >
              Follett Destiny
            </a>

            <a
              href="https://www.getepic.com/"
              className="mobile-sub-link"
              onClick={closeMenu}
            >
              Epic Reading
            </a>

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

      {/* =================================================
          PAGE INDICATOR
      ================================================= */}

      <div className="avr-page-indicator">

        <div className="container">

          <span>
            Instructional Media Center
          </span>

          <strong>
            / AVR
          </strong>

        </div>

      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <main>

        {/* HERO */}

        <section className="avr-hero">

          <div className="container avr-hero-container">

            <div className="avr-hero-content">

              <span className="avr-label">
                INSTRUCTIONAL MEDIA CENTER • AUDIO-VISUAL ROOM
              </span>

              <h1>
                Audio-Visual
                <span>
                  Room & Services.
                </span>
              </h1>

              <p>
                Explore the Audio-Visual Room,
                its facilities, equipment,
                services, operating hours,
                and latest updates available
                to the school community.
              </p>

              <div className="avr-hero-actions">

                <a
                  href="#news"
                  className="primary-button"
                >
                  Latest News
                </a>

                <a
                  href="#schedule"
                  className="secondary-button"
                >
                  Operating Hours
                </a>

              </div>

            </div>

            {/* HOURS */}

            <aside
              className="avr-hero-hours"
              id="schedule"
            >

              <div className="avr-hours-header">

                <span>
                  AVR HOURS
                </span>

                <h2>
                  Operating Hours
                </h2>

              </div>

              {loading ? (

                <div className="avr-hours-loading">
                  Loading...
                </div>

              ) : schedules.length > 0 ? (

                <div className="avr-hours-list">

                  {schedules.map(
                    (schedule) => (
                      <div
                        className="avr-hour-row"
                        key={schedule.id}
                      >

                        <strong>
                          {schedule.day_name}
                        </strong>

                        <span>
                          {schedule.is_closed
                            ? "Closed"
                            : `${formatTime(
                                schedule.opening_time
                              )} — ${formatTime(
                                schedule.closing_time
                              )}`}
                        </span>

                      </div>
                    )
                  )}

                </div>

              ) : (

                <div className="avr-hours-empty">
                  Operating hours have not
                  been posted yet.
                </div>

              )}

            </aside>

          </div>

        </section>

        {/* DARK BLUE SEPARATOR */}

        <div className="avr-dark-separator">
          <span></span>
          <strong>AVR SERVICES</strong>
          <span></span>
        </div>

        {/* MARQUEE */}

        <div className="avr-marquee">

          <div className="avr-marquee-track">

            <span>
              AUDIO-VISUAL SERVICES
            </span>

            <i>✦</i>

            <span>
              PRESENTATION SUPPORT
            </span>

            <i>✦</i>

            <span>
              MEDIA EQUIPMENT
            </span>

            <i>✦</i>

            <span>
              LEARNING TECHNOLOGY
            </span>

            <i>✦</i>

            <span>
              AVR FACILITIES
            </span>

            <i>✦</i>

            <span>
              SCHOOL EVENTS
            </span>

            <i>✦</i>

            <span>
              AUDIO-VISUAL SERVICES
            </span>

            <i>✦</i>

            <span>
              PRESENTATION SUPPORT
            </span>

            <i>✦</i>

          </div>

        </div>

        {/* =================================================
            LATEST NEWS CAROUSEL
        ================================================= */}

        <section
          className="avr-section avr-news-section"
          id="news"
        >

          <div className="container">

            <SectionHeading
              label="AVR UPDATES"
              title="Latest"
              highlight="News."
              description="Stay updated with the latest Audio-Visual Room announcements, activities, and services."
            />

            {loading ? (

              <LoadingState text="Loading AVR news..." />

            ) : news.length > 0 ? (

              <div className="avr-news-carousel">

                <button
                  type="button"
                  className="avr-carousel-arrow avr-carousel-prev"
                  onClick={previousNews}
                  aria-label="Previous news"
                >
                  ‹
                </button>

                <div className="avr-carousel-viewport">

                  <div
                    className="avr-carousel-track"
                    style={{
                      transform: `translate3d(-${
                        newsIndex * 100
                      }%, 0, 0)`,
                    }}
                  >

                    {news.map((item) => (

                      <div
                        className="avr-carousel-slide"
                        key={item.id}
                      >

                        <article className="avr-news-feature">

                          {item.image_url ? (

                            <div className="avr-news-feature-image">

                              <img
                                src={item.image_url}
                                alt={
                                  item.title ||
                                  "AVR News"
                                }
                              />

                            </div>

                          ) : (

                            <div className="avr-news-feature-image avr-no-image">

                              <span>
                                AVR NEWS
                              </span>

                            </div>

                          )}

                          <div className="avr-news-feature-content">

                            {item.published_date && (
                              <span className="avr-content-date">
                                {formatDate(
                                  item.published_date
                                )}
                              </span>
                            )}

                            <h3>
                              {item.title ||
                                "AVR News"}
                            </h3>

                            <p>
                              {item.body ||
                                "No description available."}
                            </p>

                            <button
                              type="button"
                              className="avr-read-news"
                              onClick={() =>
                                setSelectedNews(item)
                              }
                            >
                              Read News
                              <span>→</span>
                            </button>

                          </div>

                        </article>

                      </div>

                    ))}

                  </div>

                </div>

                <button
                  type="button"
                  className="avr-carousel-arrow avr-carousel-next"
                  onClick={nextNews}
                  aria-label="Next news"
                >
                  ›
                </button>

              </div>

            ) : (

              <EmptyState
                text="No AVR news has been posted yet."
              />

            )}

            {news.length > 1 && (
              <div className="avr-carousel-dots">

                {news.map((item, index) => (

                  <button
                    key={item.id}
                    type="button"
                    className={
                      index === newsIndex
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setNewsIndex(index)
                    }
                    aria-label={`Go to news ${
                      index + 1
                    }`}
                  />

                ))}

              </div>
            )}

          </div>

        </section>

        {/* DARK BLUE SECTION DIVIDER */}

        <div className="avr-section-divider">
          <div></div>
        </div>

        {/* =================================================
            INFORMATION
        ================================================= */}

        <section
          className="avr-section avr-information-section"
          id="information"
        >

          <div className="container">

            <SectionHeading
              label="AVR INFORMATION"
              title="Information &"
              highlight="Services."
              description="Learn more about the Audio-Visual Room, available equipment, facilities, and services provided to the school community."
            />

            {loading ? (

              <LoadingState
                text="Loading AVR information..."
              />

            ) : information.length > 0 ? (

              <div className="avr-information-grid">

                {information.map(
                  (item) => (
                    <article
                      className="avr-information-card"
                      key={item.id}
                    >

                      {item.image_url ? (

                        <div className="avr-information-image">

                          <img
                            src={item.image_url}
                            alt={
                              item.title ||
                              "AVR Information"
                            }
                            loading="lazy"
                          />

                        </div>

                      ) : (

                        <div className="avr-information-image avr-no-image">

                          <span>
                            AVR
                          </span>

                        </div>

                      )}

                      <div className="avr-information-content">

                        <span className="avr-information-label">
                          AVR SERVICE
                        </span>

                        <h3>
                          {item.title ||
                            "AVR Service"}
                        </h3>

                        <p>
                          {item.body ||
                            "No description available."}
                        </p>

                      </div>

                    </article>
                  )
                )}

              </div>

            ) : (

              <EmptyState
                text="No AVR information or services have been posted yet."
              />

            )}

          </div>

        </section>

        {/* =================================================
            SUPPORT
        ================================================= */}

        <section
          className="avr-section avr-services-section"
          id="services"
        >

          <div className="container">

            <SectionHeading
              label="AVR SUPPORT"
              title="Supporting"
              highlight="Learning."
              description="The Audio-Visual Room provides facilities and technical resources that support instruction, presentations, meetings, events, and other school activities."
            />

            <div className="avr-support-grid">

              <article className="avr-support-card">

                <span className="avr-support-number">
                  01
                </span>

                <div>

                  <span className="avr-support-label">
                    PRESENTATIONS
                  </span>

                  <h3>
                    Presentation Support
                  </h3>

                  <p>
                    Support for presentations,
                    lectures, demonstrations,
                    and instructional activities
                    requiring audio-visual equipment.
                  </p>

                </div>

              </article>

              <article className="avr-support-card">

                <span className="avr-support-number">
                  02
                </span>

                <div>

                  <span className="avr-support-label">
                    EQUIPMENT
                  </span>

                  <h3>
                    AV Equipment
                  </h3>

                  <p>
                    Access to available
                    audio-visual equipment
                    and facilities designed
                    to support teaching,
                    learning, and school activities.
                  </p>

                </div>

              </article>

              <article className="avr-support-card">

                <span className="avr-support-number">
                  03
                </span>

                <div>

                  <span className="avr-support-label">
                    EVENTS
                  </span>

                  <h3>
                    Event Support
                  </h3>

                  <p>
                    Audio-visual assistance
                    for school programs,
                    meetings, seminars,
                    presentations, and
                    institutional activities.
                  </p>

                </div>

              </article>

            </div>

          </div>

        </section>

        {/* =================================================
            VISION & MISSION
        ================================================= */}

        <section
          className="avr-section avr-purpose-section"
          id="about-avr"
        >

          <div className="container">

            <SectionHeading
              label="OUR PURPOSE"
              title="Technology for"
              highlight="Learning."
              description="The Audio-Visual Room supports the school community through accessible facilities, media resources, and learning technologies."
            />

            <div className="avr-purpose-card">

              <div className="avr-purpose-image">

                {visionMission.image_url ? (

                  <img
                    src={visionMission.image_url}
                    alt={
                      visionMission.title ||
                      "AVR Vision and Mission"
                    }
                  />

                ) : (

                  <div className="avr-purpose-image-placeholder">
                    <span>
                      AVR
                    </span>
                  </div>

                )}

              </div>

              <div className="avr-purpose-content">

                <span className="avr-purpose-number">
                  01
                </span>

                <span className="avr-purpose-label">
                  OUR VISION & MISSION
                </span>

                <h3>
                  {visionMission.title ||
                    "Vision & Mission"}
                </h3>

                <p>
                  {visionMission.body ||
                    "AVR Vision & Mission has not been posted yet."}
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

      {/* =================================================
          ERROR
      ================================================= */}

      {errorMessage && (

        <div className="avr-error-message">

          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={fetchAvrData}
          >
            Try Again
          </button>

        </div>

      )}

      {/* =================================================
          NEWS MODAL
      ================================================= */}

      {selectedNews && (

        <div
          className="avr-news-modal-overlay"
          onClick={() =>
            setSelectedNews(null)
          }
        >

          <div
            className="avr-news-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="avr-news-modal-close"
              onClick={() =>
                setSelectedNews(null)
              }
              aria-label="Close news"
            >
              ×
            </button>

            {selectedNews.image_url && (

              <div className="avr-news-modal-image">

                <img
                  src={selectedNews.image_url}
                  alt={
                    selectedNews.title ||
                    "AVR News"
                  }
                />

              </div>

            )}

            <div className="avr-news-modal-content">

              <span className="avr-content-date">
                {formatDate(
                  selectedNews.published_date
                )}
              </span>

              <h2>
                {selectedNews.title ||
                  "AVR News"}
              </h2>

              <p>
                {selectedNews.body ||
                  "No description available."}
              </p>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="main-footer">

        <div className="container footer-container">

          <div className="footer-brand">

            <h3>
              Instructional Media Center
            </h3>

            <p>
              Audio-visual facilities,
              equipment, learning technology,
              and technical support for the
              school community.
            </p>

          </div>

          <div className="footer-links">

            <div>

              <h4>
                AVR
              </h4>

              <a href="#schedule">
                Operating Hours
              </a>

              <a href="#news">
                Latest News
              </a>

              <a href="#information">
                Information & Services
              </a>

              <a href="#services">
                AVR Support
              </a>

              <a href="#about-avr">
                Vision & Mission
              </a>

            </div>

            <div>

              <h4>
                Services
              </h4>

              <a href="/library">
                Library
              </a>

              <a href="/avr">
                AVR
              </a>

              <a href="/services">
                Technical Assistance
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

    </div>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  label,
  title,
  highlight,
  description,
}) {
  return (
    <div className="avr-section-heading">

      <span className="section-label">
        {label}
      </span>

      <h2>
        {title}{" "}
        <span>
          {highlight}
        </span>
      </h2>

      {description && (
        <p>
          {description}
        </p>
      )}

    </div>
  );
}


/* =========================================================
   LOADING STATE
========================================================= */

function LoadingState({ text }) {
  return (
    <div className="avr-loading">
      {text}
    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
  return (
    <div className="avr-empty">
      {text}
    </div>
  );
}


/* =========================================================
   EXPORT
========================================================= */

export default Avr;