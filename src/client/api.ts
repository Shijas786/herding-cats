import type { ApiError } from '../shared/api';

export class ApiFailure extends Error {}

const isError = (v: unknown): v is ApiError =>
  typeof v === 'object' &&
  v !== null &&
  'status' in v &&
  v.status === 'error' &&
  'message' in v;

export const call = async <T>(path: string, body?: unknown): Promise<T> => {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data: T | ApiError = await res.json();
  if (isError(data)) throw new ApiFailure(data.message);
  if (!res.ok) throw new ApiFailure('Something went wrong');
  return data;
};
