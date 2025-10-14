// src/pages/Dashboards/Company/OfficersTab.jsx
import React, { useState, useEffect, useRef } from "react";
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    updateDoc, 
    serverTimestamp,
} from "firebase/firestore";
import * as XLSX from 'xlsx';
import { db } from "../../../firebaseconfig";

// NOTE: The subcollection name used here MUST match your Firestore structure ('field_officers')
const OFFICERS_SUBCOLLECTION = "field_officers"; 

// =========================================================================
// 1. ADD SINGLE OFFICER FORM COMPONENT
// =========================================================================
const AddSingleOfficerForm = ({ companyId, setFieldOfficers, fieldOfficers, showToast }) => {
    const [officerData, setOfficerData] = useState({ name: "", empId: "", email: "", phone: "", location: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setOfficerData({ ...officerData, [e.target.name]: e.target.value });

    const handleAddOfficer = async () => {
        const { name, empId } = officerData;
        if (!name.trim() || !empId.trim()) {
            showToast("Name and Employee ID are required.", "error");
            return;
        }

        setLoading(true);
        try {
            // ⭐ FIX 1: Using 'field_officers' subcollection based on your data structure
            const officersCol = collection(db, "companies", companyId, OFFICERS_SUBCOLLECTION);
            
            const dataToSave = { 
                ...officerData, 
                empId: empId.trim(), 
                createdAt: serverTimestamp(), 
                completedAppointments: 0,
                // ✅ CRITICAL ADDITION: isRegistered: false for signup filter
                isRegistered: false, 
                officerUid: null // Placeholder for the actual Firebase user UID after signup
            };
            
            const docRef = await addDoc(officersCol, dataToSave);
            setFieldOfficers([...fieldOfficers, { id: docRef.id, ...dataToSave }]);
            setOfficerData({ name: "", empId: "", email: "", phone: "", location: "" });
            showToast(`Field officer ${empId} added successfully`);
        } catch (err) {
            console.error("Error adding field officer:", err);
            showToast("Failed to add field officer. Check console for details.", "error");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "border rounded px-3 py-2 w-full";

    return (
        <div className="border p-6 rounded-lg bg-gray-50 space-y-4">
            <h3 className="text-xl font-medium mb-4">Enter Officer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Name *</label>
                    <input type="text" name="name" value={officerData.name} onChange={handleChange} placeholder="e.g., John Doe" className={inputClasses} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Employee ID * (Company Assigned)</label>
                    <input type="text" name="empId" value={officerData.empId} onChange={handleChange} placeholder="e.g., C-101" className={inputClasses} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={officerData.email} onChange={handleChange} placeholder="john@company.com" className={inputClasses} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" name="phone" value={officerData.phone} onChange={handleChange} placeholder="9876543210" className={inputClasses} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <input type="text" name="location" value={officerData.location} onChange={handleChange} placeholder="e.g., New Delhi" className={inputClasses} />
                </div>
            </div>
            <button
                onClick={handleAddOfficer}
                disabled={loading || !officerData.name.trim() || !officerData.empId.trim()}
                className="w-full mt-4 px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition disabled:opacity-50"
            >
                {loading ? 'Adding Officer...' : 'Add Officer'}
            </button>
        </div>
    );
};

// =========================================================================
// 2. EXCEL UPLOAD COMPONENT
// =========================================================================
const ExcelUploadForm = ({ companyId, setFieldOfficers, fieldOfficers, showToast }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async () => {
        if (!file) { showToast("Please select an Excel file.", "error"); return; }

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonOfficers = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonOfficers.length < 2) { showToast("File is empty or only contains headers.", "error"); setLoading(false); return; }

                const [header, ...rows] = jsonOfficers;
                const newOfficers = [];
                const errors = [];

                for (const row of rows) {
                    const officer = {
                        name: row[1] ? String(row[1]).trim() : '',
                        empId: row[0] ? String(row[0]).trim() : '',
                        email: row[2] ? String(row[2]).trim() : '',
                        phone: row[3] ? String(row[3]).trim() : '',
                        location: row[4] ? String(row[4]).trim() : '',
                        createdAt: serverTimestamp(),
                        completedAppointments: 0,
                        // ✅ CRITICAL ADDITION: isRegistered: false for signup filter
                        isRegistered: false,
                        officerUid: null
                    };
                    // Ensure the order of columns in the Excel file matches the indices:
                    // Col 0: empId, Col 1: name, Col 2: email, Col 3: phone, Col 4: location
                    if (officer.name && officer.empId) newOfficers.push(officer);
                    else errors.push(`Row missing Name or Employee ID: ${row.join(', ')}`);
                }

                if (newOfficers.length === 0) { showToast("No valid officer data found.", "error"); setLoading(false); return; }

                // ⭐ FIX 2: Using 'field_officers' subcollection based on your data structure
                const officersCol = collection(db, "companies", companyId, OFFICERS_SUBCOLLECTION);
                const savedOfficers = [];
                for (const officerData of newOfficers) {
                    const docRef = await addDoc(officersCol, officerData);
                    savedOfficers.push({ id: docRef.id, ...officerData });
                }

                setFieldOfficers([...fieldOfficers, ...savedOfficers]);
                showToast(`Successfully added ${savedOfficers.length} field officers.`, "success");
                if (errors.length > 0) showToast(`Warning: ${errors.length} row(s) skipped. Check console.`, "warning");
                setFile(null);
            } catch (err) {
                console.error(err);
                showToast("Failed to process Excel file.", "error");
            } finally { setLoading(false); }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="border p-6 rounded-lg bg-indigo-50 space-y-4">
            <h3 className="text-xl font-medium mb-3 text-indigo-800">Bulk Import (Excel/CSV)</h3>
            <p className="text-sm text-gray-600">Upload a file with columns: Employee ID, Name, Email, Phone, Location (in that order)</p>
            <div className="flex gap-3 items-center">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="p-2 border rounded bg-white text-sm" disabled={loading} />
                <button onClick={handleUpload} disabled={loading || !file} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50">{loading ? 'Processing...' : 'Upload & Add Officers'}</button>
            </div>
        </div>
    );
};

// =========================================================================
// 3. MANAGE OFFICERS LIST
// =========================================================================
const ManageOfficersList = ({ fieldOfficers, handleDeleteOfficer, handleUpdateOfficer, showToast }) => {
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const startEdit = (officer) => {
        setEditingId(officer.id);
        setEditData({ name: officer.name, empId: officer.empId, email: officer.email, phone: officer.phone, location: officer.location });
    };

    const saveEdit = async () => {
        if (!editData.name || !editData.empId) { showToast("Name and Employee ID are required.", "error"); return; }
        await handleUpdateOfficer(editingId, editData);
        setEditingId(null);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-medium mb-4">Existing Officers ({fieldOfficers.length})</h3>
            {fieldOfficers.length === 0 ? (
                <p className="text-gray-600 p-4 border rounded">No field officers added yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* Added 'Registered' column to track signup status */}
                                {['Name', 'Employee ID', 'Email', 'Phone', 'Location', 'Completed', 'Registered', 'Actions'].map((header) => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {fieldOfficers.map((o) => (
                                <tr key={o.id}>
                                    {editingId === o.id ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="border rounded px-1 w-full" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editData.empId} onChange={e => setEditData({ ...editData, empId: e.target.value })} className="border rounded px-1 w-full" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="border rounded px-1 w-full" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="tel" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="border rounded px-1 w-full" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} className="border rounded px-1 w-full" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.completedAppointments || 0}</td>
                                            {/* Display Registered Status (Non-Editable) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {o.isRegistered ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-500">No</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-900 mr-2">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-900">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{o.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-indigo-700 font-mono">{o.empId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.email || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.phone || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.location || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.completedAppointments || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {/* Display Yes/No based on the isRegistered boolean */}
                                                {o.isRegistered ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-500">No</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => startEdit(o)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                                                <button onClick={() => handleDeleteOfficer(o.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// =========================================================================
// 4. MAIN OFFICERSTAB COMPONENT
// =========================================================================
export default function OfficersTab({ companyId, fieldOfficers, setFieldOfficers, showToast, appointments }) {
    const [activeTab, setActiveTab] = useState('manage');
    const countedAppointmentsRef = useRef(new Set());

    const handleDeleteOfficer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this field officer?")) return;
        try {
            // ⭐ FIX 3: Using 'field_officers' subcollection
            await deleteDoc(doc(db, "companies", companyId, OFFICERS_SUBCOLLECTION, id));
            setFieldOfficers(fieldOfficers.filter(o => o.id !== id));
            showToast("Field officer deleted successfully", "success");
        } catch (err) {
            console.error(err);
            showToast(`Deletion Failed! ${err.message}`, "error");
        }
    };

    const handleUpdateOfficer = async (id, updatedFields) => {
        try {
            // ⭐ FIX 4: Using 'field_officers' subcollection
            const officerRef = doc(db, "companies", companyId, OFFICERS_SUBCOLLECTION, id);
            
            // Only update fields that should be editable by the company (exclude isRegistered here)
            const fieldsToUpdate = { ...updatedFields };
            // Ensure the critical registration status cannot be modified by the dashboard edit form
            delete fieldsToUpdate.isRegistered; 
            
            await updateDoc(officerRef, { ...fieldsToUpdate, updatedAt: serverTimestamp() });
            
            // Update local state without losing registration status if not in updatedFields
            setFieldOfficers(fieldOfficers.map(o => o.id === id ? { ...o, ...fieldsToUpdate } : o));
            showToast("Field officer updated successfully");
        } catch (err) {
            console.error(err);
            showToast("Failed to update field officer.", "error");
        }
    };

    // ======================== NEW FEATURE: COMPLETED COUNTER ========================
    useEffect(() => {
        if (!appointments || fieldOfficers.length === 0) return;
        
        // Use a map for efficient lookups by officer ID
        const officerMap = new Map(fieldOfficers.map(o => [o.id, { ...o, completedAppointments: o.completedAppointments || 0 }]));
        
        appointments.forEach(a => {
            if (a.status === 'completed' && a.assignedFieldOfficerId) {
                const key = `${a.id}-${a.assignedFieldOfficerId}`;
                
                if (!countedAppointmentsRef.current.has(key)) {
                    const officer = officerMap.get(a.assignedFieldOfficerId);
                    if (officer) {
                        officer.completedAppointments = (officer.completedAppointments || 0) + 1; // Increment count
                        officerMap.set(a.assignedFieldOfficerId, officer);
                        countedAppointmentsRef.current.add(key);
                    }
                }
            }
        });
        
        // Convert map values back to an array for the state update
        setFieldOfficers(Array.from(officerMap.values()));
        
    }, [appointments]); 

    const renderContent = () => {
        switch (activeTab) {
            case 'single': return <AddSingleOfficerForm companyId={companyId} fieldOfficers={fieldOfficers} setFieldOfficers={setFieldOfficers} showToast={showToast} />;
            case 'bulk': return <ExcelUploadForm companyId={companyId} fieldOfficers={fieldOfficers} setFieldOfficers={setFieldOfficers} showToast={showToast} />;
            case 'manage': return <ManageOfficersList fieldOfficers={fieldOfficers} handleDeleteOfficer={handleDeleteOfficer} handleUpdateOfficer={handleUpdateOfficer} showToast={showToast} />;
            default: return <p>Select an option.</p>;
        }
    };

    const tabStyles = (tabName) => `px-4 py-2 text-sm font-medium border-b-2 cursor-pointer transition ${activeTab === tabName ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

    return (
        <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">🧑‍💼 Field Officer Management</h2>
            <div className="flex border-b border-gray-200 -mb-px">
                <div className={tabStyles('single')} onClick={() => setActiveTab('single')}>➕ Add Single Officer</div>
                <div className={tabStyles('bulk')} onClick={() => setActiveTab('bulk')}>📤 Bulk Upload (Excel)</div>
                <div className={tabStyles('manage')} onClick={() => setActiveTab('manage')}>📋 Manage Officers</div>
            </div>
            <div className="pt-4">{renderContent()}</div>
        </section>
    );
}