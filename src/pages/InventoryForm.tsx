import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import DocumentScanner from '../components/DocumentScanner';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

export default function InventoryForm() {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isAdminMode = searchParams.get('admin') === 'true'; // Check if admin is creating
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('');
  const [existingDocumentUrls, setExistingDocumentUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', middleInitial: '', programYear: '', birthDate: '',
    idNo: '', gender: '', ethnicity: '', religion: '', civilStatus: '',
    mobilePhone: '', personalEmail: '', institutionalEmail: '',
    permanentAddress: '', currentAddress: '', spouseAge: '', spouseName: '',
    spouseOccupation: '', spouseContactNumber: '', isWorking: false,
    workingStatus: '', occupation: '', motherName: '', motherAge: '',
    motherEthnicity: '', motherEducation: '', motherOccupation: '',
    motherCompany: '', motherIncome: '', motherContact: '', fatherName: '',
    fatherAge: '', fatherEthnicity: '', fatherEducation: '', fatherOccupation: '',
    fatherCompany: '', fatherIncome: '', fatherContact: '', parentsStatus: '',
    numberOfSiblings: '', guardianName: '', guardianAddress: '', hobbies: '',
    talents: '', sports: '', socioCivic: '', schoolOrg: '', hospitalized: '',
    hospitalizationReason: '', surgery: '', surgeryReason: '', chronicIllness: '',
    familyIllness: '', lastDoctorVisit: '', visitReason: '',
    lifeCircumstances: [] as string[], counselorRemarks: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  // Enable session timeout protection (always call hook, but it checks isAdminMode internally)
  useSessionTimeout();

  useEffect(() => {
    // Skip auth check if admin is creating
    if (isAdminMode) return;
    
    // Verify authentication on component mount
    const verifyAuth = async () => {
      await checkAuth();
      if (!user) {
        navigate('/login');
        return;
      }
    };
    verifyAuth();
  }, [isAdminMode]);

  useEffect(() => {
    if (editId && (user || isAdminMode)) {
      loadExistingSubmission(editId);
    }
  }, [editId, user, isAdminMode]);

  const loadExistingSubmission = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setIsEditMode(true);
        
        // Merge existing data with default form structure to ensure all fields exist
        const loadedFormData = data.form_data || {};
        setFormData({
          lastName: loadedFormData.lastName || '',
          firstName: loadedFormData.firstName || '',
          middleInitial: loadedFormData.middleInitial || '',
          programYear: loadedFormData.programYear || '',
          birthDate: loadedFormData.birthDate || '',
          idNo: loadedFormData.idNo || '',
          gender: loadedFormData.gender || '',
          ethnicity: loadedFormData.ethnicity || '',
          religion: loadedFormData.religion || '',
          civilStatus: loadedFormData.civilStatus || '',
          mobilePhone: loadedFormData.mobilePhone || '',
          personalEmail: loadedFormData.personalEmail || '',
          institutionalEmail: loadedFormData.institutionalEmail || '',
          permanentAddress: loadedFormData.permanentAddress || '',
          currentAddress: loadedFormData.currentAddress || '',
          spouseAge: loadedFormData.spouseAge || '',
          spouseName: loadedFormData.spouseName || '',
          spouseOccupation: loadedFormData.spouseOccupation || '',
          spouseContactNumber: loadedFormData.spouseContactNumber || '',
          isWorking: loadedFormData.isWorking || false,
          workingStatus: loadedFormData.workingStatus || '',
          occupation: loadedFormData.occupation || '',
          motherName: loadedFormData.motherName || '',
          motherAge: loadedFormData.motherAge || '',
          motherEthnicity: loadedFormData.motherEthnicity || '',
          motherEducation: loadedFormData.motherEducation || '',
          motherOccupation: loadedFormData.motherOccupation || '',
          motherCompany: loadedFormData.motherCompany || '',
          motherIncome: loadedFormData.motherIncome || '',
          motherContact: loadedFormData.motherContact || '',
          fatherName: loadedFormData.fatherName || '',
          fatherAge: loadedFormData.fatherAge || '',
          fatherEthnicity: loadedFormData.fatherEthnicity || '',
          fatherEducation: loadedFormData.fatherEducation || '',
          fatherOccupation: loadedFormData.fatherOccupation || '',
          fatherCompany: loadedFormData.fatherCompany || '',
          fatherIncome: loadedFormData.fatherIncome || '',
          fatherContact: loadedFormData.fatherContact || '',
          parentsStatus: loadedFormData.parentsStatus || '',
          numberOfSiblings: loadedFormData.numberOfSiblings || '',
          guardianName: loadedFormData.guardianName || '',
          guardianAddress: loadedFormData.guardianAddress || '',
          hobbies: loadedFormData.hobbies || '',
          talents: loadedFormData.talents || '',
          sports: loadedFormData.sports || '',
          socioCivic: loadedFormData.socioCivic || '',
          schoolOrg: loadedFormData.schoolOrg || '',
          hospitalized: loadedFormData.hospitalized || '',
          hospitalizationReason: loadedFormData.hospitalizationReason || '',
          surgery: loadedFormData.surgery || '',
          surgeryReason: loadedFormData.surgeryReason || '',
          chronicIllness: loadedFormData.chronicIllness || '',
          familyIllness: loadedFormData.familyIllness || '',
          lastDoctorVisit: loadedFormData.lastDoctorVisit || '',
          visitReason: loadedFormData.visitReason || '',
          lifeCircumstances: loadedFormData.lifeCircumstances || [],
          counselorRemarks: loadedFormData.counselorRemarks || '',
        });
        
        setExistingPhotoUrl(data.photo_url);
        setPhotoPreview(data.photo_url);
        setExistingDocumentUrls(loadedFormData.documentUrls || []);
      }
    } catch (err: any) {
      setError('Failed to load submission: ' + err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'isWorking') {
        setFormData({ ...formData, [name]: checked });
      } else {
        const currentCircumstances = formData.lifeCircumstances;
        if (checked) {
          setFormData({ ...formData, lifeCircumstances: [...currentCircumstances, value] });
        } else {
          setFormData({ ...formData, lifeCircumstances: currentCircumstances.filter(item => item !== value) });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // In edit mode, photo is optional if already exists
    if (!isEditMode && !photoFile) {
      setError('Please upload a photo');
      setLoading(false);
      return;
    }

    // In edit mode, documents are optional if already exist
    // Documents are now optional for all submissions
    // if (!isEditMode && documentFiles.length !== 4) {
    //   setError('Please upload all 4 required documents');
    //   setLoading(false);
    //   return;
    // }

    try {
      let photoUrl = existingPhotoUrl;
      let uploadedDocUrls = existingDocumentUrls;

      // Generate user ID for admin mode
      const userId = isAdminMode ? '00000000-0000-0000-0000-000000000000' : user?.id;

      // Upload new photo if provided
      if (photoFile) {
        setError('📤 Uploading photo...');
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Upload new documents if provided (parallel upload for speed)
      if (documentFiles.length > 0) {
        setError(`📤 Uploading ${documentFiles.length} document(s)...`);
        uploadedDocUrls = [];
        
        // Upload all documents in parallel for faster processing
        const uploadPromises = documentFiles.map(async (docFile, i) => {
          const docExt = docFile.name.split('.').pop();
          const docFileName = `${userId}_doc${i + 1}_${Date.now()}_${Math.random().toString(36).substring(7)}.${docExt}`;
          
          const { error: docUploadError } = await supabase.storage
            .from('student-photos')
            .upload(docFileName, docFile);

          if (docUploadError) throw docUploadError;

          const { data: { publicUrl: docUrl } } = supabase.storage
            .from('student-photos')
            .getPublicUrl(docFileName);

          return docUrl;
        });

        // Wait for all uploads to complete
        uploadedDocUrls = await Promise.all(uploadPromises);
      }

      setError('💾 Saving to database...');

      const submissionData = {
        user_id: userId,
        student_id: formData.idNo,
        full_name: `${formData.firstName} ${formData.middleInitial} ${formData.lastName}`,
        course: formData.programYear,
        year_level: formData.programYear.split(' ')[0] || '',
        contact_number: formData.mobilePhone,
        photo_url: photoUrl,
        form_data: { ...formData, documentUrls: uploadedDocUrls },
        google_form_response_id: '',
      };

      if (isEditMode && editId) {
        // Update existing submission
        const { error: dbError } = await supabase
          .from('inventory_submissions')
          .update(submissionData)
          .eq('id', editId);

        if (dbError) throw dbError;
        alert('✅ Submission updated successfully!');
      } else {
        // Create new submission
        const { error: dbError } = await supabase
          .from('inventory_submissions')
          .insert(submissionData);

        if (dbError) throw dbError;
        alert('✅ Form submitted successfully!');
      }

      // Navigate back based on mode
      if (isAdminMode) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-blue-600">NBSC</span>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">
                    {isAdminMode ? 'ADMIN - ADD NEW STUDENT' : 'NORTHERN BUKIDNON STATE COLLEGE'}
                  </h1>
                  <p className="text-sm text-blue-100">GUIDANCE AND COUNSELING OFFICE</p>
                </div>
              </div>
              <button
                onClick={() => navigate(isAdminMode ? '/admin' : '/dashboard')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm border border-white/30"
              >
                ← Back
              </button>
            </div>
          </div>
          
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {isEditMode ? '✏️ Edit Inventory Form' : '📝 Individual Inventory Form'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEditMode ? 'Update your information below' : 'Please fill out all required fields accurately'}
                </p>
              </div>
              {isEditMode && (
                <div className="px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">Edit Mode</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Progress</h3>
              <span className="text-sm text-gray-500">Section {currentSection} of 3</span>
            </div>
            <div className="flex gap-3">
              {[
                { num: 1, label: 'Basic Info' },
                { num: 2, label: 'Family' },
                { num: 3, label: 'Health & Interests' }
              ].map((section) => (
                <button
                  key={section.num}
                  type="button"
                  onClick={() => setCurrentSection(section.num)}
                  className={`flex-1 group relative overflow-hidden rounded-xl transition-all duration-300 ${
                    currentSection === section.num
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : currentSection > section.num
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="px-4 py-3 flex items-center justify-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentSection === section.num
                        ? 'bg-white/20'
                        : currentSection > section.num
                        ? 'bg-green-200'
                        : 'bg-gray-200'
                    }`}>
                      {currentSection > section.num ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        section.num
                      )}
                    </div>
                    <span className="font-semibold text-sm">{section.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form 
            onSubmit={handleSubmit} 
            onKeyDown={(e) => {
              // Prevent Enter key from submitting form unless on submit button
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >

            {/* Section 1: Basic Information */}
            {currentSection === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-blue-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Basic Information</h3>
                    <p className="text-sm text-gray-500">Personal details and contact information</p>
                  </div>
                </div>
                
                {/* Photo Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Photo (2x2) {isEditMode && '(Optional - leave empty to keep current photo)'}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                    className="block w-full text-sm" 
                    required={!isEditMode} 
                  />
                  {photoPreview && <img src={photoPreview} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-lg" />}
                </div>

                {/* Document Scanner */}
                <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                  <h4 className="text-md font-bold text-gray-800 mb-4">
                    📄 Documents (Optional - Up to 4)
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    You can upload these documents now or later:
                  </p>
                  <ul className="text-sm text-gray-700 mb-4 space-y-1">
                    <li>1. WHODAS 2.0 Form</li>
                    <li>2. Individual Inventory Form</li>
                    <li>3. PID-5-BF Form</li>
                    <li>4. Counseling Consent Form</li>
                  </ul>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-4">
                    ℹ️ Don't have the documents yet? You can submit the form now and upload them later by editing your submission.
                  </p>
                  <DocumentScanner
                    onDocumentsChange={setDocumentFiles}
                    maxDocuments={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">M.I.</label>
                    <input type="text" name="middleInitial" value={formData.middleInitial} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" maxLength={1} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program & Year</label>
                    <input type="text" name="programYear" value={formData.programYear} onChange={handleChange} placeholder="e.g., BSIT - First year" className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID No.</label>
                    <input type="text" name="idNo" value={formData.idNo} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                    <input type="text" name="ethnicity" value={formData.ethnicity} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                    <input type="text" name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                    <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required>
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mt-6">
                  <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact Information
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Phone</label>
                    <input type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
                    <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institutional Email</label>
                  <input type="email" name="institutionalEmail" value={formData.institutionalEmail} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                  <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" rows={2} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                  <textarea name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" rows={2} />
                </div>
              </div>
            )}

            {/* Section 2: Family Background */}
            {currentSection === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-purple-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Family Background</h3>
                    <p className="text-sm text-gray-500">Information about your family members</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mt-6">
                  <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Mother's Profile
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age and Birthday</label>
                    <input type="text" name="motherAge" value={formData.motherAge} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                    <input type="text" name="motherEthnicity" value={formData.motherEthnicity} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Educational Attainment</label>
                    <input type="text" name="motherEducation" value={formData.motherEducation} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" name="motherCompany" value={formData.motherCompany} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                    <input type="text" name="motherIncome" value={formData.motherIncome} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="tel" name="motherContact" value={formData.motherContact} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mt-6">
                  <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Father's Profile
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age and Birthday</label>
                    <input type="text" name="fatherAge" value={formData.fatherAge} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                    <input type="text" name="fatherEthnicity" value={formData.fatherEthnicity} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Educational Attainment</label>
                    <input type="text" name="fatherEducation" value={formData.fatherEducation} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" name="fatherCompany" value={formData.fatherCompany} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                    <input type="text" name="fatherIncome" value={formData.fatherIncome} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="tel" name="fatherContact" value={formData.fatherContact} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mt-6">
                  <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Parents Status
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status of Parents</label>
                    <select name="parentsStatus" value={formData.parentsStatus} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Select</option>
                      <option value="Living Together">Living Together</option>
                      <option value="Single Parent">Single Parent</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced/Annulled">Divorced/Annulled</option>
                      <option value="Widowed/Widower">Widowed/Widower</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Siblings</label>
                    <input type="number" name="numberOfSiblings" value={formData.numberOfSiblings} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name of Guardian/s</label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address of Guardian/s</label>
                  <textarea name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" rows={2} />
                </div>
              </div>
            )}

            {/* Section 3: Interests, Health & Life Circumstances */}
            {currentSection === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Interests, Health & Life Circumstances</h3>
                    <p className="text-sm text-gray-500">Your hobbies, health status, and current concerns</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hobbies</label>
                    <input type="text" name="hobbies" value={formData.hobbies} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Talents</label>
                    <input type="text" name="talents" value={formData.talents} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sports</label>
                    <input type="text" name="sports" value={formData.sports} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Socio-civic</label>
                    <input type="text" name="socioCivic" value={formData.socioCivic} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Organizations</label>
                  <input type="text" name="schoolOrg" value={formData.schoolOrg} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 mt-8">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Health Information
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Have you ever been hospitalized?</label>
                    <select name="hospitalized" value={formData.hospitalized} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input type="text" name="hospitalizationReason" value={formData.hospitalizationReason} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Have you ever undergone operation?</label>
                    <select name="surgery" value={formData.surgery} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input type="text" name="surgeryReason" value={formData.surgeryReason} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Do you currently suffer from any illness?</label>
                  <input type="text" name="chronicIllness" value={formData.chronicIllness} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Common illness in the family</label>
                  <input type="text" name="familyIllness" value={formData.familyIllness} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">When did you last visit the doctor?</label>
                    <input type="text" name="lastDoctorVisit" value={formData.lastDoctorVisit} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for the visit</label>
                    <input type="text" name="visitReason" value={formData.visitReason} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mt-8">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Life Circumstances
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Check any of the PROBLEMS below that currently concerns you:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Grief', 'Self-confidence', 'Academic Performance', 'Career', 'Financial', 'Stress', 'Anger',
                    'Relationships with:', 'Father', 'Mother', 'Siblings', 'Teachers', 'Loneliness'
                  ].map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={item}
                        checked={formData.lifeCircumstances.includes(item)}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counselor's Remarks</label>
                  <textarea name="counselorRemarks" value={formData.counselorRemarks} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" rows={4} placeholder="For counselor use only" />
                </div>
              </div>
            )}

            {error && (
              <div className={`border-l-4 p-4 rounded-lg flex items-start gap-3 ${
                error.includes('📤') || error.includes('💾') 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'bg-red-50 border-red-500'
              }`}>
                <svg className={`w-6 h-6 flex-shrink-0 ${
                  error.includes('📤') || error.includes('💾') 
                    ? 'text-blue-500' 
                    : 'text-red-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className={`font-medium ${
                    error.includes('📤') || error.includes('💾') 
                      ? 'text-blue-800' 
                      : 'text-red-800'
                  }`}>
                    {error.includes('📤') || error.includes('💾') ? 'Processing' : 'Error'}
                  </p>
                  <p className={`text-sm ${
                    error.includes('📤') || error.includes('💾') 
                      ? 'text-blue-700' 
                      : 'text-red-700'
                  }`}>{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-8 mt-8 border-t-2 border-gray-200">
              {currentSection > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentSection(currentSection - 1)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
              )}
              
              {currentSection < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Next Section
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isEditMode ? 'Update Form' : 'Submit Form'}
                    </>
                  )}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
