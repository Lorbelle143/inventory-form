import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import DocumentScanner from '../components/DocumentScanner';

export default function InventoryForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(1);
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

    if (!photoFile) {
      setError('Please upload a photo');
      setLoading(false);
      return;
    }

    if (documentFiles.length !== 4) {
      setError('Please upload all 4 required documents');
      setLoading(false);
      return;
    }

    try {
      // Upload student photo
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName);

      // Upload document files
      const uploadedDocUrls: string[] = [];
      for (let i = 0; i < documentFiles.length; i++) {
        const docFile = documentFiles[i];
        const docExt = docFile.name.split('.').pop();
        const docFileName = `${user?.id}_doc${i + 1}_${Date.now()}.${docExt}`;
        
        const { error: docUploadError } = await supabase.storage
          .from('student-photos')
          .upload(docFileName, docFile);

        if (docUploadError) throw docUploadError;

        const { data: { publicUrl: docUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(docFileName);

        uploadedDocUrls.push(docUrl);
      }

      // Save to database with document URLs
      const { error: dbError } = await supabase.from('inventory_submissions').insert({
        user_id: user?.id,
        student_id: formData.idNo,
        full_name: `${formData.firstName} ${formData.middleInitial} ${formData.lastName}`,
        course: formData.programYear,
        year_level: formData.programYear.split(' ')[0] || '',
        contact_number: formData.mobilePhone,
        photo_url: publicUrl,
        form_data: { ...formData, documentUrls: uploadedDocUrls },
        google_form_response_id: '',
      });

      if (dbError) throw dbError;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                NBSC
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">NORTHERN BUKIDNON STATE COLLEGE</h1>
                <p className="text-sm text-gray-600">GUIDANCE AND COUNSELING OFFICE</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Individual Inventory Form</h2>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3].map((section) => (
                <button
                  key={section}
                  onClick={() => setCurrentSection(section)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentSection === section
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Section {section}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Section 1: Basic Information */}
            {currentSection === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Basic Information</h3>
                
                {/* Photo Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo (2x2)</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm" required />
                  {photoPreview && <img src={photoPreview} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-lg" />}
                </div>

                {/* Document Scanner */}
                <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                  <h4 className="text-md font-bold text-gray-800 mb-4">📄 Required Documents (4)</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Please scan or photograph these 4 documents:
                  </p>
                  <ul className="text-sm text-gray-700 mb-4 space-y-1">
                    <li>1. WHODAS 2.0 Form</li>
                    <li>2. Individual Inventory Form</li>
                    <li>3. PID-5-BF Form</li>
                    <li>4. Counseling Consent Form</li>
                  </ul>
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

                <h4 className="text-md font-bold text-gray-800 mt-6">Contact Information</h4>
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
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Family Background</h3>
                
                <h4 className="text-md font-bold text-gray-800">Mother's Profile</h4>
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

                <h4 className="text-md font-bold text-gray-800 mt-6">Father's Profile</h4>
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

                <h4 className="text-md font-bold text-gray-800 mt-6">Parents Status</h4>
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
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Interests & Recreational Activities</h3>
                
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

                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mt-8">Health</h3>
                
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

                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mt-8">Life Circumstances</h3>
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
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            )}

            <div className="flex gap-4 pt-6 border-t">
              {currentSection > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentSection(currentSection - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              
              {currentSection < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Form'}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
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
