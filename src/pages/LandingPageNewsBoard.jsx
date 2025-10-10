import React from "react";
import { useNavigate } from "react-router-dom";
import { getRole, ROLE_LANDING } from "../utils/landing";
import { Newspaper, ArrowRight, ChevronDown } from "lucide-react";
import DepartmentsCard from "../components/DepartmentsCard.jsx";
import "../styles/LandingPageNewsBoard.css";

const EVENTS = [
  {
    date: "2025-09-26",
    title:
      "CURRENT SITUATION ANALYSIS: BROADENING THE MEASUREMENT OF THE ENERGY TRANSITION IN VÄRMLAND",
    time: "2:00 PM – 4:00 PM",
    location: "Innovation Hub, Main Campus",
    description:
      "Energy researchers share new methodologies for mapping the transition from local industry partners to regional policymakers.",
  },
  {
    date: "2025-09-26",
    title: "RESEARCH GROUPS: WHAT WORKS AND WHY?",
    time: "12:30 PM – 1:30 PM",
    location: "Room 3B, Research Pavilion",
    description:
      "Lunch-and-learn on cultivating collaborative research groups, hosted by the Office for Research Excellence.",
  },
  {
    date: "2025-09-25",
    title:
      "BETWEEN IDEAL AND REALITY – WHY SUSTAINABLE CONSUMPTION IS HARDER THAN WE THINK",
    time: "9:30 AM – 11:00 AM",
    location: "Auditorium C",
    description:
      "Panel discussion unpacking the behavioral science behind sustainable consumption with guest speakers from industry.",
  },
  {
    date: "2025-09-25",
    title:
      "15-YEAR ANNIVERSARY FOR THE COURSE THAT HELPS RESEARCHERS REACH BEYOND ACADEMIA",
    time: "5:30 PM – 7:30 PM",
    location: "University Atrium",
    description:
      "Celebrate the milestone program empowering researchers to communicate their work to the public with alumni stories and networking.",
  },
  {
    date: "2025-09-25",
    title: "THE HEDGEHOG IS THE GARDEN’S FRIEND THAT NEEDS OUR HELP",
    time: "10:00 AM – 12:00 PM",
    location: "Botanical Garden Lawn",
    description:
      "Hands-on conservation event focusing on local hedgehog habitats with the biology department and student volunteers.",
  },
  {
    date: "2025-09-24",
    title: "BECOME A DOCTORAL STUDENT WITH A FOCUS ON MUSIC EDUCATION",
    time: "3:00 PM – 4:30 PM",
    location: "Music Hall Studio 1",
    description:
      "Information session for prospective doctoral students exploring funded research opportunities in music education.",
  },
];

const NewsBoard = () => {
  const [openIndex, setOpenIndex] = React.useState(0);
  const navigate = useNavigate();
  const role = getRole() || "guest";

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  function handleAttendClick() {
    if (role === "guest") {
      navigate("/login");
      return;
    }
    const target = ROLE_LANDING?.[role] || "/";
    navigate(target);
  }

  function handleAttendanceListClick() {
    navigate("/attendance-list");
  }

  return (
    <div className="newsboard">
      <aside className="newsboard-sidebar">
        <div className="newsboard-header">
          <Newspaper className="newsboard-icon" />
          <h2 className="newsboard-title">News</h2>
        </div>
        <ul className="newsboard-sidebar-list">
          {EVENTS.map(({ date, title }, index) => (
            <li key={index} className="newsboard-sidebar-item">
              <div className="newsboard-date">{date}</div>
              <div className="newsboard-item-title">{title}</div>
              <ArrowRight className="newsboard-arrow" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </aside>

      <section className="newsboard-main">
        <div className="newsboard-accordion" role="list">
          {EVENTS.map(
            ({ date, title, time, location, description }, index) => {
              const isOpen = openIndex === index;

              return (
                <article
                  key={title}
                  className={`newsboard-accordion-item ${isOpen ? "is-open" : ""}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="newsboard-accordion-trigger"
                    onClick={() => handleToggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`event-panel-${index}`}
                  >
                    <div className="newsboard-accordion-meta">
                      <span className="newsboard-card-date">{date}</span>
                      <ChevronDown
                        className={`newsboard-accordion-icon ${isOpen ? "rotated" : ""}`}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="newsboard-card-title">{title}</h3>
                  </button>
                  <div
                    id={`event-panel-${index}`}
                    className={`newsboard-accordion-panel ${isOpen ? "is-open" : ""}`}
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <dl className="newsboard-accordion-details">
                      <div className="newsboard-accordion-row">
                        <dt>Time</dt>
                        <dd>{time}</dd>
                      </div>
                      <div className="newsboard-accordion-row">
                        <dt>Location</dt>
                        <dd>{location}</dd>
                      </div>
                    </dl>
                    <p className="newsboard-accordion-description">{description}</p>

                    <button
                      className="newsboard-card-button"
                      type="button"
                      onClick={handleAttendClick}
                    >
                      Attend Event
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>

                    {(role === "staff" || role === "admin") && (
                      <button
                        className="newsboard-card-list-button"
                        type="button"
                        onClick={handleAttendanceListClick}
                      >
                        Attendance List
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      <aside className="newsboard-right">
        <div className="newsboard-right-inner">
          <DepartmentsCard />
        </div>
      </aside>
    </div>
  );
};

export default NewsBoard;
