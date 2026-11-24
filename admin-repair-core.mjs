/**
 * BASAIR Admin: pure, testable policy helpers. No Firebase SDK or production data.
 */
export function isCurrentAdminSession(issuedRevision, liveRevision, issuedUid, authUid, authorized) {
  return issuedRevision === liveRevision && Boolean(authorized) &&
    typeof issuedUid === 'string' && issuedUid.length > 0 && issuedUid === authUid;
}

export function assertUnchanged(expected, current, message) {
  if (JSON.stringify(expected) !== JSON.stringify(current)) {
    throw new Error(message || 'Concurrent modification detected; reload before saving.');
  }
}

export function assertRequestTransition(actual, expected) {
  if (actual !== expected) throw new Error('تغيّرت حالة الطلب بواسطة مدير آخر؛ حدّث القائمة أولًا.');
}

export function sortRequests(rows) {
  const timestamp = value => {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  };
  return [...rows].sort((a,b) =>
    timestamp(b.submissionDate) - timestamp(a.submissionDate) ||
    String(a.sourceCollection).localeCompare(String(b.sourceCollection)) ||
    String(a.id).localeCompare(String(b.id))
  );
}
