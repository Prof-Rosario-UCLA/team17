import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "../App.css";

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
    const [clientReady, setClientReady] = useState(false);

    useEffect(() => {
        // Only render the GoogleLogin button on client
        setClientReady(true);
    }, []);

    return (
        <div>
            <header className="welcome-heading">Triv<span className="username">.ai</span></header>
            <p className="text-lg mb-10">Sign in with Google to play!</p>
            <div className="bg-white rounded-lg shadow-md p-2">
                {clientReady && (
                    <GoogleLogin
                        theme="filled_black"
                        text="signin_with"
                        shape="pill"
                        size="large"
                        onSuccess={(credentialResponse) => {
                            const credential = credentialResponse.credential;
                            if (credential) {
                                const decoded: any = jwtDecode(credential);
                                const userInfo = {
                                    id: decoded.sub,
                                    name: decoded.name,
                                    picture: decoded.picture,
                                    email: decoded.email,
                                };
                                localStorage.setItem("user", JSON.stringify(userInfo));
                                onLogin(userInfo);
                            }
                        }}
                        onError={() => {
                            console.log("Login Failed");
                        }}
                    />
                )}
            </div>
        </div>
    );
}
