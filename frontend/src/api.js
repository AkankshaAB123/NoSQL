const BASE_URL = '/api';

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export async function fetchFraudRings() {
  const res = await fetch(`${BASE_URL}/fraud/rings`);
  if (!res.ok) throw new Error(`Failed to fetch fraud rings: ${res.statusText}`);
  return res.json();
}

export async function fetchSharedDevices() {
  const res = await fetch(`${BASE_URL}/fraud/shared-devices`);
  if (!res.ok) throw new Error(`Failed to fetch shared devices: ${res.statusText}`);
  return res.json();
}

export async function fetchMoneyMules() {
  const res = await fetch(`${BASE_URL}/fraud/mules`);
  if (!res.ok) throw new Error(`Failed to fetch money mules: ${res.statusText}`);
  return res.json();
}

export async function fetchUserGraph(userId, expand = false) {
  const res = await fetch(`${BASE_URL}/graph/${encodeURIComponent(userId)}${expand ? '?expand=true' : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch graph for user ${userId}: ${res.statusText}`);
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
  return res.json();
}

export async function simulateTransaction(data) {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to simulate transaction');
  return body;
}

export async function toggleBlacklist(userId, isBlacklisted) {
  const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}/blacklist`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isBlacklisted }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to update blacklist status');
  return body;
}
