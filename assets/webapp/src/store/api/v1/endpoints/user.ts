import { api } from "..";

// Fetch the base URL from environment variables
const baseUrl = import.meta.env.VITE_API_URL; // make sure the variable name matches your .env file

const userApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: () => ({
                url: `${baseUrl}/users`, // Changed to use baseUrl
                method: "GET",
            }),
            providesTags: ["User"],
        }),
        getUser: builder.query({
            query: (id) => ({
                url: `${baseUrl}/users/${id}`, // Changed to use baseUrl
                method: "GET",
            }),
            providesTags: ["User"],
        }),
        addUser: builder.mutation({
            query: (newUser) => ({
                url: `${baseUrl}/register`, // Changed to use baseUrl
                method: 'POST',
                body: newUser,
            }),
            invalidatesTags: ["User"],
        }),
        updateUser: builder.mutation({
            query: ({id, ...patch}) => ({
                url: `${baseUrl}/users/${id}`, // Changed to use baseUrl
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ["User"],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `${baseUrl}/users/${id}`, // Changed to use baseUrl
                method: 'DELETE',
            }),
            invalidatesTags: ["User"],
        }),
        resetPassword: builder.mutation({
            query: ({userId, newPassword}) => ({
                url: `${baseUrl}/reset-password`, // Changed to use baseUrl
                method: 'POST',
                body: {userId, newPassword},
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserQuery,
    useAddUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useResetPasswordMutation,
} = userApi;
