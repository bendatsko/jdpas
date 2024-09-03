// columns.tsx
import React from 'react';
import {ColumnDef} from "@tanstack/react-table";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {MoreHorizontal} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";

type User = {
    id: string;
    email: string;
    username: string;
    role: string;
    bio: string;
};
const baseUrl = import.meta.env.VITE_API_URL;

export const columns: ColumnDef<User>[] = [
    {
        id: 'select',
        header: ({table}) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({row}) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
    },
    {
        accessorKey: 'id',
        header: 'Id',
    },
    {
        accessorKey: 'role',
        header: 'Role',
    },
    {
        accessorKey: 'username',
        header: 'Username',
    },

    {
        accessorKey: 'email',
        header: 'Email',
    },

    {
        accessorKey: 'bio',
        header: 'Bio',
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({row}) => {
            const user = row.original;
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
            const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
            const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = React.useState(false);
            const [editedUser, setEditedUser] = React.useState(user);
            const [newPassword, setNewPassword] = React.useState('');

            const handleDeleteUser = async () => {
                try {
                    const response = await fetch(`${baseUrl}/users/${user.id}`, {
                        method: 'DELETE',
                    });
                    if (response.ok) {
                        console.log('User deleted successfully');
                        // TODO: Refresh the user list
                    } else {
                        console.error('Error deleting user');
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                }
                setIsDeleteDialogOpen(false);
            };

            const handleEditUser = async () => {
                try {
                    const response = await fetch(`${baseUrl}/users/${user.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(editedUser),
                    });
                    if (response.ok) {
                        console.log('User updated successfully');
                        // TODO: Refresh the user list
                    } else {
                        console.error('Error updating user');
                    }
                } catch (error) {
                    console.error('Error updating user:', error);
                }
                setIsEditDialogOpen(false);
            };

            const handleResetPassword = async () => {
                try {
                    const response = await fetch(`${baseUrl}/reset-password`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({userId: user.id, newPassword}),
                    });
                    if (response.ok) {
                        console.log('Password reset successfully');
                    } else {
                        console.error('Error resetting password');
                    }
                } catch (error) {
                    console.error('Error resetting password:', error);
                }
                setIsResetPasswordDialogOpen(false);
                setNewPassword('');
            };

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(user.email)}
                            >
                                Copy email address
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>Modify
                                profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>Delete
                                profile</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Delete User Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit User Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="username" className="text-right">Username</Label>
                                    <Input
                                        id="username"
                                        value={editedUser.username}
                                        onChange={(e) => setEditedUser({...editedUser, username: e.target.value})}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">Email</Label>
                                    <Input
                                        id="email"
                                        value={editedUser.email}
                                        onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role" className="text-right">Role</Label>
                                    <Input
                                        id="role"
                                        value={editedUser.role}
                                        onChange={(e) => setEditedUser({...editedUser, role: e.target.value})}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bio" className="text-right">Bio</Label>
                                    <Input
                                        id="bio"
                                        value={editedUser.bio}
                                        onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleEditUser}>Save changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Reset Password Dialog */}
                    <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                    Enter a new password for the user.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="newPassword" className="text-right">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline"
                                        onClick={() => setIsResetPasswordDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleResetPassword}>Reset Password</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            );
        },
    },
];