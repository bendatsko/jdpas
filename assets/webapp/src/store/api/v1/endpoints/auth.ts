import {api} from "../index.ts";
import {SignInType} from "@/types";
const baseUrl = import.meta.env.VITE_API_URL;

const authEndPoint = api.injectEndpoints({
    endpoints: (builder) => ({
        signIn: builder.mutation({
            query: (body: SignInType) => ({
                url: `${baseUrl}/login`,
                method: "POST",
                body,
            }),
        }),
        fetchUserByUUID: builder.query({
            query: (uuid: string) => ({
                url: `${baseUrl}/user/uuid/${uuid}`,
                method: "GET",
            }),
        }),
    }),
    overrideExisting: false,
});

export const {useSignInMutation, useFetchUserByUUIDQuery} = authEndPoint;
