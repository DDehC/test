const API = "/api";

async function parseJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { error: { code: "NON_JSON", message: text } };
}

// Publication request (updated to send JSON when no files, multipart when files exist)
export async function publicationRequest(payload, files = []) {
  const hasFiles = Array.isArray(files) && files.length > 0;
  const url = `${API}/req/pubreqtest`;

  if (!hasFiles) {
    // No files → send JSON body matching backend schema
    const body = {
      ...payload,
      // Ensure times are empty strings if absent
      start_time: payload.start_time ?? "",
      end_time: payload.end_time ?? "",
      // Departments as array when possible; backend also accepts wrapped object
      departments: Array.isArray(payload.departments)
        ? payload.departments
        : (payload.departments ?? []),
    };

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseJson(res);
  }

  // Files present → multipart/form-data
  const formData = new FormData();

  // 1) Files
  for (const file of files) formData.append("attachments", file);

  // 2) Fields
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;

    // Default empty strings for times
    if (key === "start_time" && (value === null || value === undefined)) value = "";
    if (key === "end_time" && (value === null || value === undefined)) value = "";

    // Departments: prefer array → JSON; accept object as-is
    if (key === "departments") {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
      return;
    }

    if (typeof value === "object" && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData, // browser sets boundary
  });
  return parseJson(res);
}

// Publication request
export async function publicationRequestFetch() {
  const res = await fetch(`${API}/req/pubreqfetch`, {
    method: "GET",
    credentials: "include", // keep cookies/session
  });

  const body = await parseJson(res);
  return body;
}
