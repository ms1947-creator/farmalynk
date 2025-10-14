// farmer/components/ProfileEditor.jsx

import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../../../../firebaseconfig'; // Adjust the path
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaUserEdit, FaCamera, FaSpinner, FaSave, FaStar, FaSeedling } from 'react-icons/fa';
import ReviewsTab from './ReviewsTab'; // Import the Reviews tab component

const Avatar = ({ url, name, size = 'w-24 h-24' }) => (
    <img 
        src={url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Farmer')}&background=0D8328&color=fff&size=50`}
        alt={`${name}'s profile`}
        className={`${size} rounded-full object-cover border-4 border-white shadow-md`}
        referrerPolicy="no-referrer"
    />
);

function ProfileEditor({ farmerId, farmerData }) {
    const [view, setView] = useState('profile'); // 'profile' or 'reviews'
    const [formData, setFormData] = useState(farmerData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCropsChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, crops: value.split(',').map(c => c.trim()).filter(c => c.length > 0) }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setErrorMsg('');
        
        try {
            const storageRef = ref(storage, `farmer_photos/${farmerId}_${Date.now()}`);
            await uploadBytes(storageRef, file); 
            const url = await getDownloadURL(storageRef);

            // Update Firestore with the new photo URL
            await updateDoc(doc(db, 'farmers', farmerId), { photoURL: url });
            
            // Update local state and farmerData
            setFormData(prev => ({ ...prev, photoURL: url }));
            setSuccessMsg("Profile photo updated successfully!");
        } catch (error) {
            console.error("Photo upload error:", error);
            setErrorMsg("Failed to upload photo. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const dataToUpdate = {
                name: formData.name,
                age: formData.age,
                location: formData.location,
                crops: formData.crops,
                story: formData.story,
            };
            await updateDoc(doc(db, 'farmers', farmerId), dataToUpdate);
            setSuccessMsg("Profile details updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            setErrorMsg("Failed to save profile. Please check your network.");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    const renderProfileView = () => (
        <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-green-600">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><FaUserEdit className="mr-3" /> Edit Profile Details</h3>
            
            {/* Messages */}
            {errorMsg && <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">{errorMsg}</div>}
            {successMsg && <div className="p-3 mb-4 text-sm font-medium text-green-700 bg-green-100 rounded-lg">{successMsg}</div>}

            <div className="flex flex-col items-center mb-6">
                <Avatar url={formData.photoURL} name={formData.name} />
                <label className="mt-3 cursor-pointer text-green-600 hover:text-green-700 font-medium flex items-center">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                    {uploading ? <><FaSpinner className="animate-spin mr-2" /> Uploading...</> : <><FaCamera className="mr-2" /> Change Photo</>}
                </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-lg p-3" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Age</label>
                        <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-lg p-3" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700">Location</label>
                    <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-lg p-3" required />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700">Crops (Comma Separated)</label>
                    <input type="text" name="crops" value={formData.crops?.join(', ') || ''} onChange={handleCropsChange} placeholder="e.g., Wheat, Red Dal, Maize" className="mt-1 w-full border border-gray-300 rounded-lg p-3" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700">My Story/Bio</label>
                    <textarea name="story" value={formData.story || ''} onChange={handleChange} rows="3" className="mt-1 w-full border border-gray-300 rounded-lg p-3"></textarea>
                </div>
                
                <button 
                    type="submit" 
                    disabled={isSubmitting || uploading}
                    className="w-full flex justify-center items-center px-4 py-3 text-base font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition"
                >
                    {isSubmitting ? <><FaSpinner className="animate-spin mr-2" /> Saving...</> : <><FaSave className="mr-2" /> Save Changes</>}
                </button>
            </form>
        </div>
    );

    return (
        <div>
            <div className="flex border-b border-gray-200 mb-6">
                <button 
                    onClick={() => setView('profile')} 
                    className={`px-6 py-3 text-lg font-semibold transition duration-150 ${view === 'profile' ? 'border-b-4 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaUserEdit className="inline mr-2" /> Edit Profile
                </button>
                <button 
                    onClick={() => setView('reviews')} 
                    className={`px-6 py-3 text-lg font-semibold transition duration-150 ${view === 'reviews' ? 'border-b-4 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaStar className="inline mr-2" /> Ratings & Reviews
                </button>
            </div>

            {view === 'profile' ? renderProfileView() : <ReviewsTab farmerId={farmerId} />}
        </div>
    );
}

export default ProfileEditor;