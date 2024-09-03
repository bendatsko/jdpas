import React from "react";
import { DAQROCLogo } from "@/components/common/DaqrocSquareIcon.tsx";
import { useTheme } from "@/services/providers/theme-provider.tsx";

const MobileLogo: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div className="lg:hidden basis-1/2 flex flex-col justify-center items-center">
            <div className="flex items-center justify-center gap-3">
                <DAQROCLogo
                    className="text-[90px] lg:text-[150px]"
                    height="8rem"
                    width="12rem"
                    overrideColor={theme as "light" | "dark"}
                />
            </div>
            <div className={`text-center mt-8 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                <div className="text-2xl font-semibold mb-4">DAQROC</div>
                <div className={`text-sm ${theme === 'light' ? 'text-black/70' : 'text-white/70'} mt-4`}>
                    Flynn Lab, University of Michigan
                </div>
            </div>
        </div>
    );
};

export default MobileLogo;