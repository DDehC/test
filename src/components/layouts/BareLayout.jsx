import React from "react";
import { Outlet } from "react-router-dom";
//import "../../App.css"; 

export default function BareLayout() {
  return (
    <div className="bare">
      <Outlet />
    </div>
  );
}
