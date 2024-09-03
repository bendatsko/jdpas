import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, TrendingUp } from "lucide-react";

interface AnalyticsProps {
  testResults: Array<{ snr: number; ber: number; fer: number }>;
}

const Analytics: React.FC<AnalyticsProps> = ({ testResults }) => {
  const [chartType, setChartType] = useState<'ber' | 'fer'>('ber');

  const averageBER = (testResults.reduce((sum, result) => sum + result.ber, 0) / testResults.length).toExponential(2);
  const averageFER = (testResults.reduce((sum, result) => sum + result.fer, 0) / testResults.length).toExponential(2);
  const bestSNR = Math.max(...testResults.map(result => result.snr));
  const worstSNR = Math.min(...testResults.map(result => result.snr));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Test Analytics</h2>
        <Select onValueChange={(value: 'ber' | 'fer') => setChartType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ber">Bit Error Rate (BER)</SelectItem>
            <SelectItem value="fer">Frame Error Rate (FER)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-2" />
            Performance Curves
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={testResults} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="snr"
                label={{ value: 'SNR (dB)', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis
                label={{
                  value: chartType.toUpperCase(),
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10
                }}
                scale="log"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={chartType}
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-secondary">
          <CardTitle className="text-xl">Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <StatItem label="Average BER" value={averageBER} />
          <StatItem label="Average FER" value={averageFER} />
          <StatItem label="Best SNR" value={`${bestSNR} dB`} />
          <StatItem label="Worst SNR" value={`${worstSNR} dB`} />
        </CardContent>
      </Card>

      {(parseFloat(averageBER) > 0.1 || parseFloat(averageFER) > 0.2) && (
        <Card className="bg-red-100 dark:bg-red-900 border-red-500">
          <CardContent className="flex items-center space-x-2 text-red-800 dark:text-red-200 p-4">
            <AlertCircle className="h-5 w-5" />
            <p>High error rates detected. Consider optimizing your system or re-running the test.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-secondary/50 p-4 rounded-lg">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export default Analytics;