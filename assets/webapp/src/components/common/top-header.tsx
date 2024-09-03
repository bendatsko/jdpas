import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Link, useNavigate} from "react-router-dom";
import {LogOut, Menu, Settings, Github, Plus} from "lucide-react";
import {toggleSideBarOpen} from "@/store/slice/app";
import {removeUserInfo, selectUser} from "@/store/slice/auth";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {BreadCrumb, MobileSideBar, ToggleMode} from "@/components";

const TopHeader: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser);

    const handleLogout = () => {
        dispatch(removeUserInfo());
        navigate("/auth/sign-in");
    };

    return (<header
            className="w-full h-16 flex justify-between items-center px-4 dark:bg-[#0a0a0a] bg-[#FFFFF]">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:flex hidden"
                    onClick={() => dispatch(toggleSideBarOpen())}
                >
                    <Menu className="h-5 w-5"/>
                </Button>
                {/* <MobileSideBar/> */}
                {/* <BreadCrumb/> */}
            </div>
            <div className="flex items-center space-x-3 ">
                {/*<Button*/}
                {/*    variant="outline"*/}
                {/*    size="sm"*/}
                {/*    className="text-xs font-semibold h-9 " onClick={() => navigate('/create-ldpc')}*/}
                {/*>*/}
                {/*    Create*/}
                {/*    <Plus className="ml-1 h-3 w-3"/>*/}
                {/*</Button>*/}
                {/*<Button*/}
                {/*    variant="outline"*/}
                {/*    size="sm"*/}
                {/*    className="text-sm h-9"*/}
                {/*>*/}
                {/*    Docs*/}
                {/*</Button>*/}

                <ToggleMode/>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} alt={user.username}/>
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.username}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem asChild>
                            <Link to="/settings">
                                <Settings className="mr-2 h-4 w-4"/>
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4"/>
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>);
};

export default TopHeader;