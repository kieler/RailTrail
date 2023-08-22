import Login from "@/app/components/login";
import { FormWrapper } from "@/app/components/form";

/**
 * DO NOT USE. Will probably stop working, as progress on the backend continues.
 */
export default function SignupPage() {
	return (
		<FormWrapper>
			<p>Please enter the username and password for the account you want to create.</p>
			<Login signup={true} />
		</FormWrapper>
	);
}
