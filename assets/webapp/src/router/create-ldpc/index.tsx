import {ErrorBoundary} from "@/components";
import {MainLayout} from "@/layouts";
// import { Settings } from "@/pages";
import {RouteObject} from "react-router-dom";
import Create from "@/pages/create-ldpc";

const CreateRoutes: RouteObject[] = [
    {
        path: "/create-ldpc",
        element: <MainLayout/>,
        errorElement: <ErrorBoundary/>,
        children: [
            {
                path: "",
                element: <Create/>,
            },
        ],
    },
];
export default CreateRoutes;
