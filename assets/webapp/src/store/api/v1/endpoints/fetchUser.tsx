// services/api.ts

// Fetch the base URL from environment variables
const baseUrl = import.meta.env.VITE_API_URL; // Ensure this matches the variable name set in your .env file

export const fetchUserInfo = async () => {
    const response = await fetch(`${baseUrl}/uuid`); // Changed to use baseUrl
    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }
    return response.json();
};
