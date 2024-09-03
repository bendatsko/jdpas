import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loading } from "@geist-ui/core";
import { recentTestsColumns } from "./components/recent-tests-columns";
import { DataTable } from "./components/recent-tests-table";
import { useGetTestsQuery } from "@/store/api/v1/endpoints/test";
import { setBreadCrumb } from "@/store/slice/app";
import { selectUser } from "@/store/slice/auth";
import { User } from "../../store/slice/auth";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Activity, CheckCircle, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const baseUrl = import.meta.env.VITE_API_URL;
const POLLING_INTERVAL = 5000; // 5 seconds

const Dashboard = () => {
  const user = useSelector(selectUser) as User;
  const { data, isLoading, error, refetch } = useGetTestsQuery(user.username, {
    pollingInterval: POLLING_INTERVAL,
  });
  const [testsData, setTestsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setBreadCrumb([{ title: "Dashboard", link: "/dashboard" }]));
  }, [dispatch]);

  useEffect(() => {
    if (data) {
      console.log("Received new data from API:", data);
      setTestsData(data);
    }
  }, [data]);

  const handleDeleteSelected = async (selectedRows) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedRows.length} tests?`);
    if (!confirmDelete) return;

    const idsToDelete = selectedRows.map(row => row.id);
    try {
      const response = await fetch(`${baseUrl}/api/tests/batch-delete`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: idsToDelete})
      });

      if (!response.ok) throw new Error('Failed to delete tests.');

      const result = await response.json();
      console.log(result);

      setTestsData(prevData => prevData.filter(row => !idsToDelete.includes(row.id)));
      refetch(); // Refetch data after deletion
    } catch (error) {
      console.error('Error deleting tests:', error);
      alert('Failed to delete tests: ' + error.message);
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Loading />
        </div>
    );
  }

  if (error) {
    return (
        <Card className="m-6">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mt-2">An error occurred while fetching the tests.</p>
            <p className="mt-1 text-sm opacity-75">{error.toString()}</p>
          </CardContent>
        </Card>
    );
  }

  const filteredTests = testsData.filter((test) =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = {
    total: testsData.length,
    running: testsData.filter((test) => test.status === "Running").length,
    completed: testsData.filter((test) => test.status === "Completed").length,
  };

  return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0A0A0A] flex justify-center ">



        <div className="m-6 container bg-white dark:bg-[#0A0A0A] rounded-lg shadow-lg overflow-hidden border-b dark:border-[#333333] ">


          <div className="flex justify-between items-center py-6 border-b border-gray-200 dark:border-[#333333]">



            <h1 className="text-3xl font-bold text-black dark:text-white">Dashboard</h1>
            <div className="flex space-x-4">
              <Button onClick={handleRefresh} className="bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => navigate("/create-ldpc")} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Test
              </Button>
            </div>
          </div>

          <div className="py-8 ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
              {[
                { title: "Total Tests", value: statusCounts.total, icon: Database, color: "bg-purple-100 dark:bg-[#000]" },
                { title: "Running Tests", value: statusCounts.running, icon: Activity, color: "bg-yellow-100 dark:bg-[#000]" },
                { title: "Completed Tests", value: statusCounts.completed, icon: CheckCircle, color: "bg-green-100 dark:bg-[#000]" },
              ].map((item, index) => (
                  <Card key={index} className={`dark:border-[#333333] ${item.color} rounded-lg`} >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-black dark:text-white">{item.title}</CardTitle>
                      <item.icon className="h-4 w-4 text-black dark:text-white" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-black dark:text-white">{item.value}</p>
                    </CardContent>
                  </Card>
              ))}
            </div>

            <Card className="dark:border-[#333333] mb-8 bg-white dark:bg-[#000] rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-black dark:text-white">Test History</CardTitle>
                <p className="text-sm text-gray-500 dark:text-white/80">View and manage your previous test runs</p>
              </CardHeader>
              <CardContent>

                <DataTable
                    columns={recentTestsColumns}
                    data={filteredTests}
                    onDeleteSelected={handleDeleteSelected}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;