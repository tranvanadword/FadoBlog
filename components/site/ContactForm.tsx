"use client";

import { Send } from "lucide-react";
import { useState } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitContact(formData: FormData) {
    setState("sending");
    setMessage("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message"),
        website: formData.get("website"),
      }),
    });

    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setState("error");
      setMessage(result.error ?? "Chưa gửi được liên hệ. Vui lòng thử lại.");
      return;
    }

    setState("sent");
    setMessage("Đã gửi liên hệ. Đội ngũ FadoBlog sẽ phản hồi sớm.");
  }

  return (
    <form className="contact-form" action={submitContact}>
      <div className="editor-grid">
        <label>
          Họ tên
          <input name="name" placeholder="Tên của bạn" required />
        </label>
        <label>
          Email
          <input name="email" type="email" placeholder="ban@example.com" required />
        </label>
      </div>
      <label>
        Chủ đề
        <input name="subject" placeholder="Bạn muốn trao đổi về..." required />
      </label>
      <label>
        Nội dung
        <textarea name="message" rows={6} placeholder="Nhập nội dung liên hệ" required />
      </label>
      <input className="honeypot-field" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {message ? <p className={state === "sent" ? "success-message" : "login-error"}>{message}</p> : null}
      <button className="primary-action" type="submit" disabled={state === "sending"}>
        <Send size={17} strokeWidth={1.9} />
        {state === "sending" ? "Đang gửi..." : "Gửi liên hệ"}
      </button>
    </form>
  );
}
