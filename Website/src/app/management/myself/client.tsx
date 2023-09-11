"use client";

import { Dispatch, PropsWithChildren, useContext, useState } from "react";
import { UsernameContext } from "@/app/components/username-provider";
import { PasswordChangeRequest, UsernameChangeRequest } from "@/utils/api.website";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import { BaseManagementForm } from "@/app/management/components/managementForm";
import Link from "next/link";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { useRouter } from "next/navigation";
import { LoginDialog } from "@/app/components/login";

function ChangeForm<T>({
	changeApiUrl,
	changePayload,
	changeValid,
	children,
	setSuccess
}: PropsWithChildren<{
	changePayload: T;
	changeValid: boolean;
	changeApiUrl: string;
	setSuccess: Dispatch<boolean>;
}>) {
	const [error, setError] = useState(undefined as undefined | string);
	const router = useRouter();

	const submit_invalid_msg = changeValid ? undefined : "Diese Änderung ist unzulässig";

	return (
		<BaseManagementForm
			submit_url={changeApiUrl}
			submit_method={"PUT"}
			setError={setError}
			setSuccess={setSuccess}
			mutate_fkt={async () => {
				// call router.refresh to regenerate the username context for the header.
				router.refresh();
			}}
			submit_payload={changePayload}
			submit_invalid_msg={submit_invalid_msg}>
			{children}
			<ErrorMessage error={error} />
			<button
				type={"submit"}
				className="col-span-8 rounded-full bg-gray-700 disabled:bg-gray-300 disabled:dark:text-gray-800 disabled:cursor-not-allowed text-white"
				disabled={!changeValid}>
				Ändern
			</button>
		</BaseManagementForm>
	);
}

function ChangeUsername({ setSuccess }: { setSuccess: Dispatch<boolean> }) {
	const username = useContext(UsernameContext) ?? "";
	const [newUsername, setNewUsername] = useState(username);

	const changePayload: UsernameChangeRequest = { oldUsername: username, newUsername: newUsername };
	const changeApiUrl = "/webapi/user/changeUsername";
	const changeValid = newUsername !== "" && newUsername !== username;

	return (
		<ChangeForm {...{ changePayload, changeApiUrl, changeValid, setSuccess }}>
			<InputWithLabel id={`username_old`} name={"old"} value={username}>
				Bisheriger Username:
			</InputWithLabel>
			<InputWithLabel id={`username_new`} name={"new"} value={newUsername} setValue={setNewUsername}>
				Neuer Username:
			</InputWithLabel>
		</ChangeForm>
	);
}

function ChangePassword({ setSuccess }: { setSuccess: Dispatch<boolean> }) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newPasswordAgain, setNewPasswordAgain] = useState("");

	const changePayload: PasswordChangeRequest = { oldPassword: currentPassword, newPassword: newPassword };
	const changeApiUrl = "/webapi/user/changePassword";
	const passwordsMatch = newPassword === newPasswordAgain;
	const changeValid = newPassword !== "" && newPassword !== currentPassword && passwordsMatch;

	return (
		<ChangeForm {...{ changePayload, changeApiUrl, changeValid, setSuccess }}>
			<InputWithLabel
				id={`password_old`}
				name={"old"}
				value={currentPassword}
				setValue={setCurrentPassword}
				type={"password"}>
				Aktuelles Passwort:
			</InputWithLabel>
			<InputWithLabel
				id={`password_new`}
				name={"new"}
				type={"password"}
				value={newPassword}
				setValue={setNewPassword}>
				Neues Passwort:
			</InputWithLabel>
			<InputWithLabel
				id={`password_again`}
				name={"again"}
				type={"password"}
				value={newPasswordAgain}
				setValue={setNewPasswordAgain}>
				Neues Passwort (Wiederholung):
			</InputWithLabel>
			<ErrorMessage
				error={newPasswordAgain !== "" && !passwordsMatch ? "Passwörter stimmen nicht überein" : undefined}
			/>
		</ChangeForm>
	);
}

export default function SelfManagement({ loggedIn }: { loggedIn: boolean }) {
	const [success, setSuccess] = useState(false);

	return (
		<>
			{!loggedIn && !success && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
			{success ? (
				<div className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
					<div>Änderungen erfolgreich durchgeführt</div>
					<div>Sie wurden durch die Änderung ausgeloggt.</div>
					<Link className={"rounded-full bg-gray-700 px-10 text-white no-a-style"} href={"/login"}>
						Erneut einloggen
					</Link>
				</div>
			) : (
				<>
					<div>Usernamen ändern:</div>
					<ChangeUsername setSuccess={setSuccess} />
					<div className={"my-20"} />
					<div>Passwort ändern:</div>
					<ChangePassword setSuccess={setSuccess} />
				</>
			)}
		</>
	);
}
