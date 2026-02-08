// src/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // 로그인 안 되어 있으면 로그인 페이지로 보내고,
        // 나중에 다시 돌아올 수 있도록 from에 현재 위치 저장
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return children;
}
