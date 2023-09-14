import { FormWrapper } from "@/app/components/form";
import React from "react";

/**
 * The
 * @param children
 * @constructor
 */
export default function Layout({ children }: { children: React.ReactNode }) {
	return <FormWrapper>{children}</FormWrapper>;
}
