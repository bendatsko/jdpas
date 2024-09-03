// src/store/index.ts
import {configureStore} from "@reduxjs/toolkit";
import {api as v1} from "./api/v1";
import authReducer from "./slice/auth/index.ts";
import appReducer from "./slice/app";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        app: appReducer,
        [v1.reducerPath]: v1.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(v1.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

