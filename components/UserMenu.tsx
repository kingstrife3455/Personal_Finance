
"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { updatePassword } from "@/app/actions";

export function UserMenu() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            await updatePassword(newPassword);
            setMessage("Password updated successfully!");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setIsOpen(false), 1500);
        } catch (e) {
            setError("Failed to update password");
        }
    };

    if (!session) return null;

    return (
        <div className="mt-auto border-t p-4 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">
                Logged in as: <span className="text-foreground">{session.user?.name}</span>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                        🔑 Change Password
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="text-sm text-destructive">{error}</div>}
                        {message && <div className="text-sm text-green-500">{message}</div>}
                        <Button type="submit" className="w-full">
                            Update Password
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/login" })}
            >
                🚪 Logout
            </Button>
        </div>
    );
}
