import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, RefreshCw, Edit2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TestDetailsProps {
  test: {
    id: string;
    title: string;
    author: string;
    DUT: string;
    status: string;
    duration: number;
    testBench: string;
    snrRange: string;
    batchSize: number;
    threshold: number;
  };
  onUpdateThreshold: (newThreshold: number) => void;
  onRerunTest: () => void;
  onDownloadResults: () => void;
}

const Details: React.FC<TestDetailsProps> = ({
  test,
  onUpdateThreshold,
  onRerunTest,
  onDownloadResults
}) => {
  const [newThreshold, setNewThreshold] = useState(test.threshold);
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewThreshold(Number(e.target.value));
  };

  const handleUpdateThreshold = () => {
    onUpdateThreshold(newThreshold);
    setIsEditingThreshold(false);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl flex items-center">
            <span className="mr-2">🧪</span> Test Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Test ID" value={test.id} />
            <InfoItem label="Title" value={test.title} />
            <InfoItem label="Author" value={test.author} />
            <InfoItem label="DUT" value={test.DUT} />
            <InfoItem
              label="Status"
              value={
                <Badge
                  variant={test.status === 'Failed' ? 'destructive' : 'default'}
                  className="text-sm font-medium px-2 py-1"
                >
                  {test.status}
                </Badge>
              }
            />
            <InfoItem label="Duration" value={`${test.duration} ms`} />
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Test Bench" value={test.testBench} />
            <InfoItem label="SNR Range" value={test.snrRange} />
            <InfoItem label="Batch Size" value={test.batchSize.toString()} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Threshold
              </label>
              <div className="flex items-center space-x-2">
                {isEditingThreshold ? (
                  <>
                    <Input
                      type="number"
                      value={newThreshold}
                      onChange={handleThresholdChange}
                      className="w-24"
                    />
                    <Button onClick={handleUpdateThreshold} size="sm">
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </>
                ) : (
                  <>
                    <span>{test.threshold}</span>
                    <Button
                      onClick={() => setIsEditingThreshold(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-secondary">
          <CardTitle className="text-xl">Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Button onClick={onRerunTest} className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" /> Rerun Test
            </Button>
            <Button onClick={onDownloadResults} className="flex items-center">
              <Download className="mr-2 h-4 w-4" /> Download Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {test.status === 'Failed' && (
        <Card className="bg-red-100 dark:bg-red-900 border-red-500">
          <CardContent className="flex items-center space-x-2 text-red-800 dark:text-red-200 p-4">
            <AlertCircle className="h-5 w-5" />
            <p>This test has failed. Please review the results and consider rerunning the test.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <p className="text-base font-semibold">{value}</p>
  </div>
);

export default Details;