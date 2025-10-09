import React, { useState } from "react";
import PublicationForm from "../components/PublicationForm.jsx";
import { publicationRequest } from "../api/requests";

export default function PublicationRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [location, setLocation] = useState("");
  const [onCampus, setOnCampus] = useState(false);

  const [maxAttendees, setMaxAttendees] = useState("");
  const [date, setDate] = useState("");           // "YYYY-MM-DD"
  const [startTime, setStartTime] = useState(""); // "HH:MM"
  const [endTime, setEndTime] = useState("");     // "HH:MM"

  const [publishAll, setPublishAll] = useState(false);
  const [depts, setDepts] = useState([]);
  const [files, setFiles] = useState([]);

  const toISO = (dStr, tStr) => {
    if (!dStr || !tStr) return "";
    const [y, m, d] = dStr.split("-").map(Number);
    const [hh, mm] = tStr.split(":").map(Number);
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    return dt.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title,
      description,
      author,
      email,
      organization: org,
      location,
      on_campus: !!onCampus,
      max_attendees: maxAttendees === "" ? null : Number(maxAttendees),
      date,
      start_time: startTime,
      end_time: endTime,
      start_iso: toISO(date, startTime),
      end_iso: toISO(date, endTime),
      publish_all: !!publishAll,
      departments: depts,
    };

    await publicationRequest(payload, files);
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setAuthor("");
    setEmail("");
    setOrg("");
    setLocation("");
    setOnCampus(false);
    setMaxAttendees("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setPublishAll(false);
    setDepts([]);
    setFiles([]);
  };

  return (
    <PublicationForm
      title={title} setTitle={setTitle}
      description={description} setDescription={setDescription}
      author={author} setAuthor={setAuthor}
      email={email} setEmail={setEmail}
      org={org} setOrg={setOrg}
      location={location} setLocation={setLocation}
      onCampus={onCampus} setOnCampus={setOnCampus}
      maxAttendees={maxAttendees} setMaxAttendees={setMaxAttendees}
      date={date} setDate={setDate}
      startTime={startTime} setStartTime={setStartTime}
      endTime={endTime} setEndTime={setEndTime}
      publishAll={publishAll} setPublishAll={setPublishAll}
      depts={depts} setDepts={setDepts}
      files={files} setFiles={setFiles}
      onSubmit={handleSubmit}
      onReset={handleReset}
    />
  );
}
