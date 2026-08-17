import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import hfaLogo from "../assets/hfalogo.png";
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
     MOBILE MENU
  ===================================================== */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =====================================================
     FETCH OPERATING HOURS
     
     IMPORTANT:
     Dashboard uses:
       avr_operating_hours

     NOT:
       avr_hours
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
        console.error(
          "AVR OPERATING HOURS ERROR:",
          error
        );

        throw error;
      }

      console.log(
        "AVR OPERATING HOURS DATA:",
        data
      );

      setSchedules(data || []);
    } catch (error) {
      console.error(
        "Unexpected AVR hours error:",
        error
      );

      setSchedules([]);
    }
  }, []);

  /* =====================================================
     FETCH AVR INFORMATION & SERVICES

     Dashboard uses:
       avr_information_services

     NOT:
       avr_information
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
        console.error(
          "AVR INFORMATION ERROR:",
          error
        );

        throw error;
      }

      console.log(
        "AVR INFORMATION DATA:",
        data
      );

      setInformation(data || []);
    } catch (error) {
      console.error(
        "Unexpected AVR information error:",
        error
      );

      setInformation([]);
    }
  }, []);

  /* =====================================================
     FETCH VISION & MISSION

     Dashboard uses:
       avr_vision_mission

     Current dashboard structure:
       title
       body
       image_url
  ===================================================== */

  const fetchVisionMission =
    useCallback(async () => {
      try {
        const { data, error } = await supabase
          .from("avr_vision_mission")
          .select("*")
          .order("updated_at", {
            ascending: false,
          })
          .limit(1);

        if (error) {
          console.error(
            "AVR VISION MISSION ERROR:",
            error
          );

          throw error;
        }

        console.log(
          "AVR VISION MISSION DATA:",
          data
        );

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

     Dashboard and public page both use:
       avr_news
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
        console.error(
          "AVR NEWS ERROR:",
          error
        );

        throw error;
      }

      console.log(
        "AVR NEWS DATA:",
        data
      );

      setNews(data || []);
    } catch (error) {
      console.error(
        "Unexpected AVR news error:",
        error
      );

      setNews([]);
    }
  }, []);

  /* =====================================================
     FETCH EVERYTHING
  ===================================================== */

  const fetchAvrData = useCallback(async () => {
    console.log(
      "======================================"
    );

    console.log(
      "LOADING PUBLIC AVR DATA..."
    );

    console.log(
      "======================================"
    );

    setLoading(true);
    setErrorMessage("");

    try {
      const results = await Promise.allSettled([
        fetchSchedules(),
        fetchInformation(),
        fetchVisionMission(),
        fetchNews(),
      ]);

      let hasError = false;

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          hasError = true;

          console.error(
            `AVR request ${index} failed:`,
            result.reason
          );
        }
      });

      if (hasError) {
        setErrorMessage(
          "Some AVR information could not be loaded. Please try again."
        );
      }

      console.log(
        "======================================"
      );

      console.log(
        "PUBLIC AVR DATA LOADING FINISHED"
      );

      console.log(
        "======================================"
      );
    } catch (error) {
      console.error(
        "AVR loading error:",
        error
      );

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

    /* ===================================================
       REALTIME
    =================================================== */

    const channel = supabase
      .channel("avr-public-realtime")

      /* -----------------------------------------------
         OPERATING HOURS
      ----------------------------------------------- */

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_operating_hours",
        },
        (payload) => {
          console.log(
            "Realtime AVR operating hours change:",
            payload
          );

          fetchSchedules();
        }
      )

      /* -----------------------------------------------
         INFORMATION & SERVICES
      ----------------------------------------------- */

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_information_services",
        },
        (payload) => {
          console.log(
            "Realtime AVR information change:",
            payload
          );

          fetchInformation();
        }
      )

      /* -----------------------------------------------
         VISION & MISSION
      ----------------------------------------------- */

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_vision_mission",
        },
        (payload) => {
          console.log(
            "Realtime AVR vision mission change:",
            payload
          );

          fetchVisionMission();
        }
      )

      /* -----------------------------------------------
         NEWS
      ----------------------------------------------- */

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avr_news",
        },
        (payload) => {
          console.log(
            "Realtime AVR news change:",
            payload
          );

          fetchNews();
        }
      )

      /* -----------------------------------------------
         SUBSCRIBE
      ----------------------------------------------- */

      .subscribe((status) => {
        console.log(
          "AVR realtime status:",
          status
        );
      });

    /* ===================================================
       CLEANUP
    =================================================== */

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
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

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
     RENDER
  ===================================================== */

  return (
    <div className="avr-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="main-header">

        <div className="container header-container">

          {/* BRAND */}

          <a
            href="/"
            className="brand"
            onClick={closeMenu}
          >
            <img
              src={hfaLogo}
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

          {/* DESKTOP NAVIGATION */}

          <nav className="main-navigation">

            <a
              href="/"
              onClick={closeMenu}
            >
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

            {/* SERVICES */}

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

            {/* FACILITIES */}

            <a
              href="/#facilities"
              onClick={closeMenu}
            >
              Facilities
            </a>

            {/* ABOUT */}

            <a
              href="/#about"
              onClick={closeMenu}
            >
              About
            </a>

            {/* QUICK LINKS */}

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

            {/* STAFF */}

            <a
              href="/staff"
              onClick={closeMenu}
            >
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

        {/* MOBILE NAVIGATION */}

        <nav
          className={`mobile-navigation ${
            menuOpen
              ? "mobile-navigation-open"
              : ""
          }`}
        >

          <a
            href="/"
            onClick={closeMenu}
          >
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
              onClick={closeMenu}
              className="mobile-sub-link"
            >
              Library
            </a>

            <a
              href="/avr"
              onClick={closeMenu}
              className="mobile-sub-link active"
            >
              AVR
            </a>

            <a
              href="/services"
              onClick={closeMenu}
              className="mobile-sub-link"
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
              href="https://hfa-library.follettdestiny.com/portal/portal?app=Library%20Manager&appId=destiny-DFXG-DKVF&siteGuid=6FCE2EC2-064B-4961-BE56-2AF87CAD9632&nav=%252Fcataloging%252Fservlet%252Fpresentadvancedsearchredirectorform.do%253Fl2m%253DLibrary%252520Search%2526tm%253DTopLevelCatalog%2526l2m%253DLibrary%252BSearch"
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

      {/* =====================================================
          PAGE INDICATOR
      ===================================================== */}

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

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* =================================================
            HERO
        ================================================= */}

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

            {/* OPERATING HOURS */}

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
                          {schedule.is_closed ? (
                            "Closed"
                          ) : (
                            <>
                              {formatTime(
                                schedule.opening_time
                              )}

                              {" — "}

                              {formatTime(
                                schedule.closing_time
                              )}
                            </>
                          )}
                        </span>

                      </div>
                    )
                  )}

                </div>

              ) : (

                <div className="avr-hours-empty">
                  Operating hours have not been posted yet.
                </div>

              )}

            </aside>

          </div>

        </section>

        {/* =================================================
            MARQUEE
        ================================================= */}

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

            <span>
              MEDIA EQUIPMENT
            </span>

            <i>✦</i>

          </div>

        </div>

        {/* =================================================
            AVR NEWS
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

              <LoadingState
                text="Loading AVR news..."
              />

            ) : news.length > 0 ? (

              <div className="avr-card-grid">

                {news.map(
                  (item) => (
                    <article
                      className="avr-news-card"
                      key={item.id}
                    >

                      {item.image_url ? (

                        <div className="avr-card-image">

                          <img
                            src={item.image_url}
                            alt={
                              item.title ||
                              "AVR News"
                            }
                            loading="lazy"
                          />

                        </div>

                      ) : (

                        <div className="avr-card-image avr-no-image">

                          <span>
                            AVR NEWS
                          </span>

                        </div>

                      )}

                      <div className="avr-card-content">

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

                        <p className="avr-card-text">
                          {item.body ||
                            "No description available."}
                        </p>

                        <ReadMore />

                      </div>

                    </article>
                  )
                )}

              </div>

            ) : (

              <EmptyState
                text="No AVR news has been posted yet."
              />

            )}

          </div>

        </section>

        {/* =================================================
            INFORMATION & SERVICES
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

                        <p className="avr-card-text">
                          {item.body ||
                            "No description available."}
                        </p>

                        <ReadMore />

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
            QUICK ACCESS / SUPPORT
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
                    and other instructional
                    activities requiring
                    audio-visual equipment.
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
                    learning, and school
                    activities.
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
                    other institutional
                    activities.
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

            <div className="avr-purpose-grid">

              {visionMission.image_url && (
                <div
                  className="avr-purpose-image"
                >
                  <img
                    src={
                      visionMission.image_url
                    }
                    alt={
                      visionMission.title ||
                      "AVR Vision and Mission"
                    }
                  />
                </div>
              )}

              <article className="avr-purpose-card">

                <span className="avr-purpose-number">
                  01
                </span>

                <div>

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

              </article>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          ERROR / REFRESH
      ===================================================== */}

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

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="main-footer">

        <div className="container footer-container">

          <div className="footer-brand">

            <h3>
              Instructional Media Center
            </h3>

            <p>
              Audio-visual facilities,
              equipment, learning
              technology, and technical
              support for the school
              community.
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
   READ MORE
========================================================= */

function ReadMore() {
  const handleReadMore = (event) => {
    const button =
      event.currentTarget;

    const cardContent =
      button.closest(
        ".avr-card-content, .avr-information-content"
      );

    if (!cardContent) return;

    const text =
      cardContent.querySelector(
        ".avr-card-text"
      );

    if (!text) return;

    const expanded =
      text.classList.toggle(
        "expanded"
      );

    button.textContent = expanded
      ? "Read Less"
      : "Read More";
  };

  return (
    <button
      type="button"
      className="avr-read-more"
      onClick={handleReadMore}
    >
      Read More
    </button>
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