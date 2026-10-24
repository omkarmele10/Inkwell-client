import axios from 'axios';

export const backendUrl = import.meta.env.BACKEND_URL?.replace(/\/+$/, '');

if (!backendUrl) {
  throw new Error('BACKEND_URL must be set when building the frontend.');
}

export const api = axios.create({
  baseURL: `${backendUrl}/api`,
});

api.interceptors.request.use(async (config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

/** Human-readable message from a Spring ProblemDetail response. */
export function errorMessage(error) {
  const responseData = error?.response?.data;
  if (responseData?.errors) return Object.values(responseData.errors).join(', ');
  return responseData?.detail || error?.message || 'Something went wrong';
}

export const imageUrl = (url) => url || null;

export function timeAgo(isoDate) {
  const secondsAgo = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  const units = [['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60]];
  for (const [label, unitSeconds] of units) {
    if (secondsAgo >= unitSeconds) return `${Math.floor(secondsAgo / unitSeconds)}${label} ago`;
  }
  return 'just now';
}
