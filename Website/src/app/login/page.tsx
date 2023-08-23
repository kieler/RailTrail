import Login from "@/app/components/login";
import {FormWrapper} from "@/app/components/form";


export default function LoginPage({searchParams}: {searchParams?: {success?: string | string[]}}) {

    const success = searchParams?.success;
    console.log('searchParams', searchParams)

    if (success !== undefined && typeof success !== 'string') {
        throw new Error('Bad Request', {cause: success})
    }

    return (
        <FormWrapper>
            <Login success={success}/>
        </FormWrapper>
    )
}