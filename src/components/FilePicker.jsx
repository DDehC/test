import React from "react";
import "../styles/FilePicker.css";

export default function FilePicker({ files, onPickFiles }) {
  return (
    <div className="pr-filepicker-row">
      <input
        id="pub-files"
        className="pr-filepicker"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
        onChange={onPickFiles}
      />
      <label htmlFor="pub-files" className="pr-fileadd">
        + Add attachments
      </label>
      <span className="pr-files-summary">
        {files.length
          ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
          : "No files selected"}
      </span>
    </div>
  );
}
