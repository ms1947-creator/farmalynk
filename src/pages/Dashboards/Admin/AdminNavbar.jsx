// src/pages/Admin/AdminNavbar.jsx

// NOTE: No external imports needed, guaranteeing no unwanted links are rendered.
import { Link } from "react-router-dom"; // Need Link for the Logo click functionality

export default function AdminNavbar({ currentUser, handleLogout }) {
  // Get the display name from the currentUser object passed from AdminDashboard
  const userName = currentUser?.name || "Admin";

  return (
    // Replicating the wrapper styling from your original Navbar
    <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      
      <div 
        className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center
                   bg-white/30 backdrop-blur-md hover:bg-white/70 shadow-md rounded-b-lg"
      >
        
        {/* Logo and App Name (REPLICATED FROM ORIGINAL) */}
        {/* Link set to the admin dashboard path for re-clicking the logo/name */}
        <Link to="/admin/dashboard" className="flex items-center space-x-3">
          
          {/* Floating circular logo */}
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition duration-500">
            {/* NOTE: You must use the correct local path for your logo, 
               or the original Cloudinary URL if that's what you prefer: 
               src="https://res.cloudinary.com/dyvxz9dwm/image/upload/v1753768487/farma_lynk_logo_xc5kfb.png"
               I'll use the public path as the image URL is not guaranteed to be stable.
            */}
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

        {/* Admin Greeting and Logout */}
        <div className="flex items-center space-x-4 text-gray-700 font-medium">
            
            {/* REQUIRED: Hello, Username */}
            <span className="text-gray-800 text-lg font-bold">Hello!, {userName}</span>
            
            {/* REQUIRED: Logout Button (styled similar to your original Signup button) */}
            <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
            >
                Logout
            </button>
        </div>
      </div>
    </nav>
  );
}