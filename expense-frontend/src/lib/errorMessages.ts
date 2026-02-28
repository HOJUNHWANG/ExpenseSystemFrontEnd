// ─── HTTP Status → User-friendly message map ──────────────────────────────────
const HTTP_ERROR_MAP: Record<number, string> = {
  400: '요청이 올바르지 않습니다. 입력 내용을 확인해 주세요.',
  401: '로그인이 필요합니다.',
  403: '이 작업을 수행할 권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  409: '이미 존재하는 데이터입니다.',
  422: '유효하지 않은 데이터입니다.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  502: '서버를 일시적으로 사용할 수 없습니다.',
  503: '서비스가 일시적으로 중단되었습니다.',
};

/**
 * Parse a raw error (from apiFetch throws) into a user-friendly message.
 * apiFetch throws Error with the raw response text as message.
 */
export function toUserMessage(error: unknown): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';

  const raw = error instanceof Error ? error.message : String(error);

  // Try to parse HTTP status from "Request failed: NNN" pattern
  const statusMatch = raw.match(/Request failed:\s*(\d{3})/);
  if (statusMatch) {
    const status = Number(statusMatch[1]);
    return HTTP_ERROR_MAP[status] ?? `요청 실패 (HTTP ${status})`;
  }

  // Try to extract status from numeric patterns in the message
  for (const [statusStr, msg] of Object.entries(HTTP_ERROR_MAP)) {
    if (raw.includes(statusStr)) return msg;
  }

  // Return the raw message (backend may return descriptive errors)
  if (raw.length > 0 && raw.length < 200) return raw;

  return '오류가 발생했습니다. 다시 시도해 주세요.';
}
