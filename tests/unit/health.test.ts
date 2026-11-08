import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('Health Route Handler (/api/health)', () => {
  it('should return 200 OK with status and service name', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('echoes-api');
    expect(data.timestamp).toBeDefined();
  });
});
