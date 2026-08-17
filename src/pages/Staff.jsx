import { useEffect, useState } from "react";
import "./Staff.css";
import { supabase } from "../services/supabase";

function Staff() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const closeMenu = () => {
    setMenuOpen(false);
  };

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

  /* =========================================================
     FETCH STAFF FROM SUPABASE
  ========================================================= */

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-page">

      {/* =====================================================
          BACKGROUND LOGO
      ===================================================== */}

      <div className="staff-background-logo">
        <img
          src="/src/assets/hfalogo.png"
          alt=""
          aria-hidden="true"
        />
      </div>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="main-header">

        <div className="container header-container">

          {/* BRAND */}

          <a
            href="/"
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

                {services.map((service) => (

                  <a
                    href={service.url}
                    key={service.name}
                    className="nav-dropdown-item"
                    onClick={closeMenu}
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

                {quickLinks.map((link) => (

                  <a
                    href={link.url}
                    key={link.name}
                    className="nav-dropdown-item"
                    target="_blank"
                    rel="noopener noreferrer"
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


            {/* STAFF */}

            <a
              href="/staff"
              onClick={closeMenu}
              className="active-nav-link"
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


        {/* =====================================================
            MOBILE NAVIGATION
        ===================================================== */}

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

            {quickLinks.map((link) => (

              <a
                href={link.url}
                key={link.name}
                onClick={closeMenu}
                className="mobile-sub-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.name}
              </a>

            ))}

          </div>


          <a
            href="/staff"
            onClick={closeMenu}
            className="active-mobile-link"
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
          STAFF CONTENT
      ===================================================== */}

      <main className="staff-main">

        <section className="staff-section">

          <div className="staff-container">

            <span className="staff-label">
              INSTRUCTIONAL MEDIA CENTER
            </span>

            <h1 className="staff-title">
              Instructional Media Center{" "}
              <span>Staff</span>
            </h1>

            <p className="staff-intro">
              Meet the dedicated staff of the Instructional
              Media Center who support learning, research,
              technology, and media services.
            </p>


            {/* =================================================
                STAFF GRID
            ================================================= */}

            {loading ? (

              <div className="staff-loading">
                Loading staff...
              </div>

            ) : staff.length === 0 ? (

              <div className="staff-empty">
                No staff members available.
              </div>

            ) : (

              <div className="staff-grid">

                {staff.map((item) => (

                  <article
                    key={item.id}
                    className="staff-card"
                  >

                    {/* STAFF IMAGE */}

                    <div className="staff-image-wrapper">

                      <div className="staff-image-ring">

                        {item.image ? (

                          <img
                            src={item.image}
                            alt={item.name}
                            className="staff-image"
                          />

                        ) : (

                          <div className="staff-image-placeholder">
                            👤
                          </div>

                        )}

                      </div>

                    </div>


                    {/* STAFF NAME */}

                    <h2 className="staff-name">
                      {item.name}
                    </h2>


                    {/* GOLD DIVIDER */}

                    <div className="staff-divider"></div>


                    {/* POSITION */}

                    <p className="staff-position">
                      {item.position}
                    </p>

                  </article>

                ))}

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Staff;