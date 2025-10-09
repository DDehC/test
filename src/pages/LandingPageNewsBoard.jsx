import React from "react";
import { Newspaper, ArrowRight } from "lucide-react";
import DepartmentsCard from "../components/DepartmentsCard.jsx";
import "../styles/LandingPageNewsBoard.css";

const NewsBoard = () => {
  const sidebarNews = [
    { date: "2025-09-26", title: "CURRENT SITUATION ANALYSIS: BROADENING THE MEASUREMENT OF THE ENERGY TRANSITION IN VÄRMLAND" },
    { date: "2025-09-26", title: "RESEARCH GROUPS: WHAT WORKS AND WHY?" },
    { date: "2025-09-25", title: "BETWEEN IDEAL AND REALITY – WHY SUSTAINABLE CONSUMPTION IS HARDER THAN WE THINK" },
    { date: "2025-09-25", title: "15-YEAR ANNIVERSARY FOR THE COURSE THAT HELPS RESEARCHERS REACH BEYOND ACADEMIA" },
    { date: "2025-09-25", title: "THE HEDGEHOG IS THE GARDEN’S FRIEND THAT NEEDS OUR HELP" },
    { date: "2025-09-24", title: "BECOME A DOCTORAL STUDENT WITH A FOCUS ON MUSIC EDUCATION" },
  ];

  return (
    <div className="newsboard">
      {/* Left: news sidebar */}
      <aside className="newsboard-sidebar">
        <div className="newsboard-header">
          <Newspaper className="newsboard-icon" />
          <h2 className="newsboard-title">News</h2>
        </div>
        <ul className="newsboard-sidebar-list">
          {sidebarNews.map((n, i) => (
            <li key={i} className="newsboard-sidebar-item">
              <div className="newsboard-date">{n.date}</div>
              <div className="newsboard-item-title">{n.title}</div>
              <ArrowRight className="newsboard-arrow" />
            </li>
          ))}
        </ul>
      </aside>

      {/* Center: main feature/news */}
      <section className="newsboard-main">
        <div className="newsboard-cards">
          {sidebarNews.slice(0, 3).map((n, i) => (
            <article key={i} className="newsboard-card">
              <div className="newsboard-card-date">{n.date}</div>
              <h3 className="newsboard-card-title">{n.title}</h3>
              <button className="newsboard-card-button">
                Read more <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Right: departments list (sticky) */}
      <aside className="newsboard-right">
        <div className="newsboard-right-inner">
          <DepartmentsCard />
        </div>
      </aside>
    </div>
  );
};

export default NewsBoard;
