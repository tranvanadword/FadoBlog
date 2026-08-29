import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/content";
import { getClientIp, hasSuspiciousText, isJsonRequest, rateLimit, rateLimitHeaders } from "@/lib/security";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 415 });
  }

  const ip = getClientIp(request);
  const ipLimit = rateLimit(`contact:ip:${ip}`, 5, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút." },
      { status: 429, headers: rateLimitHeaders(ipLimit) },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = clean(body?.name);
  const email = clean(body?.email);
  const subject = clean(body?.subject);
  const message = clean(body?.message);
  const website = clean(body?.website);

  if (website) {
    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(ipLimit) });
  }

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Vui lòng nhập đủ thông tin liên hệ." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email chưa đúng định dạng." }, { status: 400 });
  }

  if (message.length < 10) {
    return NextResponse.json({ error: "Nội dung liên hệ cần chi tiết hơn một chút." }, { status: 400 });
  }

  const emailLimit = rateLimit(`contact:email:${email.toLowerCase()}`, 3, 30 * 60 * 1000);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: "Email này vừa gửi nhiều liên hệ. Vui lòng thử lại sau." },
      { status: 429, headers: rateLimitHeaders(emailLimit) },
    );
  }

  if ([name, subject, message].some(hasSuspiciousText)) {
    return NextResponse.json({ error: "Nội dung liên hệ chứa ký tự không hợp lệ." }, { status: 400 });
  }

  await createContactMessage({
    name: name.slice(0, 120),
    email: email.slice(0, 180),
    subject: subject.slice(0, 160),
    message: message.slice(0, 4000),
  });

  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(ipLimit) });
}
