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
    return <div style={styles.loading}>Loading...</div>;
  }

  const statsCards = [
    { icon: '📚', value: courses.length, label: 'My Courses' },
    { icon: '👨‍🎓', value: students.length, label: 'Students' },
    { icon: '📅', value: attendanceDate, label: 'Current Date' },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Faculty Dashboard</h1>
          <p style={styles.headerSubtitle}>Welcome back, {facultyInfo?.full_name?.split(' ')[0] || 'Faculty'}!</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {statsCards.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={styles.statIcon}>{stat.icon}</div>
            <div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && <div style={styles.message}>{message}</div>}

      {/* My Courses Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📚 My Courses</h2>
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
                <div style={styles.courseHeader}>
                  <span style={styles.courseCode}>{course.code}</span>
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
          <div style={styles.tabContainer}>
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
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Roll Number</th>
                        <th style={styles.th}>Student Name</th>
                        <th style={{...styles.th, textAlign: 'right'}}>Mark Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => (
                        <tr key={student.id} style={styles.tr}>
                          <td style={styles.td}>{idx + 1}</td>
                          <td style={styles.td}>{student.roll_number}</td>
                          <td style={styles.td}>{student.full_name}</td>
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

              {students.length === 0 ? (
                <p style={styles.emptyText}>No students enrolled in this course.</p>
              ) : (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Roll Number</th>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>Marks</th>
                        <th style={{...styles.th, textAlign: 'right'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => (
                        <tr key={student.id} style={styles.tr}>
                          <td style={styles.td}>{idx + 1}</td>
                          <td style={styles.td}>{student.roll_number}</td>
                          <td style={styles.td}>{student.full_name}</td>
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
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
  },
  headerSubtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    opacity: 0.7,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    padding: '24px 32px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    fontSize: '32px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  message: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    padding: '12px 16px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '8px',
    fontSize: '14px',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto 32px',
    padding: '0 32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  sectionBadge: {
    backgroundColor: '#e2e8f0',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#475569',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  courseCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  courseCode: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  courseCredits: {
    fontSize: '12px',
    color: '#64748b',
  },
  courseName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 12px 0',
  },
  courseFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },
  courseSemester: {
    fontSize: '12px',
    color: '#64748b',
  },
  courseSection: {
    fontSize: '12px',
    color: '#3b82f6',
  },
  emptyCard: {
    backgroundColor: 'white',
    padding: '60px 20px',
    textAlign: 'center',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    color: '#64748b',
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 24px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
  },
  activeTab: {
    padding: '10px 24px',
    backgroundColor: '#4f46e5',
    border: '1px solid #4f46e5',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
  },
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
  },
  datePickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  dateLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  marksControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  selectInput: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  marksInput: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    width: '120px',
  },
  marksObtainedInput: {
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    width: '80px',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  submitAllBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px 16px',
    color: '#334155',
  },
  presentBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '8px',
  },
  absentBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '16px',
    color: '#64748b',
    backgroundColor: '#f5f6fa',
  },
};

export default FacultyDashboard;