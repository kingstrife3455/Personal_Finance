"use client";

import { createAsset } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function AddAssetForm({ isRetirement = false }: { isRetirement?: boolean }) {
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        await createAsset(formData);
        setIsPending(false);
        // Reset form or close modal logic here if needed
        const form = document.getElementById("add-asset-form") as HTMLFormElement;
        form?.reset();
    }

    return (
        <form
            id="add-asset-form"
            action={handleSubmit}
            className="flex w-full max-w-sm items-center space-x-2"
        >
            <input type="hidden" name="isRetirement" value={String(isRetirement)} />
            <Input type="text" name="name" placeholder="Asset Name (e.g. DBS Savings)" required />
            <select
                name="type"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <option value="BANK">Bank</option>
                <option value="INVESTMENT">Investment</option>
                <option value="CPF">CPF</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="OTHER">Other</option>
            </select>
            <Button type="submit" disabled={isPending}>
                {isPending ? "..." : "Add"}
            </Button>
        </form>
    );
}
