export function isAuthorizedUser(senderId: number): boolean {
  const allowed = process.env.TELEGRAM_ALLOWED_USERS;
  if (!allowed) return false;
  const allowedIds = allowed.split(",").map((id) => parseInt(id.trim(), 10));
  return allowedIds.includes(senderId);
}
