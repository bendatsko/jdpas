import React from "react";
import {useParams} from "react-router-dom";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useDispatch} from "react-redux";
import {setBreadCrumb} from "@/store/slice/app";
import Details from "./components/tabs/details";
import Analytics from "./components/tabs/analytics";
import {
  useGetTestByIdQuery,
  useLazyDownloadResultsQuery,
  useRerunTestMutation,
  useUpdateThresholdMutation
} from "@/store/api/v1/endpoints/test";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useToast} from "@/components/ui/use-toast";
import {AlertCircle, Loader2} from "lucide-react";

const View: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const {data: test, isLoading, error} = useGetTestByIdQuery(id);
    const [updateThreshold] = useUpdateThresholdMutation();
    const [rerunTest] = useRerunTestMutation();
    const [downloadResults] = useLazyDownloadResultsQuery();
    const {toast} = useToast();

    React.useEffect(() => {
        if (id) {
            dispatch(
                setBreadCrumb([
                    {
                        title: "Tests",
                        link: "/dashboard",
                    },
                    {
                        title: "Details",
                        link: `/view/${id}`,
                    },
                ])
            );
        }
    }, [dispatch, id]);

    const handleUpdateThreshold = async (newThreshold: number) => {
        if (!id) return;
        try {
            await updateThreshold({id, threshold: newThreshold}).unwrap();
            toast({
                title: "Threshold Updated",
                description: "The test threshold has been successfully updated.",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "There was an error updating the threshold. Please try again.",
                variant: "destructive",
                duration: 5000,
            });
        }
    };

    const handleRerunTest = async () => {
        if (!id) return;
        try {
            await rerunTest(id).unwrap();
            toast({
                title: "Test Rerun Initiated",
                description: "The test is now rerunning. You'll be notified when it's complete.",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Rerun Failed",
                description: "There was an error rerunning the test. Please try again.",
                variant: "destructive",
                duration: 5000,
            });
        }
    };

    const handleDownloadResults = async () => {
        if (!id) return;
        try {
            const blob = await downloadResults(id).unwrap();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `test_${id}_results.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast({
                title: "Results Downloaded",
                description: "The test results have been successfully downloaded.",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Download Failed",
                description: "There was an error downloading the results. Please try again.",
                variant: "destructive",
                duration: 5000,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
            </div>
        );
    }

    if (error || !test || !id) {
        return (
            <Card className="max-w-2xl mx-auto mt-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-red-600 flex items-center">
                        <AlertCircle className="mr-2"/>
                        {error ? "Error Occurred" : "Test Not Found"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-lg">
                        {error instanceof Error
                            ? error.message
                            : "The requested test could not be found or loaded. Please check the test ID and try again."}
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">{test.title}</h1>
            <Tabs defaultValue="details" className="space-y-6">
                <TabsList className="bg-secondary">
                    <TabsTrigger value="details"
                                 className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Test Details
                    </TabsTrigger>
                    <TabsTrigger value="analytics"
                                 className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Analytics
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="bg-card p-6 rounded-lg shadow-lg">
                    <Details
                        test={test}
                        onUpdateThreshold={handleUpdateThreshold}
                        onRerunTest={handleRerunTest}
                        onDownloadResults={handleDownloadResults}
                    />
                </TabsContent>
                <TabsContent value="analytics" className="bg-card p-6 rounded-lg shadow-lg">
                    <Analytics testResults={test.results}/>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default View;