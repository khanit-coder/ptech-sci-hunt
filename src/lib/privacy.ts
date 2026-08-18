import { StudentNameDisplayMode } from '@/types';

export function maskStudentName(
  fullName?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  mode: StudentNameDisplayMode = 'full'
): string {
  if (!fullName && !firstName && !lastName) {
    return 'นักเรียนผู้ค้นพบ';
  }

  const nameToUse = fullName || `${firstName || ''} ${lastName || ''}`.trim();

  switch (mode) {
    case 'full':
      return nameToUse;

    case 'masked': {
      const parts = nameToUse.split(' ');
      if (parts.length >= 2) {
        const first = parts[0];
        const last = parts.slice(1).join(' ');
        const maskedFirst = first.length > 2 ? first.substring(0, 2) + '***' : first + '***';
        const maskedLast = last.length > 1 ? last.substring(0, 1) + '***' : '***';
        return `${maskedFirst} ${maskedLast}`;
      } else {
        return nameToUse.length > 3 ? nameToUse.substring(0, 3) + '***' : nameToUse + '***';
      }
    }

    case 'nickname':
      return firstName ? `Agent ${firstName}` : 'Agent Hunter';

    case 'hidden':
      return 'Secret Hunter';

    default:
      return nameToUse;
  }
}
