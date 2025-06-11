import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "../App.css";

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
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
            <header className="welcome-heading">Triv<span className="username">.ai</span></header>
            <p className="text-lg mb-10">Sign in with Google to play!</p>
            <div className="flex flex-col items-center justify-center space-y-2">
                <GoogleLogin
                    theme="filled_black"
                    text="signin_with"
                    shape="pill"
                    
                    onSuccess={(credentialResponse) => {
                        const credential = credentialResponse.credential;
                        if (credential) {
                            const decoded: any = jwtDecode(credential);
                            const userInfo = {
                                id: decoded.sub,             // 🔐 Stable Google user ID
                                name: decoded.name,
                                picture: decoded.picture,
                                email: decoded.email,        // optional but useful
                            };
                            localStorage.setItem("user", JSON.stringify(userInfo));
                            onLogin(userInfo);
                        }
                    }}
                    onError={() => {
                        console.log("Login Failed");
                    }}
                />

                <p>Note: We use cookies to store your basic Google login data for gameplay.</p>
            </div>
        </div>
    );
}
