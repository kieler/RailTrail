import {FormWrapper} from "@/app/components/form";

export default function Layout({children,}: { children: React.ReactNode }) {
    return (
        <FormWrapper>
            {children}
        </FormWrapper>
    );
}