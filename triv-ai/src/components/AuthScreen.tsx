import React, { useEffect, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "../App.css";

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
    const [user, setUser] = useState<any | null>(null);

    // useEffect(() => {
    //     // Check if user info exists in localStorage or session (your auth logic here)
    //     const savedUser = localStorage.getItem("user");
    //     if (savedUser) {
    //         setUser(JSON.parse(savedUser));
    //     }
    // }, []);

    
    
    return (
        <div>
        
            {/* <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Triv.AI</h1> */}
            <p className="text-lg mb-10">Sign in with Google to play!</p>
            <div className="bg-white rounded-lg shadow-md p-2">
                <GoogleLogin
                    theme="filled_black"
                    text="signin_with"
                    shape="pill"
                    size="large"
                    onSuccess={(credentialResponse) => {
                        const credential = credentialResponse.credential;
                        if (credential) {
                            const userInfo: any = jwtDecode(credential);
                            setUser(userInfo);
                            localStorage.setItem("user", JSON.stringify(userInfo));
                            onLogin(userInfo);
                        }
                    }}
                    onError={() => {
                        console.log("Login Failed");
                    }}
                />
            </div>
        </div>
    );
}
