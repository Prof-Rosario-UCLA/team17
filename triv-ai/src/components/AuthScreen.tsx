import { GoogleLogin } from "@react-oauth/google"
// import jwt_decode from "jwt-decode"

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl mb-4">Sign in to play Triv.AI</h1>
            <GoogleLogin
                onSuccess={(credentialResponse) => {
                    console.log(credentialResponse)                    
                    // const credential = credentialResponse.credential;

                    // if (credential) {
                    //     const userInfo: any = jwt_decode(credential);
                    //     console.log('Decoded JWT:', userInfo);

                    //     // Example fields you get:
                    //     userInfo.name
                    //     userInfo.email
                    //     userInfo.picture

                    //     onLogin(userInfo); // pass user info to your app
                    // }
                }}
                onError={() => {
                    console.log("Login Failed");
                }}
            />
        </div>
    );
}
