import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {getCookie, removeCookie, setCookie} from "typescript-cookie";

// Define the user interface
export interface User {
    id: number;
    email: string;
    username: string;
    role: string;
    bio: string;
    uuid: string;
}


// Define the initial state interface
export interface InitialState {
    token: string;
    user: string;
}

// Initialize the initial state
const initialState: InitialState = {
    token: "",
    user: "",
};

// Create the auth slice
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        saveUserInfo: (state, action: PayloadAction<{
            token: string;
            user?: User
        }>) => {
            const {token, user} = action.payload;
            if (user) {
                console.log("Reducer: Dispatching saveUserInfo action with:", action.payload);
                state.token = token;
                state.user = JSON.stringify(user);
                setCookie("token", token);
                setCookie("user", state.user);
                console.log("Reducer: User information saved:", user);
            } else {
                console.log("Reducer: No user data provided.");
            }
        },
        removeUserInfo: (state) => {
            state.token = "";
            state.user = "";
            removeCookie("token");
            removeCookie("user");
        },
    },
});


// Export
export const {saveUserInfo, removeUserInfo} = authSlice.actions;

// Selectors to get the token and user data
export const token = (state: {
    auth: InitialState
}) => state.auth.token;
export const selectUser = (state: { auth: InitialState }) => {
    try {
        const userJson = getCookie("user") || state.auth.user;
        return JSON.parse(userJson || "{}");
    } catch (e) {
        console.error("Failed to parse user data:", e);
        return {};
    }
};

export default authSlice.reducer;
