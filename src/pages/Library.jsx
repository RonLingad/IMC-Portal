import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import "./Library.css";
import slideshowVideo from "../assets/slideshow.mp4";

function Library() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [visionMission, setVisionMission] = useState({
    vision: "",
    mission: "",
  });

  const [spaces, setSpaces] = useState([]);
  const [news, setNews] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [clubNews, setClubNews] = useState([]);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // NEWS CAROUSEL
  // =====================================================

  const [newsIndex, setNewsIndex] = useState(0);
  const [newsVisible, setNewsVisible] = useState(3);

  // =====================================================
  // MODAL
  // =====================================================

  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedWhatToKnow, setSelectedWhatToKnow] = useState(null);

  // =====================================================
  // MOBILE MENU
  // =====================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // =====================================================
  // FETCH OPERATING HOURS
  // =====================================================

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("library_hours")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Library hours error:", error);
      return;
    }

    setSchedules(data || []);
  };

  // =====================================================
  // FETCH VISION & MISSION
  // =====================================================

  const fetchVisionMission = async () => {
    const { data, error } = await supabase
      .from("library_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Library settings error:", error);
      return;
    }

    if (data) {
      setVisionMission({
        vision: data.vision || "",
        mission: data.mission || "",
      });
    }
  };

  // =====================================================
  // FETCH SPACES
  // =====================================================

  const fetchSpaces = async () => {
    const { data, error } = await supabase
      .from("library_spaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Library spaces error:", error);
      return;
    }

    setSpaces(data || []);
  };

  // =====================================================
  // FETCH NEWS
  // =====================================================

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("library_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Library news error:", error);
      return;
    }

    setNews(data || []);
  };

  // =====================================================
  // FETCH LIBRARY INFORMATION
  // =====================================================

  const fetchClubs = async () => {
    const { data, error } = await supabase
      .from("library_clubs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Library information error:", error);
      return;
    }

    setClubs(data || []);
  };

  // =====================================================
  // FETCH WHAT TO KNOW
  // =====================================================

  const fetchClubNews = async () => {
    const { data, error } = await supabase
      .from("library_club_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("What to Know error:", error);
      return;
    }

    setClubNews(data || []);
  };

  // =====================================================
  // FETCH EVERYTHING
  // =====================================================

  const fetchLibraryData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchSchedules(),
        fetchVisionMission(),
        fetchSpaces(),
        fetchNews(),
        fetchClubs(),
        fetchClubNews(),
      ]);
    } catch (error) {
      console.error("Library loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD + REALTIME
  // =====================================================

  useEffect(() => {
    fetchLibraryData();

    const channel = supabase
      .channel("library-public-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_hours",
        },
        fetchSchedules
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_settings",
        },
        fetchVisionMission
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_spaces",
        },
        fetchSpaces
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_news",
        },
        fetchNews
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_clubs",
        },
        fetchClubs
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_club_news",
        },
        fetchClubNews
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =====================================================
  // RESPONSIVE NEWS CAROUSEL
  // =====================================================

  useEffect(() => {
    const updateVisibleNews = () => {
      if (window.innerWidth <= 600) {
        setNewsVisible(1);
      } else if (window.innerWidth <= 950) {
        setNewsVisible(2);
      } else {
        setNewsVisible(3);
      }
    };

    updateVisibleNews();

    window.addEventListener("resize", updateVisibleNews);

    return () => {
      window.removeEventListener("resize", updateVisibleNews);
    };
  }, []);

  // =====================================================
  // NEWS CAROUSEL LIMIT
  // =====================================================

  const newsPageCount = useMemo(() => {
    return Math.max(1, news.length - newsVisible + 1);
  }, [news.length, newsVisible]);

  useEffect(() => {
    if (newsIndex > newsPageCount - 1) {
      setNewsIndex(Math.max(0, newsPageCount - 1));
    }
  }, [newsPageCount, newsIndex]);

  // =====================================================
  // AUTO SLIDE
  // =====================================================

  useEffect(() => {
    if (news.length <= newsVisible) {
      return;
    }

    const interval = setInterval(() => {
      setNewsIndex((current) => {
        if (current >= newsPageCount - 1) {
          return 0;
        }

        return current + 1;
      });
    }, 4500);

    return () => {
      clearInterval(interval);
    };
  }, [news.length, newsVisible, newsPageCount]);

  // =====================================================
  // ESCAPE KEY
  // =====================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSelectedNews(null);
        setSelectedWhatToKnow(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // =====================================================
  // LOCK BODY WHEN MODAL IS OPEN
  // =====================================================

  useEffect(() => {
    const modalOpen =
      selectedNews !== null ||
      selectedWhatToKnow !== null;

    document.body.style.overflow = modalOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedNews, selectedWhatToKnow]);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";

    const parts = time.split(":");

    if (parts.length < 2) return time;

    const hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) return time;

    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes} ${suffix}`;
  };

  // =====================================================
  // NEWS NAVIGATION
  // =====================================================

  const nextNews = () => {
    setNewsIndex((current) => {
      if (current >= newsPageCount - 1) {
        return 0;
      }

      return current + 1;
    });
  };

  const previousNews = () => {
    setNewsIndex((current) => {
      if (current <= 0) {
        return newsPageCount - 1;
      }

      return current - 1;
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="library-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

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

          <nav className="main-navigation">

            <a href="/" onClick={closeMenu}>
              Home
            </a>

            <a href="/#activities" onClick={closeMenu}>
              Activities
            </a>

            <a href="/#announcements" onClick={closeMenu}>
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
                  className="nav-dropdown-item active"
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
                  className="nav-dropdown-item"
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

            <a href="/#facilities" onClick={closeMenu}>
              Facilities
            </a>

            <a href="/#about" onClick={closeMenu}>
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
                  target="_blank"
                  rel="noopener noreferrer"
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
                  target="_blank"
                  rel="noopener noreferrer"
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
                  target="_blank"
                  rel="noopener noreferrer"
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

            <a href="/staff" onClick={closeMenu}>
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

        {/* MOBILE NAVIGATION */}

        <nav
          className={`mobile-navigation ${
            menuOpen ? "mobile-navigation-open" : ""
          }`}
        >

          <a href="/" onClick={closeMenu}>
            Home
          </a>

          <a href="/#activities" onClick={closeMenu}>
            Activities
          </a>

          <a href="/#announcements" onClick={closeMenu}>
            Announcements
          </a>

          <div className="mobile-nav-group">

            <span className="mobile-nav-heading">
              Services
            </span>

            <a
              href="/library"
              onClick={closeMenu}
              className="mobile-sub-link active"
            >
              Library
            </a>

            <a
              href="/avr"
              onClick={closeMenu}
              className="mobile-sub-link"
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

          <a href="/#facilities" onClick={closeMenu}>
            Facilities
          </a>

          <a href="/#about" onClick={closeMenu}>
            About
          </a>

          <div className="mobile-nav-group">

            <span className="mobile-nav-heading">
              Quick Links
            </span>

            <a
              href="https://hfapgs.aralinks.net:8080/login/index.php?loginredirect=1"
              className="mobile-sub-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              Aralinks
            </a>

            <a
              href="https://hfa-library.follettdestiny.com/portal/portal?app=Library%20Manager&appId=destiny-DFXG-DKVF&siteGuid=6FCE2EC2-064B-4961-BE56-2AF87CAD9632&nav=%252Fcataloging%252Fservlet%252Fpresentadvancedsearchredirectorform.do%253Fl2m%253DLibrary%252520Search%2526tm%253DTopLevelCatalog%2526l2m%253DLibrary%252BSearch"
              className="mobile-sub-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              Follett Destiny
            </a>

            <a
              href="https://www.getepic.com/"
              className="mobile-sub-link"
              target="_blank"
              rel="noopener noreferrer"
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

      <div className="library-page-indicator">

        <div className="container">

          <span>
            Instructional Media Center
          </span>

          <strong>
            / Library
          </strong>

        </div>

      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main>

        <section className="library-hero">

          <video
            className="library-hero-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source
              src={slideshowVideo}
              type="video/mp4"
            />
          </video>

          <div className="library-hero-overlay"></div>

          <div className="container library-hero-container">

            <div className="library-hero-content">

              <span className="library-label">
                INSTRUCTIONAL MEDIA CENTER • LIBRARY
              </span>

              <h1>
                Library
                <span>
                  Resources & Research.
                </span>
              </h1>

              <p>
                Discover library resources, learning spaces,
                research services, news, and activities
                available to the school community.
              </p>

              <div className="library-hero-actions">

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

            <aside
              className="library-hero-hours"
              id="schedule"
            >

              <div className="library-hours-header">

                <span>
                  LIBRARY HOURS
                </span>

                <h2>
                  Operating Hours
                </h2>

              </div>

              {loading ? (

                <div className="library-hours-loading">
                  Loading...
                </div>

              ) : schedules.length > 0 ? (

                <div className="library-hours-list">

                  {schedules.map((schedule) => (

                    <div
                      className="library-hour-row"
                      key={schedule.id}
                    >

                      <strong>
                        {schedule.day}
                      </strong>

                      <span>
                        {formatTime(schedule.opening_time)}
                        {" — "}
                        {formatTime(schedule.closing_time)}
                      </span>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="library-hours-empty">
                  Operating hours have not been posted yet.
                </div>

              )}

            </aside>

          </div>

        </section>

        {/* =====================================================
            MARQUEE
        ===================================================== */}

        <div className="library-marquee">

          <div className="library-marquee-track">

            <span>LIBRARY RESOURCES</span>
            <i>✦</i>

            <span>RESEARCH SUPPORT</span>
            <i>✦</i>

            <span>LEARNING SPACES</span>
            <i>✦</i>

            <span>READING & DISCOVERY</span>
            <i>✦</i>

            <span>LIBRARY COMMUNITY</span>
            <i>✦</i>

            <span>LIBRARY RESOURCES</span>
            <i>✦</i>

            <span>RESEARCH SUPPORT</span>
            <i>✦</i>

            <span>LEARNING SPACES</span>
            <i>✦</i>

          </div>

        </div>

        {/* =====================================================
            LATEST NEWS CAROUSEL
        ===================================================== */}

        <section
          className="library-section library-news-section"
          id="news"
        >

          <div className="container">

            <SectionHeading
              label="LIBRARY UPDATES"
              title="Latest"
              highlight="News."
              description="Stay updated with the latest library announcements and activities."
            />

            {loading ? (

              <LoadingState text="Loading news..." />

            ) : news.length > 0 ? (

              <div className="latest-news-carousel">

                <button
                  type="button"
                  className="latest-news-arrow latest-news-arrow-left"
                  onClick={previousNews}
                  aria-label="Previous news"
                >
                  ←
                </button>

                <div className="latest-news-viewport">

                  <div
                    className="latest-news-track"
                    style={{
                      "--news-index": newsIndex,
                      "--news-visible": newsVisible,
                    }}
                  >

                    {news.map((item) => (

                      <div
                        className="latest-news-slide"
                        key={item.id}
                      >

                        <button
                          type="button"
                          className="latest-news-card"
                          onClick={() => setSelectedNews(item)}
                        >

                          {item.image_url ? (

                            <div className="latest-news-image">

                              <img
                                src={item.image_url}
                                alt={item.title}
                              />

                            </div>

                          ) : (

                            <div className="latest-news-image latest-news-no-image">
                              <span>
                                LIBRARY NEWS
                              </span>
                            </div>

                          )}

                          <div className="latest-news-content">

                            {item.date && (
                              <span className="latest-news-date">
                                {formatDate(item.date)}
                              </span>
                            )}

                            <h3>
                              {item.title}
                            </h3>

                            <p>
                              {item.body}
                            </p>

                            <span className="latest-news-read">
                              View Story
                              <span>→</span>
                            </span>

                          </div>

                        </button>

                      </div>

                    ))}

                  </div>

                </div>

                <button
                  type="button"
                  className="latest-news-arrow latest-news-arrow-right"
                  onClick={nextNews}
                  aria-label="Next news"
                >
                  →
                </button>

                <div className="latest-news-dots">

                  {Array.from({
                    length: newsPageCount,
                  }).map((_, index) => (

                    <button
                      type="button"
                      key={index}
                      className={
                        index === newsIndex
                          ? "active"
                          : ""
                      }
                      onClick={() => setNewsIndex(index)}
                      aria-label={`Go to news slide ${index + 1}`}
                    />

                  ))}

                </div>

              </div>

            ) : (

              <EmptyState text="No library news has been posted yet." />

            )}

          </div>

        </section>

        {/* =====================================================
            WHAT TO KNOW
        ===================================================== */}

        <section
          className="library-section what-to-know-section"
          id="club-news"
        >

          <div className="container">

            <SectionHeading
              label="INFORMATION & UPDATES"
              title="What to"
              highlight="Know."
              description="Important information, reminders, activities, and updates from the library."
            />

            {loading ? (

              <LoadingState text="Loading information..." />

            ) : clubNews.length > 0 ? (

              <div className="what-to-know-grid">

                {clubNews.map((item) => (

                  <button
                    type="button"
                    className="what-to-know-card"
                    key={item.id}
                    onClick={() =>
                      setSelectedWhatToKnow(item)
                    }
                  >

                    {item.image_url ? (

                      <div className="what-to-know-image">

                        <img
                          src={item.image_url}
                          alt={item.title}
                        />

                      </div>

                    ) : (

                      <div className="what-to-know-image what-to-know-no-image">

                        <span>
                          WHAT TO KNOW
                        </span>

                      </div>

                    )}

                    <div className="what-to-know-title">

                      <h3>
                        {item.title}
                      </h3>

                      <span>
                        View information →
                      </span>

                    </div>

                  </button>

                ))}

              </div>

            ) : (

              <EmptyState text="No information has been posted yet." />

            )}

          </div>

        </section>

        {/* =====================================================
            LIBRARY INFORMATION
        ===================================================== */}

        <section
          className="library-section library-clubs-section"
          id="library-information"
        >

          <div className="container">

            <SectionHeading
              label="LIBRARY INFORMATION"
              title="Library"
              highlight="Information."
              description="Explore important information about the library, its resources, programs, and services."
            />

            {loading ? (

              <LoadingState text="Loading library information..." />

            ) : clubs.length > 0 ? (

              <div className="library-club-grid">

                {clubs.map((club) => (

                  <article
                    className="library-club-card"
                    key={club.id}
                  >

                    {club.image_url ? (

                      <div className="library-club-image">

                        <img
                          src={club.image_url}
                          alt={club.name}
                        />

                      </div>

                    ) : (

                      <div className="library-club-image library-no-image">
                        <span>
                          LIBRARY
                        </span>
                      </div>

                    )}

                    <div className="library-club-content">

                      <span className="library-club-label">
                        LIBRARY INFORMATION
                      </span>

                      <h3>
                        {club.name}
                      </h3>

                      <p className="library-card-text">
                        {club.description}
                      </p>

                      <ReadMore />

                    </div>

                  </article>

                ))}

              </div>

            ) : (

              <EmptyState text="No library information has been posted yet." />

            )}

          </div>

        </section>

        {/* =====================================================
            SPACES
        ===================================================== */}

        <section
          className="library-section library-spaces-section"
          id="spaces"
        >

          <div className="container">

            <SectionHeading
              label="LIBRARY SPACES"
              title="Spaces for"
              highlight="Learning."
              description="Explore the different spaces and areas available inside the library."
            />

            {loading ? (

              <LoadingState text="Loading spaces..." />

            ) : spaces.length > 0 ? (

              <div className="library-card-grid">

                {spaces.map((space) => (

                  <article
                    className="library-space-card"
                    key={space.id}
                  >

                    {space.image_url ? (

                      <div className="library-card-image">

                        <img
                          src={space.image_url}
                          alt={space.title}
                        />

                      </div>

                    ) : (

                      <div className="library-card-image library-no-image">
                        <span>
                          LIBRARY SPACE
                        </span>
                      </div>

                    )}

                    <div className="library-card-content">

                      {space.date && (
                        <span className="library-content-date">
                          {formatDate(space.date)}
                        </span>
                      )}

                      <h3>
                        {space.title}
                      </h3>

                      <p className="library-card-text">
                        {space.body}
                      </p>

                      <ReadMore />

                    </div>

                  </article>

                ))}

              </div>

            ) : (

              <EmptyState text="No library spaces have been posted yet." />

            )}

          </div>

        </section>

        {/* =====================================================
            VISION & MISSION
        ===================================================== */}

        <section
          className="library-section library-purpose-section"
          id="about-library"
        >

          <div className="container">

            <SectionHeading
              label="OUR PURPOSE"
              title="Supporting"
              highlight="Learning."
              description="Our library supports learning, research, reading, and collaboration throughout the school community."
            />

            <div className="library-purpose-grid">

              <article className="library-purpose-card">

                <span className="library-purpose-number">
                  01
                </span>

                <div>

                  <span className="library-purpose-label">
                    OUR VISION
                  </span>

                  <h3>
                    Vision
                  </h3>

                  <p>
                    {visionMission.vision ||
                      "Library vision has not been posted yet."}
                  </p>

                </div>

              </article>

              <article className="library-purpose-card">

                <span className="library-purpose-number">
                  02
                </span>

                <div>

                  <span className="library-purpose-label">
                    OUR MISSION
                  </span>

                  <h3>
                    Mission
                  </h3>

                  <p>
                    {visionMission.mission ||
                      "Library mission has not been posted yet."}
                  </p>

                </div>

              </article>

            </div>

          </div>

        </section>

      </main>

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
              Library resources, learning spaces,
              research support, and information services.
            </p>

          </div>

          <div className="footer-links">

            <div>

              <h4>
                Library
              </h4>

              <a href="#schedule">
                Operating Hours
              </a>

              <a href="#news">
                Latest News
              </a>

              <a href="#club-news">
                What to Know
              </a>

              <a href="#library-information">
                Library Information
              </a>

              <a href="#spaces">
                Spaces
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

      {/* =====================================================
          LATEST NEWS MODAL
      ===================================================== */}

      {selectedNews && (

        <ContentModal
          item={selectedNews}
          type="news"
          formatDate={formatDate}
          onClose={() => setSelectedNews(null)}
        />

      )}

      {/* =====================================================
          WHAT TO KNOW MODAL
      ===================================================== */}

      {selectedWhatToKnow && (

        <ContentModal
          item={selectedWhatToKnow}
          type="information"
          formatDate={formatDate}
          onClose={() => setSelectedWhatToKnow(null)}
        />

      )}

    </div>
  );
}

// =====================================================
// SECTION HEADING
// =====================================================

function SectionHeading({
  label,
  title,
  highlight,
  description,
}) {
  return (
    <div className="library-section-heading">

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

// =====================================================
// CONTENT MODAL
// =====================================================

function ContentModal({
  item,
  type,
  formatDate,
  onClose,
}) {
  return (
    <div
      className="library-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="library-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >

        <button
          type="button"
          className="library-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {item.image_url ? (

          <div className="library-modal-image">

            <img
              src={item.image_url}
              alt={item.title}
            />

          </div>

        ) : null}

        <div className="library-modal-content">

          <span className="library-modal-label">
            {type === "news"
              ? "LIBRARY NEWS"
              : "WHAT TO KNOW"}
          </span>

          {item.date && (

            <span className="library-modal-date">
              {formatDate(item.date)}
            </span>

          )}

          <h2>
            {item.title}
          </h2>

          <div className="library-modal-divider"></div>

          <p>
            {item.body ||
              item.description ||
              "No additional information is available."}
          </p>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// READ MORE
// =====================================================

function ReadMore() {
  const handleReadMore = (event) => {
    const button = event.currentTarget;

    const cardContent = button.closest(
      ".library-card-content, .library-club-content"
    );

    const text = cardContent?.querySelector(
      ".library-card-text"
    );

    if (!text) return;

    const expanded =
      text.classList.toggle("expanded");

    button.textContent = expanded
      ? "Read Less"
      : "Read More";
  };

  return (
    <button
      type="button"
      className="library-read-more"
      onClick={handleReadMore}
    >
      Read More
    </button>
  );
}

// =====================================================
// LOADING
// =====================================================

function LoadingState({ text }) {
  return (
    <div className="library-loading">
      {text}
    </div>
  );
}

// =====================================================
// EMPTY
// =====================================================

function EmptyState({ text }) {
  return (
    <div className="library-empty">
      {text}
    </div>
  );
}

export default Library;