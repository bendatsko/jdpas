import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {token} from "@/store/slice/auth";

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        // baseUrl: "http://localhost:",
        prepareHeaders: (headers) => {

            headers.set("Content-Type", "application/json");

            if (token) {
                headers.set("authorization", `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ["Category", "Product", "User"],
    endpoints: () => ({}),
});
