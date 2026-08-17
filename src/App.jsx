import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";

import AdminControl from "./pages/AdminControl";

import Library from "./pages/Library";
import LibraryDashboard from "./pages/LibraryDashboard";

import Avr from "./pages/Avr";
import AvrDashboard from "./pages/AvrDashboard";

import Services from "./pages/Services";

import FacultyDashboard from "./pages/FacultyDashboard";

import Staff from "./pages/Staff";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================================
            PUBLIC PAGES
        ========================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/library"
          element={<Library />}
        />

        <Route
          path="/avr"
          element={<Avr />}
        />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/staff"
          element={<Staff />}
        />

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =========================================
            ADMIN
        ========================================= */}

        <Route
          path="/admin"
          element={<AdminControl />}
        />


        {/* =========================================
            LIBRARY STAFF
        ========================================= */}

        <Route
          path="/library-dashboard"
          element={<LibraryDashboard />}
        />


        {/* =========================================
            AVR STAFF
        ========================================= */}

        <Route
          path="/avr-dashboard"
          element={<AvrDashboard />}
        />


        {/* =========================================
            FACULTY
        ========================================= */}

        <Route
          path="/faculty-dashboard"
          element={<FacultyDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;