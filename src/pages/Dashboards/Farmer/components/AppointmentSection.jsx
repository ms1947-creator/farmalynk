import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../../firebaseconfig';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  FaCalendarPlus,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMicrophone,
  FaStop,
} from 'react-icons/fa';

function AppointmentSection({ farmerId, farmerData }) {
  const [date, setDate] = useState('');
  const [crop, setCrop] = useState(farmerData.crops?.[0] || '');
  const [issue, setIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const retryTimer = useRef(null);
  const retryCount = useRef(0);

  // Cloudinary config
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dyvxz9dwm/upload';
  const UPLOAD_PRESET = 'voice_message';

  // Setup Firestore listener
  const setupRealtimeListener = () => {
    if (!farmerId) return;

    const q = query(
      collection(db, 'appointments'),
      where('farmerId', '==', farmerId),
      orderBy('requestedAt', 'desc')
    );

    try {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            requestedAt:
              doc.data().requestedAt?.toDate().toLocaleString() || 'N/A',
          }));
          setAppointments(fetched);
          setLoading(false);
          setError('');
          setConnectionStatus('Connected');
          retryCount.current = 0;
        },
        async (err) => {
          console.error('Snapshot error:', err);
          setConnectionStatus('Connection lost. Retrying...');
          retryCount.current += 1;

          // fallback fetch
          try {
            const snap = await getDocs(q);
            const fetched = snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              requestedAt:
                doc.data().requestedAt?.toDate().toLocaleString() || 'N/A',
            }));
            setAppointments(fetched);
          } catch (fetchErr) {
            console.error('Fallback fetch failed:', fetchErr);
          }

          // exponential backoff retry
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(() => {
            setupRealtimeListener();
          }, Math.min(30000, 2000 * retryCount.current));
        }
      );

      return unsubscribe;
    } catch (e) {
      console.error('Listener setup failed:', e);
      setConnectionStatus('Failed to connect. Retrying...');
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(setupRealtimeListener, 5000);
    }
  };

  useEffect(() => {
    const unsubscribe = setupRealtimeListener();
    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(retryTimer.current);
    };
  }, [farmerId]);

  // Start recording
  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      alert('Your browser does not support audio recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunks = [];
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed:', err);
      alert('Failed to access microphone.');
    }
  };

  // Stop recording and upload
  const stopRecordingAndUpload = async () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setIsRecording(false);

    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'samples/ecommerce');

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setSuccess('Voice message uploaded successfully.');
        await addDoc(collection(db, 'appointments'), {
          farmerId,
          farmerName: farmerData.name,
          requestedDate: date,
          crop,
          issue: issue.trim() || 'Voice message',
          audioUrl: data.secure_url,
          region: farmerData.location, // added region for officer filtering
          status: 'Pending',
          requestedAt: serverTimestamp(),
        });
        setDate('');
        setCrop(farmerData.crops?.[0] || '');
        setIssue('');
        setAudioBlob(null);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      setError('Failed to upload voice message. Try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !crop || (!issue.trim() && !audioBlob)) {
      setError('Please fill out all fields or record a voice message.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!audioBlob) {
        await addDoc(collection(db, 'appointments'), {
          farmerId,
          farmerName: farmerData.name,
          requestedDate: date,
          crop,
          issue: issue.trim(),
          region: farmerData.location,
          status: 'Pending',
          requestedAt: serverTimestamp(),
        });
        setDate('');
        setCrop(farmerData.crops?.[0] || '');
        setIssue('');
        setSuccess('Appointment requested successfully!');
      }
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 NEW FEATURE: Farmer marks visit as completed
  const handleMarkCompleted = async (appointmentId) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'Completed',
        completedAt: serverTimestamp(),
      });
      setSuccess('Visit marked as completed!');
    } catch (err) {
      console.error('Error marking completed:', err);
      setError('Failed to update. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1" /> Request Sent
          </span>
        );
      case 'Approved':
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            <FaCheckCircle className="mr-1" /> Accepted
          </span>
        );
      case 'Completed':
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> Completed
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Request Form */}
      <div className="md:col-span-1 p-6 bg-white rounded-xl shadow-lg border border-green-200 h-fit sticky top-0">
        <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
          <FaCalendarPlus className="mr-2" /> Schedule Visit
        </h3>

        {error && (
          <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 text-sm font-medium text-green-700 bg-green-100 rounded-lg flex items-center">
            <FaCheckCircle className="mr-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Preferred Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Crop
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition"
              required
            >
              {farmerData.crops?.length > 0 ? (
                farmerData.crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              ) : (
                <option value="">No crops listed</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Issue Details
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows="4"
              placeholder="Describe the problem (typed) or record voice message"
              className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          {/* Voice recording buttons */}
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex-1 flex justify-center items-center px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              >
                <FaMicrophone className="mr-2" /> Record Voice Message
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecordingAndUpload}
                className="flex-1 flex justify-center items-center px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                <FaStop className="mr-2" /> Stop & Send
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !date || !crop || (!issue.trim() && !audioBlob)}
            className="w-full flex justify-center items-center px-4 py-3 text-base font-semibold rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Sending Request...
              </>
            ) : (
              'Submit Appointment Request'
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Appointment History */}
      <div className="md:col-span-2 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 border-b pb-3">
          Your Appointment History ({appointments.length})
        </h3>
        <p className="text-xs text-gray-500 mb-4">{connectionStatus}</p>

        {loading && (
          <p className="text-center py-8 text-lg text-gray-500">
            <FaSpinner className="animate-spin inline mr-2" /> Fetching history...
          </p>
        )}

        {!loading && appointments.length === 0 && (
          <p className="text-gray-500 italic py-8 text-center">
            You haven't requested any appointments yet.
          </p>
        )}

        <div className="space-y-4">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-sm transition duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-green-700">
                  {app.crop}
                </span>
                {getStatusBadge(app.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 border-t pt-2 mt-2">
                <div>
                  <p>
                    <span className="font-semibold">Visit Date:</span>{' '}
                    {app.requestedDate}
                  </p>
                  <p>
                    <span className="font-semibold">Issue:</span> {app.issue}
                  </p>
                  {app.audioUrl && (
                    <div className="mt-2">
                      <span className="font-semibold">Voice Message:</span>
                      <audio
                        controls
                        src={app.audioUrl}
                        className="mt-1 w-full"
                      />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p>
                    <span className="font-semibold">Requested On:</span>{' '}
                    {app.requestedAt}
                  </p>
                  {app.officerName && (
                    <p className="font-semibold text-blue-700">
                      Officer: {app.officerName}
                    </p>
                  )}
                  {app.officerEmail && (
                    <p className="text-blue-500">{app.officerEmail}</p>
                  )}
                  {app.officerPhone && (
                    <p className="text-gray-700">{app.officerPhone}</p>
                  )}

                  {/* ✅ NEW BUTTON for Farmer to mark completed */}
                  {app.status === 'Approved' && (
                    <button
                      onClick={() => handleMarkCompleted(app.id)}
                      className="mt-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppointmentSection;
