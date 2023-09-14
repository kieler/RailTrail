export interface AuthenticationRequest {
	username: string; // The username that was entered into the login-form
	password: string; // The password that was entered into the login-form
}

export interface AuthenticationResponse {
	token: string; // A jwt session token
}

export interface PasswordChangeRequest {
	oldPassword: string;
	newPassword: string;
}

export interface UsernameChangeRequest {
	oldUsername: string;
	newUsername: string;
}

export interface User {
	username: string;
}
