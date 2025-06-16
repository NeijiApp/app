import type * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";

export function UserMessage({ children }: { children?: React.ReactNode }) {
        const [visible, setVisible] = useState(false);

        useEffect(() => {
                setVisible(true);
        }, []);

        return (
                <div className="flex justify-end">
                        <div className={cn(
                                "max-w-xs break-all rounded-tl-xl rounded-tr-xl rounded-br-none rounded-bl-xl bg-white px-4 py-2 text-gray-800 shadow lg:max-w-md transition-opacity duration-500",
                                visible ? "opacity-100" : "opacity-0",
                        )}>
                                {children}
                        </div>
                </div>
        );
}
