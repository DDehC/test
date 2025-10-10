export async function sendEmail({ to, subject, body }) {
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, body }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send email");
    return data.message;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

