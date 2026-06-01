import { useAuth0 } from '@auth0/auth0-react';

export function useApi() {
  const { getAccessTokenSilently } = useAuth0();
  const API = import.meta.env.VITE_API_URL;

  const apiFetch = async (path, options = {}) => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }
    });

    return fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  return { apiFetch };
}