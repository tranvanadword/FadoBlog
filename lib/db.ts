export function getDatabaseStatus() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const usesD1 = process.env.FADOBLOG_DATA_BACKEND === "d1";

  return {
    connected: hasDatabaseUrl || usesD1,
    provider: usesD1 ? "cloudflare-d1" : hasDatabaseUrl ? "postgresql" : "local-json",
    message: usesD1
      ? "Cloudflare D1 da duoc bat. Website se doc ghi du lieu qua D1 binding DB."
      : hasDatabaseUrl
        ? "DATABASE_URL da duoc cau hinh. Website se doc du lieu qua Prisma."
        : "Database chua duoc ket noi. Website dang chay bang du lieu local trong data/content.json.",
  };
}
