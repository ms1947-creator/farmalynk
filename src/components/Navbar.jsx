import { Link } from "react-router-dom";

export default function Navbar({ role, user, onLogout }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center
                      bg-white/30 backdrop-blur-md hover:bg-white/70 shadow-md rounded-b-lg">
        
        {/* Logo and App Name */}
        <Link to="/" className="flex items-center space-x-3">
          {/* Floating circular logo */}
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition duration-500">
            <img
              src="https://res.cloudinary.com/dyvxz9dwm/image/upload/v1753768487/farma_lynk_logo_xc5kfb.png"
              alt="FarmaLynk logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-black">Farma</span>
            <span className="text-green-700">Lynk</span>
          </h1>
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-3 text-gray-700 font-medium">

          {/* Guest Home */}
          {!role && !user && (
            <Link to="/" className="hover:text-green-700 transition-colors duration-300">Home</Link>
          )}

          {/* Guest Login/Signup */}
          {!role && !user && (
            <>
              <Link to="/login" className="hover:text-green-700 transition-colors duration-300">Login</Link>
              <Link
                to="/signup"
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Role-based Dashboard Links */}
          {role && (
            <>
              {role === "customer" && <Link to="/customer/dashboard" className="hover:text-green-700 transition-colors duration-300">Dashboard</Link>}
              {role === "farmer" && <Link to="/farmer/dashboard" className="hover:text-green-700 transition-colors duration-300">Dashboard</Link>}
              {role === "seller" && <Link to="/seller/dashboard" className="hover:text-green-700 transition-colors duration-300">Dashboard</Link>}
              {role === "admin" && <Link to="/admin/dashboard" className="hover:text-green-700 transition-colors duration-300">Dashboard</Link>}
              {role === "officer" && <Link to="/officer/dashboard" className="hover:text-green-700 transition-colors duration-300">Dashboard</Link>}
              {role === "company" && <Link to="/company/dashboard" className="hover:text-green-700 transition-colors duration-300">Dashboard</Link>}
            </>
          )}

          {/* Logged-in User */}
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-gray-800 hidden md:inline">Hello, {user.displayName || user.email}!</span>
              <button
                onClick={onLogout}
                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
