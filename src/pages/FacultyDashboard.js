import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance');
  const [marksData, setMarksData] = useState({});
  const [examType, setExamType] = useState('endsem');
  const [maxMarks, setMaxMarks] = useState(100);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const headers = { authorization: token };

  useEffect(() => {
    fetchFacultyProfile();
  }, []);

  const fetchFacultyProfile = async () => {
    try {
      const profileRes = await axios.get(`${API_URL}/api/faculty/profile/${userId}`, { headers });
      const facultyProfileId = profileRes.data.faculty.id;
      setFacultyInfo(profileRes.data.faculty);
      await fetchCourses(facultyProfileId);
    } catch (err) {
      console.error('Error fetching faculty profile:', err);
      setLoading(false);
    }
  };

  const fetchCourses = async (facultyProfileId) => {
    try {
      const res = await axios.get(`${API_URL}/api/faculty/courses/${facultyProfileId}`, { headers });
      const uniqueCourses = res.data.courses?.filter((course, index, self) => 
        index === self.findIndex(c => c.id === course.id)
      ) || [];
      setCourses(uniqueCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId, enrollmentId) => {
    try {
      const res = await axios.get(`${API_URL}/api/faculty/course/${courseId}/students`, { headers });
      setStudents(res.data.students || []);
      setSelectedCourse({ id: courseId, enrollmentId });
      const initialMarks = {};
      res.data.students?.forEach(student => {
        initialMarks[student.id] = '';
      });
      setMarksData(initialMarks);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      await axios.post(`${API_URL}/api/attendance`, {
        enrollment_id: selectedCourse.enrollmentId,
        student_id: studentId,
        date: attendanceDate,
        status,
        marked_by: userId
      }, { headers });
      setMessage(`✅ Attendance marked as ${status}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error marking attendance');
    }
  };

  const submitMarks = async (studentId) => {
    const marks = marksData[studentId];
    if (!marks || marks === '') {
      setMessage('❌ Please enter marks before submitting');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/marks`, {
        enrollment_id: selectedCourse.enrollmentId,
        exam_type: examType,
        marks_obtained: parseFloat(marks),
        max_marks: parseFloat(maxMarks)
      }, { headers });
      setMessage(`✅ Marks submitted for student`);
      setMarksData(prev => ({ ...prev, [studentId]: '' }));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error submitting marks');
      console.error(err);
    }
  };

  const submitAllMarks = async () => {
    let successCount = 0;
    for (const student of students) {
      const marks = marksData[student.id];
      if (marks && marks !== '') {
        try {
          await axios.post(`${API_URL}/api/marks`, {
            enrollment_id: selectedCourse.enrollmentId,
            exam_type: examType,
            marks_obtained: parseFloat(marks),
            max_marks: parseFloat(maxMarks)
          }, { headers });
          successCount++;
        } catch (err) {
          console.error(`Failed for student ${student.id}:`, err);
        }
      }
    }
    setMessage(`✅ Submitted marks for ${successCount} students`);
    const clearedMarks = {};
    students.forEach(student => { clearedMarks[student.id] = ''; });
    setMarksData(clearedMarks);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>F</div>
          <div>
            <h1 style={styles.headerTitle}>Faculty Portal</h1>
            <p style={styles.headerSubtitle}>Welcome back, {facultyInfo?.full_name?.split(' ')[0] || 'Faculty'}</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userChip}>
            <div style={styles.avatar}>{(facultyInfo?.full_name?.[0] || 'F').toUpperCase()}</div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{facultyInfo?.full_name || 'Faculty'}</span>
              <span style={styles.userRole}>Faculty Member</span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </div>

      <div style={styles.pageBody}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, ...styles.statCardBlue}}>
            <div style={styles.statIconWrap}>📚</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{courses.length}</div>
              <div style={styles.statLabel}>My Courses</div>
            </div>
          </div>
          <div style={{...styles.statCard, ...styles.statCardGreen}}>
            <div style={styles.statIconWrap}>👨‍🎓</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{students.length}</div>
              <div style={styles.statLabel}>Students</div>
            </div>
          </div>
          <div style={{...styles.statCard, ...styles.statCardPurple}}>
            <div style={styles.statIconWrap}>📅</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{attendanceDate}</div>
              <div style={styles.statLabel}>Current Date</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && <div style={styles.message}>{message}</div>}

        {/* My Courses Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>My Courses</h2>
            <span style={styles.sectionBadge}>{courses.length} assigned</span>
          </div>
          {courses.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No courses assigned yet. Please contact administrator.</p>
            </div>
          ) : (
            <div style={styles.courseGrid}>
              {courses.map((course, i) => (
                <div
                  key={course.id}
                  style={styles.courseCard}
                  onClick={() => fetchStudents(course.id, course.enrollment_id)}
                >
                  <div style={{...styles.courseAccent, backgroundColor: ['#38bdf8', '#34d399', '#a78bfa', '#fb923c'][i % 4]}} />
                  <div style={styles.courseHeader}>
                    <span style={{...styles.courseCode, color: ['#38bdf8', '#34d399', '#a78bfa', '#fb923c'][i % 4]}}>{course.code}</span>
                    <span style={styles.courseCredits}>{course.credits} cr</span>
                  </div>
                  <h3 style={styles.courseName}>{course.name}</h3>
                  <div style={styles.courseFooter}>
                    <span style={styles.courseSemester}>Semester {course.semester_number}</span>
                    {course.section && <span style={styles.courseSection}>§ {course.section}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Course Actions */}
        {selectedCourse && (
          <div style={styles.section}>
            <div style={styles.tabHeader}>
              <button 
                style={activeTab === 'attendance' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('attendance')}
              >
                📝 Mark Attendance
              </button>
              <button 
                style={activeTab === 'marks' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('marks')}
              >
                📊 Enter Marks
              </button>
            </div>

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div style={styles.attendanceCard}>
                <div style={styles.datePickerRow}>
                  <label style={styles.dateLabel}>📅 Select Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
                
                {students.length === 0 ? (
                  <p style={styles.emptyText}>No students enrolled in this course.</p>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeadRow}>
                          <th style={styles.th}>#</th>
                          <th style={styles.th}>Roll Number</th>
                          <th style={styles.th}>Student Name</th>
                          <th style={{...styles.th, textAlign: 'right'}}>Mark Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
                          <tr key={student.id} style={styles.tr}>
                            <td style={{...styles.td, color: '#94a3b8', width: '40px'}}>{idx + 1}</td>
                            <td style={styles.td}>{student.roll_number}</td>
                            <td style={{...styles.td, fontWeight: '500'}}>{student.full_name}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                              <button
                                onClick={() => markAttendance(student.id, 'present')}
                                style={styles.presentBtn}
                              >
                                ✓ Present
                              </button>
                              <button
                                onClick={() => markAttendance(student.id, 'absent')}
                                style={styles.absentBtn}
                              >
                                ✗ Absent
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Marks Tab */}
            {activeTab === 'marks' && (
              <div style={styles.attendanceCard}>
                <div style={styles.marksHeader}>
                  <div style={styles.marksControls}>
                    <select 
                      value={examType} 
                      onChange={(e) => setExamType(e.target.value)}
                      style={styles.selectInput}
                    >
                      <option value="internal">Internal Exam</option>
                      <option value="midterm">Mid Term Exam</option>
                      <option value="endsem">End Semester Exam</option>
                      <option value="assignment">Assignment</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Max Marks"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      style={styles.marksInput}
                    />
                    <button onClick={submitAllMarks} style={styles.submitAllBtn}>
                      📤 Submit All
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <p style={styles.emptyText}>No students enrolled in this course.</p>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeadRow}>
                          <th style={styles.th}>#</th>
                          <th style={styles.th}>Roll Number</th>
                          <th style={styles.th}>Student Name</th>
                          <th style={styles.th}>Marks Obtained</th>
                          <th style={{...styles.th, textAlign: 'right'}}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
                          <tr key={student.id} style={styles.tr}>
                            <td style={{...styles.td, color: '#94a3b8', width: '40px'}}>{idx + 1}</td>
                            <td style={styles.td}>{student.roll_number}</td>
                            <td style={{...styles.td, fontWeight: '500'}}>{student.full_name}</td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                value={marksData[student.id] || ''}
                                onChange={(e) => setMarksData(prev => ({ ...prev, [student.id]: e.target.value }))}
                                placeholder={`Out of ${maxMarks}`}
                                style={styles.marksObtainedInput}
                              />
                            </td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                              <button
                                onClick={() => submitMarks(student.id)}
                                style={styles.submitBtn}
                              >
                                ✓ Submit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #0b0f19; }
        .course-card:hover { transform: translateY(-3px); border-color: #334155 !important; box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important; }
        .table-row:hover td { background: rgba(255,255,255,0.03) !important; }
        .btn-present:hover { background: #059669 !important; transform: scale(1.04); }
        .btn-absent:hover { background: #dc2626 !important; transform: scale(1.04); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
      `}</style>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0b0f19 0%, #0f172a 60%, #0b1120 100%)', fontFamily: '"DM Sans", sans-serif', color: '#cbd5e1' },
  header: { background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', padding: '0 40px', height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  logoMark: { width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Syne", sans-serif', fontWeight: '800', fontSize: '18px', color: '#fff' },
  headerTitle: { margin: 0, fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: '700', color: '#f1f5f9' },
  headerSubtitle: { margin: '2px 0 0', fontSize: '12px', color: '#64748b' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  userChip: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 14px 6px 8px', borderRadius: '40px' },
  avatar: { width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff' },
  userInfo: { textAlign: 'left' },
  userName: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0' },
  userRole: { display: 'block', fontSize: '11px', color: '#64748b' },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: '#94a3b8', cursor: 'pointer' },
  pageBody: { maxWidth: '1240px', margin: '0 auto', padding: '40px 32px 60px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' },
  statCard: { padding: '28px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '18px', background: 'rgba(15,23,42,0.8)' },
  statCardBlue: { borderColor: 'rgba(59,130,246,0.15)' },
  statCardGreen: { borderColor: 'rgba(52,211,153,0.15)' },
  statCardPurple: { borderColor: 'rgba(167,139,250,0.15)' },
  statIconWrap: { fontSize: '28px' },
  statContent: { flex: 1 },
  statValue: { fontFamily: '"Syne", sans-serif', fontSize: '26px', fontWeight: '800', color: '#f1f5f9' },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase' },
  message: { padding: '14px 20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: '10px', fontSize: '14px', fontWeight: '500', marginBottom: '28px' },
  section: { marginBottom: '40px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  sectionTitle: { fontFamily: '"Syne", sans-serif', fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: 0 },
  sectionBadge: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  courseCard: { position: 'relative', background: 'rgba(15,23,42,0.9)', padding: '22px 20px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'transform 0.2s' },
  courseAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '14px 14px 0 0' },
  courseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  courseCode: { fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' },
  courseCredits: { fontSize: '11px', color: '#475569', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px' },
  courseName: { fontFamily: '"Syne", sans-serif', fontSize: '15px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 16px 0' },
  courseFooter: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' },
  courseSemester: { fontSize: '12px', color: '#64748b' },
  courseSection: { fontSize: '12px', color: '#94a3b8' },
  emptyCard: { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '60px 20px', textAlign: 'center' },
  tabHeader: { display: 'flex', gap: '12px', marginBottom: '20px' },
  tab: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: '500', color: '#94a3b8', cursor: 'pointer' },
  activeTab: { background: '#3b82f6', border: '1px solid #3b82f6', padding: '10px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: '500', color: 'white', cursor: 'pointer' },
  attendanceCard: { background: 'rgba(15,23,42,0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' },
  datePickerRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  dateLabel: { fontWeight: '600', color: '#64748b' },
  dateInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#e2e8f0' },
  marksHeader: { marginBottom: '24px' },
  marksControls: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  selectInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer' },
  marksInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#e2e8f0', width: '120px' },
  marksObtainedInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', color: '#e2e8f0', width: '100px' },
  submitBtn: { background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  submitAllBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  th: { padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td: { padding: '14px 20px', color: '#94a3b8', fontSize: '14px' },
  presentBtn: { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
  absentBtn: { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' },
  emptyText: { textAlign: 'center', padding: '40px', color: '#64748b' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#64748b', background: '#0b0f19' },
};

export default FacultyDashboard;