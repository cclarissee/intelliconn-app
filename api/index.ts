const API_BASE_URL = 'http://192.168.1.10:3000'; 
// For Android emulator use: http://10.0.2.2:3000
// For iOS simulator: http://localhost:3000
// For physical phone: use your PC IPv4 address

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    // 🔥 Handle HTTP errors properly
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    // 🔥 Prevent crash if empty response
    const text = await response.text();
    return text ? JSON.parse(text) : {};

  } catch (error: any) {
    console.error('API fetch error:', error.message);
    throw new Error('Network request failed. Check backend & IP.');
  }
};
