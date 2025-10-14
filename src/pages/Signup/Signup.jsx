// Signup.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    fetchSignInMethodsForEmail, 
    signInWithEmailAndPassword, 
}
from "firebase/auth";
import { 
    doc, 
    setDoc, 
    collection, 
    query, 
    where, 
    getDocs,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../../firebaseconfig";
import { motion } from "framer-motion";
import { FaCheckCircle, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa'; 

// Assuming you have these components/utilities
import { Toast } from "../../components/Toast"; 
import Navbar from "../../components/Navbar";

const roles = ["Customer", "Farmer", "Seller", "Field Officer", "Company"];

// Define clear and distinct Firestore collections for each role
const getRoleCollection = (role) => {
    if (role === 'Customer') return 'customers';
    if (role === 'Farmer') return 'farmers';
    if (role === 'Seller') return 'sellers';
    if (role === 'Field Officer') return 'fieldofficers'; 
    if (role === 'Company') return 'companies';
    return 'users_misc'; // Fallback
};

const Signup = () => {
    const [toast, setToast] = useState(null); 
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "", 
        role: "",
        landDocument: null,
        shopLicense: null,
        companyLicense: null, 
        companyCertificate: null, 
        
        companyId: "", 
        companyName: "", 
        selectedOfficerDocId: "", 
        officerDetails: null, 
        
        website: "",
        location: "",
        productList: "",
    });

    const [showPassword, setShowPassword] = useState(false); 
    const [companies, setCompanies] = useState([]); 
    const [fieldOfficers, setFieldOfficers] = useState([]);
    const [foCheckLoading, setFoCheckLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleData, setGoogleData] = useState({ active: false, user: null });
    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
    });
    
    const navigate = useNavigate();

    const triggerToast = useCallback((type, message) => {
        setToast({ message, type });
    }, []);

    // Normalize email to lowercase immediately upon input
    const handleChange = (e) => {
        const { name, value, files, checked, type } = e.target;
        
        if (type === 'checkbox') {
            setAgreements(prev => ({ ...prev, [name]: checked }));
        } else if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            const updatedValue = (name === 'email') ? value.toLowerCase() : value;
            setFormData(prev => ({ ...prev, [name]: updatedValue }));
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const fetchCompanies = useCallback(async () => {
        setFoCheckLoading(true);
        try {
            const q = collection(db, 'companies');
            const snapshot = await getDocs(q);
            const companyList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCompanies(companyList);
        } catch (err) {
            console.error("Error fetching companies:", err);
            triggerToast('error', "Failed to load company list.");
        } finally {
            setFoCheckLoading(false);
        }
    }, [triggerToast]);


    const fetchFieldOfficers = useCallback(async (companyId) => {
        if (!companyId) {
            setFieldOfficers([]);
            return;
        }

        setFoCheckLoading(true);
        try {
            const officersQuery = query(
                collection(db, 'companies', companyId, 'field_officers'), 
                where('isRegistered', '==', false) 
            );
            const snapshot = await getDocs(officersQuery);

            const officersList = snapshot.docs.map(doc => ({
                docId: doc.id, 
                ...doc.data(), 
            }));
            
            setFieldOfficers(officersList);
            if (officersList.length === 0) {
                 triggerToast('warning', "No un-registered Field Officer profiles found for this company.");
            }

        } catch (err) {
            console.error("Error fetching Field Officers:", err);
            triggerToast('error', "Failed to load Field Officer list.");
        } finally {
            setFoCheckLoading(false);
        }
    }, [triggerToast]);


    const handleCompanySelect = (e) => {
        const selectedCompanyId = e.target.value;
        const selectedCompany = companies.find(c => c.id === selectedCompanyId);
        
        setFormData(prev => ({
            ...prev,
            companyId: selectedCompanyId,
            companyName: selectedCompany ? selectedCompany.name : "",
            selectedOfficerDocId: "", 
            officerDetails: null,
            name: selectedCompanyId ? prev.name : "", 
        }));
        
        if (selectedCompanyId) {
            fetchFieldOfficers(selectedCompanyId);
        } else {
            setFieldOfficers([]);
        }
    }
    
    const handleFieldOfficerSelect = (e) => {
        const value = e.target.value;
        if (!value) {
            setFormData(prev => ({
                ...prev,
                selectedOfficerDocId: "",
                officerDetails: null,
                name: "",
            }));
            return;
        }
        
        const officerData = JSON.parse(value);
        
        setFormData(prev => ({
            ...prev,
            selectedOfficerDocId: officerData.docId,
            officerDetails: officerData,
            // Automatically pre-fill the name field from the pre-approved profile
            name: officerData.name, 
        }));
    }

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);
    
    // Utility to convert file to Base64 (for small files only)
    const fileToBase64 = (file) => {
        if (!file) return Promise.resolve(null);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // --- FIRESTORE SAVE LOGIC (UPDATED) ---
// --- FIRESTORE SAVE LOGIC (UPDATED) ---
    const saveUserToFirestore = async (user, role, files = {}) => {
        const landDocBase64 = await fileToBase64(files.landDocument);
        const shopLicenseBase64 = await fileToBase64(files.shopLicense);
        const companyLicenseBase64 = await fileToBase64(files.companyLicense); 
        const companyCertificateBase64 = await fileToBase64(files.companyCertificate); 
        
        // 🚨 CRITICAL CHANGE 1: Set approved based on role (Customer is auto-approved)
        const isApproved = role === "Customer";
        const createdAt = new Date().toISOString();
        
        const baseData = {
            uid: user.uid,
            // Ensure displayName is prioritized if set (e.g., from Google or updateProfile)
            name: user.displayName || formData.name, 
            email: user.email,
            role: role,
            approved: isApproved, // TRUE only for Customer, FALSE for all others
            createdAt: createdAt,
            location: formData.location || "",
        };

        const profileData = {
            ...baseData,
            landDocument: landDocBase64,
            shopLicense: shopLicenseBase64,
            
            companyLicense: companyLicenseBase64,
            companyCertificate: companyCertificateBase64,
            
            companyId: formData.companyId || "",
            companyName: formData.companyName || "",
            // Storing the document ID of the pre-approved profile for reference
            selectedOfficerDocId: formData.selectedOfficerDocId || "", 
            // Storing the Field Officer's pre-approved details (empId, name)
            fieldOfficerId: formData.officerDetails?.empId || "", 
            fieldOfficerName: formData.officerDetails?.name || "", 

            website: formData.website || "",
            productList: formData.productList || "",
        };

        // 1. Save to main 'users' collection
        await setDoc(doc(db, "users", user.uid), baseData);
        
        // 2. Save to role-specific collection (e.g., 'fieldofficers', 'companies', 'customers')
        // For Field Officer, this is the 'fieldofficers' collection using their UID as the Doc ID.
        const roleCollection = getRoleCollection(role);
        await setDoc(doc(db, roleCollection, user.uid), profileData);

        // 3. Update the pre-approved record in the company subcollection (Field Officer only)
        if (role === "Field Officer" && formData.companyId && formData.selectedOfficerDocId) {
            
            const officerDocRef = doc(db, 'companies', formData.companyId, 'field_officers', formData.selectedOfficerDocId);
            
            // 💡 FIX: Use a CLEAN, minimal payload for the subcollection update 
            // This is the CRITICAL change to pass strict security rules 
            // that only allow modifying isRegistered, officerUid, and registeredAt.
            // THIS PREVENTS THE "MISSING PERMISSIONS" ERROR
            await setDoc(officerDocRef, 
                { 
                    isRegistered: true, 
                    officerUid: user.uid, // This stores the actual Firebase Auth UID in the subcollection
                    registeredAt: createdAt 
                }, 
                { merge: true }
            );
        }
        
        return isApproved;
    };


    // --- HANDLER: ACCOUNT CREATION (Direct Signup) ---

    const handleSignup = useCallback(async (e) => {
        e.preventDefault();
        
        const { name, email, password, role, companyId, selectedOfficerDocId, companyLicense, companyCertificate } = formData;
        
        if (!name || !email || !password || !role) {
            triggerToast('error', "Please fill in all required fields (Name, Email, Password, Role).");
            return;
        }

        if (role === "Field Officer" && (!companyId || !selectedOfficerDocId)) {
            triggerToast('error', "Please select a Company and your Field Officer profile ID.");
            return;
        }
        
        if (role === "Company" && (!companyLicense || !companyCertificate)) {
            triggerToast('error', "Company registration requires uploading a License and a Certificate.");
            return;
        }

        if (!agreements.terms || !agreements.privacy) {
            triggerToast('error', "You must agree to the Terms and Privacy Policy.");
            return;
        }
        
        setLoading(true);
        try {
            let userCredential;
            
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.length > 0) {
                // Email exists: Attempt sign-in
                try {
                    userCredential = await signInWithEmailAndPassword(auth, email, password);
                    triggerToast('warning', "Email found. Signing in with existing account to complete registration.");
                } catch (signInError) {
                    if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
                        throw new Error("The email is already registered. Please enter the correct password for this account.");
                    }
                    throw signInError; 
                }
            } else {
                // Email new: Attempt user creation
                try {
                    userCredential = await createUserWithEmailAndPassword(auth, email, password); 
                } catch (createError) {
                    if (createError.code === 'auth/email-already-in-use') {
                        throw new Error("This email was just registered in another session. Please go to the Login page and sign in with your password.");
                    }
                    throw createError;
                }
            }

            const user = userCredential.user;

            if (user.displayName === null || user.displayName === '') {
                 await updateProfile(user, { displayName: name });
            }
            
            // Call saveUserToFirestore and get the approval status
            const isApproved = await saveUserToFirestore(user, role, formData); 

            triggerToast('success', "Signup/Registration successful!");
            
            // 🚨 CRITICAL CHANGE 2: Conditional Redirection
            if (isApproved) {
                // Customer -> Home Page (Auto-approved)
                setTimeout(() => navigate("/"), 2000); 
            } else {
                // Farmer, Seller, FO, Company -> Pending Approval Page (Requires Admin)
                setTimeout(() => navigate("/pending-approval"), 2000); 
            }

        } catch (err) {
            console.error(err);
            let errorMessage = err.message;
            
            if (errorMessage.includes("The email is already registered")) {
                // Keep the custom message
            } else if (errorMessage.includes('Firebase: ')) {
                errorMessage = errorMessage.replace(/Firebase: [a-zA-Z]+\/\S+\s*/, '');
            } else if (err.code === 'permission-denied') { 
                errorMessage = "Registration Failed: Permission denied. Your selected profile ID might be already registered, or there is a security setting issue.";
            }
                
            triggerToast('error', errorMessage || "An unknown error occurred during signup.");
        } finally {
            setLoading(false);
        }
    }, [formData, agreements, setLoading, triggerToast, navigate, saveUserToFirestore]); 

    // --- GOOGLE SIGNUP HANDLERS ---
    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            setGoogleData({ active: true, user: user });
            setFormData(prev => ({
                ...prev,
                email: user.email.toLowerCase(), 
                name: user.displayName || prev.name,
            }));
            
            // Check if user already exists in Firestore users collection
            const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
            if (userDoc.empty) {
                // Proceed to role selection
                triggerToast('info', `Welcome ${user.displayName}. Please select your role to complete registration.`);
            } else {
                // User already has a profile (e.g., already signed up with Google before).
                // Log them in immediately to prevent data duplication.
                const role = userDoc.docs[0].data().role;
                const isApproved = userDoc.docs[0].data().approved;
                
                triggerToast('success', `Welcome back, signing you in as a ${role}.`);
                
                if (isApproved) {
                    setTimeout(() => navigate("/"), 1500); 
                } else {
                    setTimeout(() => navigate("/pending-approval"), 1500); 
                }
                setGoogleData({ active: false, user: null }); // Exit Google-specific flow
            }
            
        } catch (error) {
            console.error("Google Signup Error:", error);
            triggerToast('error', error.message || "Google sign-up failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleDataSubmit = async (e) => {
        e.preventDefault();
        const { role, companyId, selectedOfficerDocId, companyLicense, companyCertificate } = formData;
        const user = auth.currentUser;

        if (!user || !role) {
            triggerToast('error', "User data or role missing.");
            return;
        }

        if (role === "Field Officer" && (!companyId || !selectedOfficerDocId)) {
            triggerToast('error', "Please select a Company and your Field Officer profile ID.");
            return;
        }
        
        if (role === "Company" && (!companyLicense || !companyCertificate)) {
            triggerToast('error', "Company registration requires uploading a License and a Certificate.");
            return;
        }
        
        if (!agreements.terms || !agreements.privacy) {
            triggerToast('error', "You must agree to the Terms and Privacy Policy.");
            return;
        }

        setLoading(true);
        try {
            // Call saveUserToFirestore and get the approval status
            const isApproved = await saveUserToFirestore(user, role, formData); 

            triggerToast('success', "Signup successful! You may now proceed to log in.");
            
            // 🚨 CRITICAL CHANGE 3: Conditional Redirection for Google signup
            if (isApproved) {
                setTimeout(() => navigate("/"), 2000); 
            } else {
                setTimeout(() => navigate("/pending-approval"), 2000); 
            }
            
        } catch (err) {
            console.error(err);
            let errorMessage = err.message;
            if (err.code === 'permission-denied') { 
                errorMessage = "Registration Failed: Permission denied. Your selected profile ID might be already registered, or there is a security setting issue.";
            } else if (errorMessage.includes('Firebase: ')) {
                errorMessage = errorMessage.replace(/Firebase: [a-zA-Z]+\/\S+\s*/, '');
            }
            triggerToast('error', errorMessage || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };
    
    // --- UI RENDER FUNCTIONS (Unchanged) ---
    const renderRoleFiles = () => {
        switch (formData.role) {
            case "Farmer":
                return (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Land Document (optional)</label>
                        <input type="file" name="landDocument" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                    </div>
                );
            case "Seller":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Shop License</label>
                            <input type="file" name="shopLicense" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                        </div>
                    </>
                );
            case "Field Officer":
                return (
                    <>
                        {/* Company Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Select Company</label>
                            <select 
                                name="companyId" 
                                value={formData.companyId}
                                onChange={handleCompanySelect} 
                                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">-- Select Company --</option>
                                {foCheckLoading && <option value="" disabled>Loading companies...</option>}
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Field Officer Profile Dropdown */}
                        {formData.companyId && (
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Select Your ID & Name</label>
                                <select 
                                    name="fieldOfficerProfile" 
                                    value={formData.officerDetails ? JSON.stringify(formData.officerDetails) : ""}
                                    onChange={handleFieldOfficerSelect} 
                                    disabled={foCheckLoading}
                                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">-- Select Your Profile ID --</option>
                                    {foCheckLoading ? (
                                        <option value="" disabled>Loading Field Officers... <FaSpinner className="inline animate-spin"/></option>
                                    ) : (
                                        fieldOfficers.map((fo) => (
                                            <option 
                                                key={fo.docId} 
                                                value={JSON.stringify(fo)}
                                            >
                                                {fo.empId} - {fo.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {formData.selectedOfficerDocId && formData.officerDetails && (
                                    <p className="text-sm text-green-600 flex items-center mt-1">
                                        <FaCheckCircle className="mr-1"/> Profile Selected: **{formData.officerDetails.empId}**
                                    </p>
                                )}
                                {!foCheckLoading && fieldOfficers.length === 0 && (
                                    <p className="text-sm text-red-500 mt-1">No unregistered profiles for this company.</p>
                                )}
                            </div>
                        )}
                    </>
                );
            case "Company":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Company License File*</label>
                            <input type="file" name="companyLicense" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Company Certificate File*</label>
                            <input type="file" name="companyCertificate" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Website</label>
                            <input type="text" name="website" placeholder="Company Website" onChange={handleChange} value={formData.website} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Location</label>
                            <input type="text" name="location" placeholder="Location" onChange={handleChange} value={formData.location} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Product List</label>
                            <textarea name="productList" placeholder="Products offered" onChange={handleChange} value={formData.productList} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const renderFullForm = () => (
        <>
            <form onSubmit={handleSignup} className="space-y-4">
                
                {/* Email field */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Enter email" 
                        onChange={handleChange} 
                        className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.email} 
                    />
                </div>
                
                {/* Password field with toggle */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            placeholder="Enter password" 
                            onChange={handleChange} 
                            className="w-full border rounded-md pr-10 pl-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                            value={formData.password}
                        />
                        {/* Eye icon button */}
                        <button 
                            type="button" 
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 focus:outline-none"
                        >
                            {showPassword ? <FaEyeSlash className="h-5 w-5"/> : <FaEye className="h-5 w-5"/>}
                        </button>
                    </div>
                </div>
                
                {/* Name, Role Fields */}
                {!googleData.active && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                        <input type="text" name="name" placeholder="Enter full name" onChange={handleChange} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" value={formData.name}/>
                    </div>
                )}

                {/* Role for all flows */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Role</label>
                    <select name="role" onChange={handleChange} value={formData.role} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Select Role</option>
                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {renderRoleFiles()}
                
                {/* Terms and Conditions Toggles */}
                <div className="pt-2 space-y-2">
                    <div className="flex items-center">
                        <input id="terms-toggle" type="checkbox" name="terms" checked={agreements.terms} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                        <label htmlFor="terms-toggle" className="ml-2 block text-sm text-gray-900">
                            I agree to the <a href="/terms" target="_blank" className="text-green-600 hover:underline">Terms and Conditions</a>
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input id="privacy-toggle" type="checkbox" name="privacy" checked={agreements.privacy} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                        <label htmlFor="privacy-toggle" className="ml-2 block text-sm text-gray-900">
                            I agree to the <a href="/privacy" target="_blank" className="text-green-600 hover:underline">Privacy Policy</a>
                        </label>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition-all">
                    {loading ? <FaSpinner className="inline animate-spin mr-2"/> : "Sign Up"}
                </button>
                <div className="mt-4 text-center">
                    <button type="button" onClick={handleGoogleSignup} className="w-full border border-gray-400 py-2 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-5 h-5"/>
                        Sign up with Google
                    </button>
                </div>
            </form>
        </>
    );

    const renderGoogleDataForm = () => (
        <form onSubmit={handleGoogleDataSubmit} className="space-y-4">
            <p className="text-center text-gray-700 mb-4">Welcome **{googleData.user.displayName}**, complete your signup</p>
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Role</label>
                <select name="role" onChange={handleChange} value={formData.role} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select Role</option>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            {renderRoleFiles()}
            
            <div className="pt-2 space-y-2">
                <div className="flex items-center">
                    <input id="terms-toggle-google" type="checkbox" name="terms" checked={agreements.terms} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                    <label htmlFor="terms-toggle-google" className="ml-2 block text-sm text-gray-900">
                        I agree to the <a href="/terms" target="_blank" className="text-green-600 hover:underline">Terms and Conditions</a>
                    </label>
                </div>
                <div className="flex items-center">
                    <input id="privacy-toggle-google" type="checkbox" name="privacy" checked={agreements.privacy} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                    <label htmlFor="privacy-toggle-google" className="ml-2 block text-sm text-gray-900">
                        I agree to the <a href="/privacy" target="_blank" className="text-green-600 hover:underline">Privacy Policy</a>
                    </label>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition-all">
                {loading ? <FaSpinner className="inline animate-spin mr-2"/> : "Complete Signup"}
            </button>
        </form>
    );


    const renderContent = () => {
        if (googleData.active) {
            return renderGoogleDataForm();
        }
        
        return renderFullForm(); 
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 via-emerald-200 to-green-300 py-20">
            <div className="fixed top-0 left-0 w-full z-50 shadow-md bg-white">
                <Navbar />
            </div>

            <motion.div
                className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md mt-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-3xl font-bold text-center text-green-700 mb-6">
                    Create Account
                </h2>

                {renderContent()}

                <p className="mt-6 text-center text-gray-700 text-sm">
                    Already have an account?{" "}
                    <span className="text-green-700 font-semibold cursor-pointer hover:underline" onClick={() => navigate("/login")}>Login</span>
                </p>
            </motion.div>
            
            <Toast toast={toast} setToast={setToast} />

        </div>
    );
};

export default Signup;