import React from "react";
import {DAQROCLogo} from "@/components/common/DaqrocSquareIcon.tsx";

const Logo: React.FC = () => {
    return (
        <div className=" hidden lg:basis-1/2 bg-dark lg:h-full lg:flex flex-col justify-center items-center ">
            <div>
                <div className=" flex items-center gap-3 ">
                    <DAQROCLogo className=" text-light text-[90px] lg:text-[150px] " height="12rem" width="12rem"
                                overrideColor="white"/>
                </div>
            </div>
            <div className=" text-light text-center mt-8 ">
                <div className="text-2xl font-semibold mb-4">DAQROC</div>
                <div className="text-sm text-white/50 mt-3 ">
                    Flynn Lab, University of Michigan
                </div>
            </div>
        </div>
    );
};

export default Logo;
