import { useState } from "react";
import hfaLogo from "../assets/hfalogo.png";
import "./Services.css";

function Services() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="services-page">

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
                  className="nav-dropdown-item active"
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
              className="mobile-sub-link"
            >
              AVR
            </a>

            <a
              href="/services"
              onClick={closeMenu}
              className="mobile-sub-link active"
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

      <div className="services-page-indicator">

        <div className="container">

          <span>
            Instructional Media Center
          </span>

          <strong>
            / Technical Assistance
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

        <section className="services-hero">

          <div className="container services-hero-container">

            <div className="services-hero-content">

              <span className="services-label">
                INSTRUCTIONAL MEDIA CENTER • TECHNICAL ASSISTANCE
              </span>

              <h1>
                Technical
                <span>
                  Assistance & Support.
                </span>
              </h1>

              <p>
                Get assistance with audio-visual equipment,
                computers, software, presentations, and other
                technology needs that support teaching,
                learning, and school activities.
              </p>

              <div className="services-hero-actions">

                <a
                  href="#services"
                  className="primary-button"
                >
                  View Services
                </a>

                <a
                  href="#support"
                  className="secondary-button"
                >
                  How We Can Help
                </a>

              </div>

            </div>


            {/* HERO SIDE CARD */}

            <aside className="services-hero-card">

              <span className="services-hero-card-label">
                TECHNICAL SUPPORT
              </span>

              <h2>
                Helping Technology
                <span>
                  Work for You.
                </span>
              </h2>

              <p>
                Our technical assistance services help
                the school community resolve common
                technology and equipment concerns.
              </p>

              <div className="hero-card-line"></div>

              <div className="hero-card-info">

                <strong>
                  01
                </strong>

                <span>
                  Equipment & Technology Support
                </span>

              </div>

            </aside>

          </div>

        </section>


        {/* =================================================
            MARQUEE
        ================================================= */}

        <div className="services-marquee">

          <div className="services-marquee-track">

            <span>
              TECHNICAL ASSISTANCE
            </span>

            <i>✦</i>

            <span>
              PROJECTOR SUPPORT
            </span>

            <i>✦</i>

            <span>
              SOUND SYSTEM
            </span>

            <i>✦</i>

            <span>
              LAPTOP SET-UP
            </span>

            <i>✦</i>

            <span>
              SOFTWARE ASSISTANCE
            </span>

            <i>✦</i>

            <span>
              PRESENTATION SUPPORT
            </span>

            <i>✦</i>

            <span>
              TECHNICAL SUPPORT
            </span>

            <i>✦</i>

            <span>
              TECHNICAL ASSISTANCE
            </span>

            <i>✦</i>

            <span>
              PROJECTOR SUPPORT
            </span>

            <i>✦</i>

            <span>
              SOUND SYSTEM
            </span>

            <i>✦</i>

          </div>

        </div>


        {/* =================================================
            SERVICES
        ================================================= */}

        <section
          className="services-section"
          id="services"
        >

          <div className="container">

            <SectionHeading
              label="TECHNICAL SERVICES"
              title="Technology"
              highlight="Support."
              description="Explore the technical assistance services available to help keep classroom technology, presentations, and school activities running smoothly."
            />


            <div className="services-grid">

              <ServiceCard
                number="01"
                title="Projector Assistance"
                label="DISPLAY"
                description="Assistance with projector setup, connection, display configuration, and basic operation for classroom presentations and school activities."
              />

              <ServiceCard
                number="02"
                title="Projector Technical Issue"
                label="TROUBLESHOOTING"
                description="Support for common projector problems such as no display, connection issues, incorrect input sources, image problems, and basic troubleshooting."
              />

              <ServiceCard
                number="03"
                title="Sound System Assistance"
                label="AUDIO"
                description="Assistance with microphones, speakers, audio connections, volume settings, and basic sound system setup for events and presentations."
              />

              <ServiceCard
                number="04"
                title="Laptop Set-up Assistance"
                label="COMPUTER"
                description="Help with connecting laptops to projectors, displays, speakers, and other equipment needed for classroom activities and presentations."
              />

              <ServiceCard
                number="05"
                title="Software Assistance"
                label="SOFTWARE"
                description="Basic assistance with software installation, application setup, updates, configuration, and resolving common software-related issues."
              />

              <ServiceCard
                number="06"
                title="Presentation Assistance"
                label="PRESENTATION"
                description="Technical support for PowerPoint presentations, media playback, screen sharing, display setup, and other presentation requirements."
              />

              <ServiceCard
                number="07"
                title="Network & Connectivity"
                label="CONNECTIVITY"
                description="Basic assistance with connectivity concerns involving network access, device connections, and technology used for instructional activities."
              />

              <ServiceCard
                number="08"
                title="General Technical Support"
                label="SUPPORT"
                description="Assistance with other common technology concerns involving computers, peripherals, classroom equipment, and instructional technology."
              />

              <ServiceCard
                number="09"
                title="Event Technical Assistance"
                label="EVENTS"
                description="Technical support for school programs, meetings, seminars, presentations, and other activities that require audio-visual equipment."
              />

            </div>

          </div>

        </section>


        {/* =================================================
            SUPPORT PROCESS
        ================================================= */}

        <section
          className="services-section services-support-section"
          id="support"
        >

          <div className="container">

            <SectionHeading
              label="HOW WE CAN HELP"
              title="Simple"
              highlight="Technical Support."
              description="When you encounter a technology or equipment concern, our assistance is focused on helping you get back to your activity as quickly as possible."
            />


            <div className="support-grid">

              <article className="support-card">

                <span className="support-number">
                  01
                </span>

                <div>

                  <span className="support-label">
                    IDENTIFY
                  </span>

                  <h3>
                    Tell Us the Problem
                  </h3>

                  <p>
                    Describe the equipment, computer,
                    software, or technical issue you are
                    experiencing.
                  </p>

                </div>

              </article>


              <article className="support-card">

                <span className="support-number">
                  02
                </span>

                <div>

                  <span className="support-label">
                    CHECK
                  </span>

                  <h3>
                    We Assess the Issue
                  </h3>

                  <p>
                    We check the equipment or setup and
                    identify possible causes of the
                    technical problem.
                  </p>

                </div>

              </article>


              <article className="support-card">

                <span className="support-number">
                  03
                </span>

                <div>

                  <span className="support-label">
                    ASSIST
                  </span>

                  <h3>
                    Receive Technical Help
                  </h3>

                  <p>
                    We provide basic troubleshooting,
                    configuration, setup, or technical
                    assistance appropriate to the issue.
                  </p>

                </div>

              </article>

            </div>

          </div>

        </section>


        {/* =================================================
            ABOUT
        ================================================= */}

        <section
          className="services-about-section"
          id="about-services"
        >

          <div className="container">

            <div className="services-about-grid">

              <div className="services-about-content">

                <span className="services-about-label">
                  ABOUT TECHNICAL ASSISTANCE
                </span>

                <h2>
                  Supporting
                  <span>
                    Learning Through Technology.
                  </span>
                </h2>

                <p>
                  The Instructional Media Center provides
                  technical assistance to help teachers,
                  students, staff, and school activities
                  make effective use of available
                  technology and audio-visual resources.
                </p>

                <p>
                  From setting up a projector to preparing
                  a sound system or resolving a basic
                  software concern, technical assistance
                  helps ensure that technology supports
                  rather than interrupts the learning
                  experience.
                </p>

              </div>


              <div className="services-about-panel">

                <div className="about-panel-item">

                  <strong>
                    AV
                  </strong>

                  <span>
                    Audio-Visual Equipment
                  </span>

                </div>


                <div className="about-panel-item">

                  <strong>
                    IT
                  </strong>

                  <span>
                    Computer & Software Support
                  </span>

                </div>


                <div className="about-panel-item">

                  <strong>
                    EDU
                  </strong>

                  <span>
                    Learning Technology
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            CTA
        ================================================= */}

        <section className="services-cta">

          <div className="container">

            <div className="services-cta-inner">

              <div>

                <span>
                  NEED TECHNICAL ASSISTANCE?
                </span>

                <h2>
                  Let us help you
                  <strong>
                    get things working.
                  </strong>
                </h2>

                <p>
                  For technical concerns involving
                  equipment, presentations, computers,
                  software, or other technology needs,
                  contact the Instructional Media Center.
                </p>

              </div>

              <a
                href="/login"
                className="cta-button"
              >
                Request Assistance
              </a>

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
                Technical Assistance
              </h4>

              <a href="#services">
                Technical Services
              </a>

              <a href="#support">
                How We Can Help
              </a>

              <a href="#about-services">
                About Assistance
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
    <div className="services-section-heading">

      <span>
        {label}
      </span>

      <h2>
        {title}{" "}
        <strong>
          {highlight}
        </strong>
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
   SERVICE CARD
========================================================= */

function ServiceCard({
  number,
  label,
  title,
  description,
}) {
  return (
    <article className="service-card">

      <div className="service-card-top">

        <span className="service-number">
          {number}
        </span>

        <span className="service-label">
          {label}
        </span>

      </div>

      <div className="service-card-content">

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

      <div className="service-card-line"></div>

    </article>
  );
}


export default Services;