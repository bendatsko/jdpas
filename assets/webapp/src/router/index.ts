import {createBrowserRouter} from "react-router-dom";
import AuthRoutes from "@/router/auth";
import HomeRoutes from "@/router/home";
import ErrorRoutes from "@/router/errors";
import DashboardRoutes from "@/router/dashboard";
import SettingRoutes from "@/router/settings";
import ProductRoutes from "./products";
import UserRoutes from "./users";
import CreateRoutes from "@/router/create-ldpc";
import ViewRoutes from "@/router/view";

const router = createBrowserRouter([
    ...AuthRoutes,
    ...HomeRoutes,
    ...DashboardRoutes,
    ...ProductRoutes,
    ...UserRoutes,
    ...SettingRoutes,
    ...ErrorRoutes,
    ...CreateRoutes,
    ...ViewRoutes,
]);
export default router;
