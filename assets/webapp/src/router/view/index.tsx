import {ErrorBoundary} from "@/components";
import {MainLayout} from "@/layouts";
import {RouteObject} from "react-router-dom";
import View from "@/pages/view";

const ViewRoutes: RouteObject[] = [
    {
        path: "/view",
        element: <MainLayout/>,
        errorElement: <ErrorBoundary/>,
        children: [
            {
                path: ":id",
                element: <View/>,
            },
        ],
    },
];

export default ViewRoutes;