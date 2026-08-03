import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

const PrivateRoute = ({ children }) => {

    if (!isLoggedIn()) {

        return <Navigate to="/" replace />;

    }

    return children;

};

export default PrivateRoute;