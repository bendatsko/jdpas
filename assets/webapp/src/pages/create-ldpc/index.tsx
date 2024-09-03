import React, {useEffect, useState} from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {useDispatch, useSelector} from "react-redux";
import {selectUser} from "@/store/slice/auth";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {toast} from "@/components/ui/use-toast";
import {AlertCircle, CheckCircle, Loader2} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {setBreadCrumb} from "@/store/slice/app";
const baseUrl = import.meta.env.VITE_API_URL;





const NewTestSchema = z.object({
    title: z.string().nonempty("Title is required"),
    testBench: z.string().nonempty("Test Bench is required"),
    snrRange: z.string().regex(/^\d+:\d+:\d+$/, "SNR Range must be in the format start:step:stop"),
    batchSize: z.string().regex(/^\d+$/, "Batch Size must be a positive integer"),
});

type NewTestSchema_INFERRED = z.infer<typeof NewTestSchema>;


type Preset = {
    id: string;
    name: string;
    config: Partial<NewTestSchema_INFERRED>;
};

const samplePresets: Preset[] = [
    {
        id: "1",
        name: "Default Test",
        config: {title: "Default Test Profile", testBench: "ldpc1", snrRange: "0:1:5", batchSize: "3"}
    },
    {id: "2", name: "High Precision", config: {testBench: "ldpc2", snrRange: "0:0.5:10", batchSize: "5"}},
];

const PresetSelector: React.FC<{
    presets: Preset[],
    onSelect: (preset: Preset) => void,
    onSave: () => void
}> = ({presets, onSelect, onSave}) => (
    <div className="flex items-center space-x-2 mb-6">
        <Select onValueChange={(value) => onSelect(presets.find(p => p.id === value)!)}>
            <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a preset"/>
            </SelectTrigger>
            <SelectContent>
                {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

const ServerStatus: React.FC<{ status: 'online' | 'offline' | 'checking' }> = ({status}) => (
    <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium">Test Manager Server Status:</span>
        {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>}
        {status === 'online' && <CheckCircle className="h-4 w-4 text-green-500"/>}
        {status === 'offline' && <AlertCircle className="h-4 w-4 text-red-500"/>}
        <span className="text-sm text-muted-foreground capitalize">{status}</span>
    </div>
);

const Create: React.FC = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [presets, setPresets] = useState<Preset[]>(samplePresets);
    const dispatch = useDispatch();


    useEffect(() => {
        dispatch(
            setBreadCrumb([
                {title: "Dashboard", link: "/dashboard"},
                {title: "Create", link: ""},
                {title: "LDPC", link: "create-ldpc"},


            ])
        );
    }, [dispatch]);


    const form = useForm<NewTestSchema_INFERRED>({
        resolver: zodResolver(NewTestSchema),
        defaultValues: {
            title: "",
            testBench: "",
            snrRange: "",
            batchSize: "",
        },
    });

    const checkServerHealth = async () => {
        try {
            const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
            const data = await response.json();
            setServerStatus(data.status === "OK" ? 'online' : 'offline');
        } catch (error) {
            console.error('Error checking server health:', error);
            setServerStatus('offline');
        }
    };

    useEffect(() => {
        checkServerHealth();
        const intervalId = setInterval(checkServerHealth, 60000); // Check every minute
        return () => clearInterval(intervalId);
    }, []);

    const onSubmit = async (data: NewTestSchema_INFERRED) => {
        const fullData = {
            ...data,
            author: user.username,
            DUT: data.testBench || 'Default DUT Value',
            username: user.username,
            user_id: user.id,
            accessible_to: JSON.stringify([user.username]),
            status: 'Queued',
            creationDate: '-',
            duration: '-',
        };

        try {
            const response = await fetch(`${baseUrl}/tests`, {  // Correct usage of backticks and variable
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(fullData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create test");
            }

            toast({title: "Success", description: "Test created successfully.", variant: "default"});
            navigate('/dashboard');
        } catch (error) {
            toast({title: "Error", description: error.message, variant: "negative"});
        }
    };


    const onPresetSelect = (preset: Preset) => {
        Object.entries(preset.config).forEach(([key, value]) => {
            form.setValue(key as keyof NewTestSchema_INFERRED, value as string);
        });
        // Set a default title based on the preset name
        const defaultTitle = preset.config.title || `${preset.name} Test`;
        form.setValue('title', defaultTitle);
    };

    const onPresetSave = () => {
        const currentValues = form.getValues();
        const newPreset: Preset = {
            id: (presets.length + 1).toString(),
            name: `Custom Preset ${presets.length + 1}`,
            config: currentValues,
        };
        setPresets([...presets, newPreset]);
        toast({
            title: "Preset Saved",
            description: `New preset "${newPreset.name}" has been created.`,
        });
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0A0A0A] flex justify-center ">

            <div className="space-y-6 w-full">
                <div>
                    <h1 className="text-3xl font-bold">Create Test</h1>
                    <p className="text-muted-foreground mt-2">Configure test parameters for LDPC Decoder ASIC.</p>
                </div>

                <ServerStatus status={serverStatus}/>

                <div>
                    <p className="text-muted-foreground font-semibold text-sm mb-2">Load Preset</p>
                    <PresetSelector presets={presets} onSelect={onPresetSelect} onSave={onPresetSave}/>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Untitled test" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="testBench"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Test Bench</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a test bench"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {['ldpc1', 'ldpc2', 'ldpc3'].map((bench) => (
                                                <SelectItem key={bench} value={bench}>{bench.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="snrRange"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>SNR Range</FormLabel>
                                    <FormControl>
                                        <Input placeholder="start:step:stop (e.g., 0:1:5)" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="batchSize"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Batch Size</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 3" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                className="w-auto"
                                disabled={serverStatus !== 'online'}
                            >
                                Create LDPC Chip Test
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default Create;