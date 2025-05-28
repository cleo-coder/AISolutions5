// JavaScript source code
export default async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
        ...options,
        headers,
    });

    return res.json();
}
