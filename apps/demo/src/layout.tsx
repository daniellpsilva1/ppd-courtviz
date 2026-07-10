import { NavLink, Outlet } from "react-router-dom";
import { guestName, hostName, matchDate, surface } from "@courtviz/data";

const navItems = [
  { label: "Overview", path: "/" },
  { label: "Brand", path: "/brand" },
  { label: "Benchmark Story", path: "/benchmark/story" },
  { label: "App Preview", path: "/benchmark/app" },
  { label: "Hexmap", path: "/hexmap" },
  { label: "Dot Density", path: "/dotdensity" },
  { label: "Serve", path: "/serve" },
  { label: "Rays", path: "/rays" },
  { label: "Momentum", path: "/momentum" },
];

export function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Courtviz</h1>
          <p>
            {hostName} vs {guestName}
            <br />
            {matchDate} · {surface}
          </p>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              end={item.path === "/"}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
