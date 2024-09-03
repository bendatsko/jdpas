import { api } from "..";

// Fetch the base URL from environment variables
const baseUrl = import.meta.env.VITE_API_URL; // Ensure this matches the variable name set in your .env file

const testApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTests: builder.query({
            query: (userId) => ({
                url: `${baseUrl}/tests?username=${userId}`, // Changed to use baseUrl
                method: "GET",
            }),
            providesTags: ["Test"],
        }),
        getTestById: builder.query({
            query: (id) => ({
                url: `${baseUrl}/tests/${id}`, // Changed to use baseUrl
                method: "GET",
            }),
            providesTags: (result, error, id) => [{type: "Test", id}],
        }),
        updateThreshold: builder.mutation({
            query: ({id, threshold}) => ({
                url: `${baseUrl}/tests/${id}/threshold`, // Changed to use baseUrl
                method: "PUT",
                body: {threshold},
            }),
            invalidatesTags: (result, error, {id}) => [{type: "Test", id}],
        }),
        rerunTest: builder.mutation({
            query: (id) => ({
                url: `${baseUrl}/tests/${id}/rerun`, // Changed to use baseUrl
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [{type: "Test", id}],
        }),
        downloadResults: builder.query({
            query: (id) => ({
                url: `${baseUrl}/tests/${id}/download`, // Changed to use baseUrl
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
        }),
        deleteTest: builder.mutation({
            query: (id) => ({
                url: `${baseUrl}/tests/${id}`, // Changed to use baseUrl
                method: "DELETE",
            }),
            invalidatesTags: ["Test"],
        }),
    }),
});

export const {
    useGetTestsQuery,
    useGetTestByIdQuery,
    useUpdateThresholdMutation,
    useRerunTestMutation,
    useLazyDownloadResultsQuery,
    useDeleteTestMutation
} = testApi;
