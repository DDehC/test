import React from "react";
import { humanSize } from "../utils/formatters.js";
import "../styles/FileList.css";

export default function FileList({ files, onRemove }) {
  if (!files.length) return null;
  return (
    <div className="pr-files">
      {files.map((f, i) => (
        <div key={i} className="pr-file">
          <div>
            {f.name}{" "}
            <span className="pr-file-size">({humanSize(f.size)})</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="pr-btn pr-btn--link"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
