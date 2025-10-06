import React from 'react';

export default function Footer() {
  // Define the hover color based on the new brand accent color (lime green)
  const ACCENT_COLOR_CLASS = "text-lime-400";
  const HOVER_BG_CLASS = "hover:bg-lime-400";

  // SVG Icons to replace external dependencies (FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn)

  const FacebookIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h3V2h-3a5 5 0 0 0-5 5v2.5H7v4h2.5V22h5v-8.5z"/>
    </svg>
  );

  const TwitterIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.795-1.574 2.16-2.723-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045C7.388 9.244 3.869 7.391 1.94 4.79c-.381.67-.585 1.453-.585 2.266 0 1.945.997 3.659 2.504 4.67-.9-.028-1.746-.282-2.484-.652v.052c0 3.09 2.2 5.666 5.11 6.262-.486.132-.997.202-1.52.202-.377 0-.74-.037-1.096-.104.81 2.551 3.16 4.414 5.955 4.414 3.394 0 5.87-2.84 6.643-5.462 1.05-.723 1.977-1.63 2.753-2.659.81-.664 1.407-1.464 1.916-2.31c.421-.832.658-1.745.658-2.673 0-.173-.008-.344-.025-.514.945-.69 1.767-1.54 2.413-2.518z"/>
    </svg>
  );

  const InstagramIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.015 4.85.071 1.17.067 1.629.249 2.02.43 1.348.608 2.059 1.528 2.441 2.449.382.92.564 1.379.63 2.548.056 1.265.07 1.645.07 4.849 0 3.205-.014 3.585-.07 4.85-.067 1.17-.25 1.629-.43 2.02-.608 1.348-1.528 2.059-2.449 2.441-.92.382-1.379.564-2.548.63-.665.056-1.045.07-4.849.07-3.204 0-3.584-.015-4.85-.071-1.17-.067-1.629-.249-2.02-.43-1.348-.608-2.059-1.528-2.449-2.449-.382-.92-.564-1.379-.63-2.548-.056-1.265-.07-1.645-.07-4.849 0-3.205.014-3.585.07-4.85.067-1.17.25-1.629.43-2.02.608-1.348 1.528-2.059 2.449-2.441.92-.382 1.379-.564 2.548-.63 1.265-.056 1.645-.07 4.849-.07zm0-2.163c-3.259 0-3.666.015-4.949.071-1.464.072-2.33.351-3.206.779-1.05.518-1.922 1.39-2.441 2.441-.427.876-.706 1.742-.779 3.206-.056 1.283-.07 1.69-.07 4.949 0 3.259.015 3.666.07 4.949.073 1.464.352 2.33.779 3.206.518 1.05 1.39 1.922 2.441 2.441.876.427 1.742.706 3.206.779 1.283.055 1.69.07 4.949.07 3.259 0 3.666-.015 4.949-.071 1.464-.073 2.33-.352 3.206-.779 1.05-.518 1.922-1.39 2.441-2.441.427-.876.706-1.742.779-3.206.055-1.283.07-1.69.07-4.949 0-3.259-.015-3.666-.07-4.949-.073-1.464-.352-2.33-.779-3.206-.518-1.05-1.39-1.922-2.441-2.441-.876-.427-1.742-.706-3.206-.779-1.283-.056-1.69-.07-4.949-.07zm0 3.627c2.343 0 4.237 1.894 4.237 4.237 0 2.344-1.894 4.237-4.237 4.237-2.343 0-4.237-1.893-4.237-4.237 0-2.343 1.894-4.237 4.237-4.237zm0 2.163c-1.155 0-2.073.918-2.073 2.073 0 1.154.918 2.073 2.073 2.073 1.155 0 2.073-.919 2.073-2.073 0-1.155-.918-2.073-2.073-2.073zm6.54-.776c.465 0 .845.38.845.845 0 .465-.38.845-.845.845-.465 0-.845-.38-.845-.845 0-.465.38-.845.845-.845z"/>
    </svg>
  );

  const LinkedinIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-5.466 12.637h-3.41V9.282h3.41v6.355zm-1.705-7.792c-.672 0-1.222-.55-1.222-1.222s.55-1.222 1.222-1.222 1.222.55 1.222 1.222-.55 1.222-1.222 1.222zm4.114 7.792h-3.41v-3.325c0-.987.426-1.574 1.168-1.574.653 0 1.056.45 1.056 1.092v3.807z"/>
    </svg>
  );

  // Utility component for a stylized social link, now using inline SVGs
  const SocialIcon = ({ Icon, href }) => (
    <a 
      href={href} 
      className={`w-10 h-10 flex items-center justify-center bg-green-700/80 rounded-full text-white ${HOVER_BG_CLASS} hover:text-green-900 transition duration-300 transform hover:scale-110 shadow-md`}
      aria-label={Icon.name.replace('Icon', '')} // Accessibility improvement
    >
      <Icon className="w-5 h-5" />
    </a>
  );

  return (
    <footer className="bg-green-900 text-white relative overflow-hidden font-poppins">
      {/* --- Visual Enhancement: Floating gradient waves --- */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-green-800 via-green-900 to-green-800 opacity-50 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-green-900 via-green-800 to-green-900 opacity-50 blur-2xl -z-10" />

      {/* --- Main Content Container --- */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
        
        {/* Company Name and Tagline */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h2 className="text-4xl font-extrabold font-playfair drop-shadow-lg">
            {/* Farma in White */}
            <span className="text-white">Farma</span>
            {/* Lynk in Lime Green for contrast */}
            <span className={ACCENT_COLOR_CLASS}>Lynk</span>
          </h2>
          <p className="text-green-200 text-lg italic mt-1 max-w-sm text-center md:text-left">
            Cultivating connection: Fresh, transparent, and sustainable farm-to-table logistics.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col items-center md:items-start gap-3">
          {/* Heading in White */}
          <h3 className="text-xl font-semibold text-white mb-2">Quick Links</h3>
          <a href="#" className={`text-green-200 hover:${ACCENT_COLOR_CLASS} transition`}>About Us</a>
          <a href="#" className={`text-green-200 hover:${ACCENT_COLOR_CLASS} transition`}>Our Produce</a>
          <a href="#" className={`text-green-200 hover:${ACCENT_COLOR_CLASS} transition`}>Contact</a>
        </div>

        {/* Social Media Icons */}
        <div className="flex flex-col items-center md:items-start gap-3">
          {/* Heading in White */}
          <h3 className="text-xl font-semibold text-white mb-2">Connect</h3>
          <div className="flex gap-3">
            <SocialIcon Icon={FacebookIcon} href="#" />
            <SocialIcon Icon={TwitterIcon} href="#" />
            <SocialIcon Icon={InstagramIcon} href="#" />
            <SocialIcon Icon={LinkedinIcon} href="#" />
          </div>
        </div>
      </div>

      {/* --- Copyright Section --- */}
      <div className="border-t border-green-700 mt-8 pt-4 pb-6 text-center text-sm text-green-200">
        © {new Date().getFullYear()} FarmaLynk. All rights reserved. | Built with 💚 and community focus.
      </div>
    </footer>
  );
}
