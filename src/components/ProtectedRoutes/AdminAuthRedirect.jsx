import React from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseconfig";
import { doc, getDoc } from "firebase/firestore";

const AdminAuthRedirect = ({ children }) => {
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;

        if (role === "admin") {
          setIsAdmin(true);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  // Already logged in as admin? redirect to dashboard
  if (isAdmin) return <Navigate to="/farmalynk-one-admin-dashboard" replace />;

  return children;
};

export default AdminAuthRedirect;
