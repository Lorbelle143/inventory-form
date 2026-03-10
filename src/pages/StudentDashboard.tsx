import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useToastContext } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentDashboard() {
  const { user, signOut } = useAuthStore();
  const toast = useToastContext();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const navigate = useNavigate();

  // Enable session timeout protection
  useSessionTimeout();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSubmissions();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const loadSubmissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleView = (submission: any) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const handleEdit = (submissionId: string) => {
    navigate(`/inventory-form?edit=${submissionId}`);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const formData = submission.form_data || {};
    const matchesSearch = 
      submission.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formData.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formData.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const hasDocuments = formData.documentUrls && formData.documentUrls.length > 0;
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'complete' && hasDocuments) ||
      (filterStatus === 'incomplete' && !hasDocuments);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: submissions.length,
    complete: submissions.filter(s => s.form_data?.documentUrls?.length > 0).length,
    incomplete: submissions.filter(s => !s.form_data?.documentUrls?.length).length,
    lastUpdated: submissions[0] ? new Date(submissions[0].created_at) : null
  };

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROE3tdSJOhol7z2c9L5Y6Sawh5ZmEU7GT8Dg&s)' }}>
      {/* Frosted glass overlay - heavier blur and lighter for readability */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl"></div>
      
      {/* Gradient mesh pattern overlay for professional look */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
      {/* Header */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <img 
                src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxEQDxAPEBAWEhAVFhgVDw8QEBYPEA8VFRYWFxUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGi0lHyIrLy0vLS0rKy0tKy0tMC8tLy0tLS0tMy0tLS0tLS0rLS0tLS0uKy0tLS0tLS0tLS0rL//AABEIAGYB7AMBIgACEQEDEQH/xAAcAAEBAAIDAQEAAAAAAAAAAAABAAIDBAUGBwj/xAA+EAABAwICBggEBAUDBQAAAAABAAIDESEEMQUSQVFhcQYTIjKBkcHwkaHR4RRCYnJSU4KS8QcjoiQkQ8LS/8QAGQEBAQEBAQEAAAAAAAAAAAAAAQACAwQF/8QAKxEBAQACAgIBAgQGAwAAAAAAAAECERIhAzFBImETUYHwMkJxobHBBCOR/9oADAMBAAIRAxEAPwD5GpSV9F5kpSVJKUpKSElSQkJKEpSCVKCQUoCWipoLnYBclISVsfhntFXMcBvLSAtaUkrbHhZHCrWOI3hpIWtwINCKHcbFaCUpKQkqUEopQlISQhBckMkFy1SSAZnw2rjSTk5WHzWMvJI1MbXJkmDeJ3BcWScu4DcFqqglefLy2uswkKqrAuQ6xIXPk1pmDdYg3vvTIKOPNOIbRzuZ80XaEoo5w4lZ4gXrvAPyCcUO27n5rKYWb+0fRauPuDfoOHYZ/V5/dOGHfH6T8iEj/bHBx8grDd4je0+S1J9UF9VpIXIxg7Vd4HkFpcFvxH5f2hUn01X3DgvzD9JWEgWWCPa5g+SylFl0neDH8xwo7xrTjs2ilbU4vuc1jhMne9iyYMzTxefd1vGfTGb7oJrapPAWHvwRQjc35u+qycd7rbmj/CA3czxcfYQk6hNgXHimp/SOHZRKcqvtTJossQ0bI3Eb7+ivn9/6TgpQlSSlKSipSlAqUlKSUJSElCUoqUpIKlKUipSkgpQlIQSgJSilC5Oj8N1kjGkHVJ7TANKC5vsyWozbpoA+69NoOBrIg8DtvuXbQNgG5e66JdH8JisLKDrjERk6scT2MJZQULWusb1FyOug0WyFmJiD6Ow/WjXJGo1zC+jnEbBSpPitYWbv2cs7bJ93tdKYDAT6NGKhjY17WAyGJzWSRuAFQ5mT75g0JFwcq/Mn6Kj6wP1abSwd120Gnz4r6F0u6PYSLEQsia+F0j2DVNXxTMc4Nc6N9SWubW4NBe2yvA6QaNL9LPwraM13saw07LWFjdWgGwN8lz8GeOvdsu738HyzLf36nXy5GJ6EO/Cw4mKYEOjjfO2SwiD2gl4La1YL7MgTfJeP03ogh74ZmakrDS+bTsvtabHiCvU6dxOOwXVYSVwHVtIhmjrWSJwoYycnMFB2SKig4Lbp3CnEaP0bi2guld/2rqXdIWuc2Pmew7+5awzymuVllGWOPfGasfIXtIJBzBoeYUvoOlOg8uFjM+IhaA51yZWvdrOqaAA88ty6DE6JjcOyNQ7xceIXTGzKbl2rnq6s088lZ4iF0bi12Y+B4hYJaSC5ThZcV7yLUpxPojLLiZNtz5N5Wp0pOVvNawi5EhNSFiRavP0XC5Oshqqlq8Vnq9o8j5VUwdl3MeqNLbGQWby9Ss8Q3tFLh2W8j5n6rKUZch5Ba49f+DbGcX8B8wFliBuj70JlGXIeVEy7OQ8gtkeu8A/IKeOyw8CPgSmQWb+0KI7DeZ9FrXdH5JncP7h5FWG748fIpi7r/D1RD3281T+X9/KvywcFuk7rDwPyK1yjNbM42+PorGe4L8McN328/RbpAtEdnN5rkSi55reH8NGXsYP83IeQWTRU5Fx4qw7C2t9g2cEi+ZJ4Ze/gukn0yMX3VWm0DlcrCx2Fx+C3Bo3fH7/RZe/dU8djbUWutSjbcyOG0oOHrm8198Vt8PHYfJI5D5eieEvscq6dKlL572JKlKSUpKQkoSlJKAlSSVKSCpSkoqUlISlJCUkoSEhJUpIKlJSHY6EwQleS4VY2lR/ETkOVivZ4fRWIezWiw8roxk5kLiynAgU+C830acNSRu3WB8CKDyK99o7pjNDhDhr6za/h5mv1XRcHNIIe0Xz2W3EatymP0ztwy1cryrj4Pow+TD4fFlwMD5NWYCz4WCTUdJxAFSTs5VIy6d4EwY17dXViLW9QAOz1bWNbRvIgg/HasBiMfHhJWuik/DyO1zI+J/YcTd7X21Q4WNbEOO8rv9CSYmfCMZi8G7F4O/VzMcw4iLVJb2RrazqUI2HPPJc75Msbytlnc/f3MxxynGSy9fv+jhdJ+jr4cPBPHiXShkbCY3v1nQh1O3F+jWpbZl2XSGfrY8FpvDtBdHqtxDN1Dkd1HFza7ntOxGN6PTYqCNuCxjZ4Yg9jGSVixEbX6odC8gX7o7Lg2lOAW3oTojF4eSbC4rDH8LM063aa9gcBSvZcaazajwauNznHdu7N9eur7jrMby1J1f17+K8f0k0x+KmMgBZHUubE52uI3ODesLTSwJbWm+p2le20joHEHRGDwkMZdNrte+4Z1VQ97iXE2o51N64mg+gj2Y9xmFcNC4Ojcf8AznNgpuH5uIpkV23SzpRKyYYHAt18U6znUDurJFQADbWpck2A+V5PJLccfH8d/ZYYamWXk+enW6Y6N4mWKL8bjMPhooxSONgd1bbUqS9wLncanbvNfD6WwcULg2PEsnF6uY17NXKneFDXgTku0090c0gwHEYhjpNr5BJ1xYON6gDhYL sOhnSCHDiOIsZESXOxGLeNd7mipYxgAruG7O1St455Y47l39ppzykyy1Zr73b570gwp1A8tIcKZgglrsvCtF0K9r/qHpluJnmlbUNeWtjBsdVgAqRxpX+peKC9OFtm6MeuoVEb1LXNFrDMjgFutNMxYOe4ZLUX1yCWxgGn+ffwWwhee7rr1HFLe0OI9CEBvZ8fT7Lc8dpvvaVgBY8x6rlxa2QO0OQ+bVMFneHn91kB2m+H0Qzby9QtaAI7I5n0WZFm8kDu+PoPostjfe0rUgolFm8vUqfk3l6lZPFh4+aiOy3x802BHut5epQO5/V6BZU7I8UtHZPMeRTr/A2xhHf5eoWLR2hzWyId7kUNzCuPUW1M255lbNSjBz8wibvFZ/k+C3J3WbeowhzKzmzKoYzdMxFblak+kfLJqGnO/wDbY8tihK3IAkrXev5W/An1KbZ8KRsa4bKnkPp9VGSm4czf5VK10rm4n3x+iyEf6f7if8I5VagdMM6mvAfVGs45MceNXeizqQO8BwH2WBptcT4fdZuzNOApSl43pIUpSUkoSoJKlJRUpSUVKSoJKEpCSEJSklCUhJQlIKlKSilCUhycDi3RPD232ObscNy9JhNLROLS1+q+o1QRRwdW1DkTVeTWcMmq5rv4SDTfQ1SxnhK+taV6XzYuJsMgEZ7r5mSSsa5pz1o2kgg7bHbQLdoXEiON+Gi0lGGyZNngljjY+nfZMCDG7K9rjJeTjeHAOaagioK9JpPGaPfg444IXx4hpBLi1jtY5O15O85tK0Apelhs811Jxkc5nbblb3+v+mw9HNKQS9fEHPeb/iIJhJ1lbmpJq4H9QoV9A6K4rHvaRjYGsoOzKHAPeeMYqBtvbkvmfRIYiTEMgw884gdZz+rcaUaCXditCbUvtK7bpJjMdBI3DjHSTSahfKyFtHQ0vQuYKns3Jta9BVcvLvO8bp18WcwnKb1/WafVV8S0jK6PSU5fJJH/ANd4kkicWyCMyGurT9OXgvff6c6eOJgdDK8umi/M46zpIzkSTmQag/0961HTTQIk0iylvxEUmpegM8cbtQE5AE9VzuufivDKyuvn/wCzx45YtuL6aYeCDqcA2SSQijXy67tU7zrnWe7hl5LxOjcCcS9wdPFEcy7EPLddzjkLGpqvRaUdBozSbDCJBEIm9a2N9JAXVr3s7Bji00zXE0r0ka7GtxeCi6l+rRzpAwmRxsXFt2tNLVBuumN1/DPfy4eS7v131dajo+lfRSXD6rJtTWcCYpI36wNKV2A0uMxyyXhXNIJBsRYjcQvo/SZmMEwfja9Y5oLHEtLC0bGFnZoK5DffNeF002kzqbQD8vsvV4PJb1WJ1lZP7uEEOyVdDsl6m3H/ADe/fyW3atAND7/x5rMvJy+vmuONbsa5hdvvasAM1nJenjx3Kpd3vasX21PQH5fe0paLnkVEZe9qzpc+PqmQWsQLHmPVIFh4pAsfBNLeP0WpBsHIcz6I2DmfRJIpntRrinipEd3x9AsmCzvBYB/ZNtqmOJDr7PoqWLTZE255LBrmgipRC01Boab9nxSyAm4y4p3dTUHXyZpL1AWXWuLTkKUT1OtSppbgSswxgBFamlwtyZe/gbji1rmVteLN5LfQRtsKnftJTK6wNPiMlTx6ndFy20QxOrWnxstjmEGtBnmT87rkOHGi48jASM3U42+S3cJjNDlusa/qA/b9lW4n5LIN/SPfMrMV5e+AWZitsALWb8alFHbm/wDFLyNp8d3zR1zd/wA/srr5q7dapSQvA9aUpSUVKUoFSlBKKlJSklCUhJQlQSVKSipQUkFIQlISUJSioKUkFKEpDl4LSEkVmmrf4XXb9lzJdOvIo1oaf4ruPgupUrjKzcZe3pui2lXx1DJHMlGtRzXFri113UOda1+K9h0V0xBhvxTsRGZTJGGtb/Mq6r2ucdjrE1zDTnkflbSQag0IyIsQuc3S8wFNevEtBPkuXk8PL0zqy7j6Bg+lZj0pFinBrBIS10bBRoiAa0tA20aK8S0L6F/qLhOswPWsPaie2RjmmhpXVJBH7tb+lfnV2JeXiQuJcCCCeFwv0T0axH43QzQbl0L4t5s0taedNUry+fx/h8a7eLdmWF+Zv9Xz7RWkC/HRz4l7HEkB8k8XXMFGarS5gIrSjRXZnei7XpezBNkjnwkkZkqDLCxuvCSL6wtq5i7dtedfnGL0+6KaSMxhwabO19U0IBGw1zXXY7T87iCx3VtGxoDia7yRf4J/Dyt24YzO461O+9vonSDpK/ExNZIyKKGPtARs1A00NTUk0FzYfNfMtIaSEkjnNBIybW1hktOKxskv+48u4GzedBZaXEA+AXfxY8PTpjhd7y7rIyvPDkgMNak1QXrNxy5LrvfutFrdvv4rMC60hxy+Fvqs9Rx9n0omX8hVKLBY7SnqDy+Szbh71J90Tq34W41lwoPH0Tr35+qGtGtTZX0XIA7VNUc+ScZarY4zXE15eoWbInEGo+K5DLjnX6LFpNG1zrdamE+RyanQ0aakbEYdlaiu4+a2ztsbeO0rXhTQmtkWSZSLfTaI2GoG+9/e9bGuFdSlqLVrNFSCCa1O2gSJmVt3jYWK3LJ+TNlbJDRniOG1ENSHbbkLT+KAGRKZMSWkgAeKeePva430zwzSKVFLHzWbqmopbfX0Wj8S4t1rA1IssIp3F4BdauWSzM8ZJO1xt7cyRmsARbIi3oiUjVIquueabStuHu1wG8Knl3daPDU25rpWG1Qduf0WqaVtBS22w+q4raVytUeJXIlrvA9Pgn8S5SjjJWtzrkBruQNvkEEO/l/3V9Sp5r+fw7RWotb/ABE8m/dcMr++m5G5hd2rtba1NXeNyx1nfzfm70CIi29ATY5kD0WII/ln+4/RW+vf+Vpx0oSvO7pSlJRUpKgkoSlJKEpCSpSUVKUkEKUpKKlKSClCUhBKlBKKUJSCpSkgqUpKKUJSEvvf+jM4OjCCe7I6vAarR/6lfBAu/wCj/S7EYCOWOK7JGlrmk071RXLMVJB4lef/AJPjueHRwy45Suh0vJrYiQjfT4AD0XDkuKLY59SScyanmc1gZCCL2VJJNU4zUkDYTy5lbDFU5q64LE4ihIWpwkPdbWwjillDXbsWj8Ru8KBZGxcB6+gWpnj8DV+XJCiaLiNJ4/P1KzaM/sFr8T7Di3GQb0CYZLSQaEetUBmXzVzq4xB1yaVvkeNVmZ7ggbLBYtj9FdXYXWZcoemXXGtN1Vix5Nanl8QstS9UhgzT2OmFak32b1jHt5fRbwwKDRuVxq20x/8A15BEfeHNcgBKuK5OLKw7j8FnMwm9MwPJchCuE7HJpjjOrSl6/VYshIcDxG3iuQlXCdfZcq0yQVOe1ZxRaoIrmtgUtTGS7Fyvpq6m4vldbTQ7PmVIT6G9qg3DzyVTcAOTR9FJCYmADq980+Gy2S1mN22Q/wDIrkUVRVwUydYpSl4XqSVKSElSkpJUpSSVKSCpKkpKUpIKQhSUUoUkMgpSkgpUpISUqSklCkgpQpIKVKSCtc+XipSMvRntx0OFacFKXCuiDQnUFa0UpUkTOiSpS2ykhSkhJClJRUEqUEkIUlFKFJBUVKUkpSkglSlKRCSpSYGJUpSElk1SlrFVkpSltl//2Q==" 
                alt="NSCB Logo" 
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
                <p className="text-xs text-gray-500">Guidance and Counseling Office</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
              <p className="text-blue-100 text-lg">Manage your inventory submissions and profile</p>
            </div>
            <div className="hidden md:block">
              <svg className="w-24 h-24 text-blue-400 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Submissions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Forms</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Complete */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Complete</p>
                <p className="text-3xl font-bold text-gray-900">{stats.complete}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Incomplete */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Incomplete</p>
                <p className="text-3xl font-bold text-gray-900">{stats.incomplete}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Updated</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.lastUpdated ? stats.lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Profile Information</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Student ID</p>
                <p className="font-semibold text-gray-800 text-lg">{profile?.student_id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                <p className="font-medium text-gray-700 text-sm break-all">{profile?.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                <p className="font-medium text-gray-700">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
              
              {/* Edit Profile Button */}
              <button
                onClick={() => navigate('/edit-profile')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fill Form Card */}
              <button
                onClick={() => navigate('/inventory-form')}
                className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-1">Fill New Form</h4>
                <p className="text-sm text-blue-100">Submit your inventory information</p>
              </button>

              {/* Submissions Stats Card - Now Clickable */}
              <button
                onClick={() => {
                  // Scroll to submissions section
                  const submissionsSection = document.getElementById('submissions-section');
                  if (submissionsSection) {
                    submissionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-6 shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{submissions.length}</p>
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-1">Total Submissions</h4>
                <p className="text-sm text-purple-100 flex items-center gap-1">
                  Your completed forms
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Need Help?</p>
                  <p className="text-xs text-amber-800">Contact the Guidance and Counseling Office for assistance with your submissions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Section */}
        <div id="submissions-section" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 scroll-mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">My Submissions</h3>
                {submissions.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                  </p>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            {submissions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition w-full sm:w-64"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="complete">✅ Complete</option>
                  <option value="incomplete">⏳ Incomplete</option>
                </select>
              </div>
            )}
          </div>

          {submissions.length === 0 ? (
            loading ? (
              <div className="text-center py-16">
                <LoadingSpinner size="lg" text="Loading submissions..." />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No submissions yet</h4>
                <p className="text-gray-500 mb-6">Get started by filling out your first inventory form</p>
                <button
                  onClick={() => navigate('/inventory-form')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Fill Inventory Form
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSubmissions.map((submission) => {
                const formData = submission.form_data || {};
                const isComplete = formData.documentUrls && formData.documentUrls.length > 0;
                
                return (
                  <div key={submission.id} className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-200">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isComplete 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}>
                        {isComplete ? '✅ Complete' : '⏳ Incomplete'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {submission.student_id}
                      </span>
                    </div>

                    <div className="flex gap-4 mb-4">
                      {submission.photo_url ? (
                        <img
                          src={submission.photo_url}
                          alt="Profile"
                          className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md">
                          <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{submission.course}</h4>
                        <p className="text-sm text-gray-600 mb-1">Year {submission.year_level}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {submission.contact_number}
                        </div>
                      </div>
                    </div>

                    {/* Documents Badge */}
                    {formData.documentUrls && formData.documentUrls.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-green-700">
                          {formData.documentUrls.length} documents uploaded
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Submitted: {new Date(submission.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleView(submission)}
                        className="flex items-center justify-center gap-1 px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(submission.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results Found */}
          {submissions.length > 0 && filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No submissions found</h4>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedSubmission && (
        <ViewSubmissionModal
          submission={selectedSubmission}
          onClose={() => setShowViewModal(false)}
        />
      )}
      </div>
    </div>
  );
}

// View Submission Modal Component
function ViewSubmissionModal({ submission, onClose }: any) {
  const formData = submission.form_data || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Submission Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo */}
          <div className="flex gap-6">
            <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {submission.photo_url ? (
                <img src={submission.photo_url} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-lg font-semibold">{formData.firstName} {formData.middleInitial} {formData.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Student ID</label>
                <p className="text-lg">{formData.idNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Program & Year</label>
                <p className="text-lg">{formData.programYear}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact</label>
                <p className="text-lg">{formData.mobilePhone}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          {formData.documentUrls && formData.documentUrls.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📄 Uploaded Documents ({formData.documentUrls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.documentUrls.map((url: string, index: number) => {
                  const isPDF = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
                  return (
                    <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="aspect-square bg-gray-100">
                        {isPDF ? (
                          // PDF Preview
                          <div 
                            className="w-full h-full flex flex-col items-center justify-center bg-red-50 cursor-pointer hover:bg-red-100 transition"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <svg className="w-16 h-16 text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-bold text-red-600">PDF</p>
                          </div>
                        ) : (
                          // Image Preview
                          <img
                            src={url}
                            alt={`Document ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                            onClick={() => window.open(url, '_blank')}
                          />
                        )}
                      </div>
                      <div className="p-2 bg-gray-50 text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {isPDF ? '📄 PDF' : '📷 Image'} {index + 1}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
