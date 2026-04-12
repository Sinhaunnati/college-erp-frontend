import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const headers = { authorization: token };

  // Get faculty ID from localStorage (not hardcoded)
  const facultyId = localStorage.getItem('userId');

  useEffect(() => {
    if (facultyId) {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [facultyId]);

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses for faculty:', facultyId);
      const res = await axios.get(`http://localhost:5000/api/faculty/courses/${facultyId}`, { headers });
      console.log('Courses response:', res.data);
      // Make sure we set an array even if data is undefined
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId, enrollmentId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/faculty/course/${courseId}/students`, { headers });
      setStudents(res.data.students || []);
      setSelectedCourse({ id: courseId, enrollmentId });
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      await axios.post('http://localhost:5000/api/attendance', {
        enrollment_id: selectedCourse.enrollmentId,
        student_id: studentId,
        date: attendanceDate,
        status,
        marked_by: facultyId
      }, { headers });
      setMessage(`Attendance marked for student ${studentId}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error marking attendance');
      console.error('Attendance error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Faculty Dashboard</h1>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
        <div style={styles.content}>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Faculty Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.content}>
        {message && <div style={styles.success}>{message}</div>}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Courses</h2>
          {courses.length === 0 ? (
            <p>No courses assigned yet. Contact admin to assign courses.</p>
          ) : (
            <div style={styles.courseGrid}>
              {courses.map(course => (
                <div key={course.id} style={styles.courseCard} onClick={() => fetchStudents(course.id, course.enrollment_id)}>
                  <h3 style={styles.courseCode}>{course.code}</h3>
                  <p style={styles.courseName}>{course.name}</p>
                  <p style={styles.courseInfo}>Semester {course.semester_number} | Credits: {course.credits}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCourse && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Mark Attendance - {attendanceDate}</h2>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              style={styles.dateInput}
            />
            {students.length === 0 ? (
              <p>No students enrolled in this course.</p>
            ) : (
              <div style={styles.studentTable}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.roll_number}</td>
                        <td>{student.full_name}</td>
                        <td>
                          <button onClick={() => markAttendance(student.id, 'present')} style={styles.presentBtn}>Present</button>
                          <button onClick={() => markAttendance(student.id, 'absent')} style={styles.absentBtn}>Absent</button>
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
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#4f46e5', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', margin: 0, fontSize: '20px' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '32px 16px' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  courseCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s' },
  courseCode: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#4f46e5' },
  courseName: { margin: '0 0 8px 0', fontSize: '14px', color: '#333' },
  courseInfo: { margin: 0, fontSize: '12px', color: '#666' },
  dateInput: { padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  studentTable: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' },
  presentBtn: { backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
  absentBtn: { backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  success: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '20px' }
};

export default FacultyDashboard;