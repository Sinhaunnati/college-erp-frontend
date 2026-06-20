import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const StudentDashboard = () => {
  const [feeData, setFeeData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [admitCards, setAdmitCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const headers = { authorization: token };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/students/by-user/${userId}`, { headers });
      const id = res.data.student.id;
      setStudentId(id);
      setStudentInfo(res.data.student);
      fetchAllData(id);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setLoading(false);
    }
  };

  const fetchAllData = async (id) => {
    try {
      const [feeRes, admitRes] = await Promise.all([
        axios.get(`${API_URL}/api/fees/status/${id}`, { headers }),
        axios.get(`${API_URL}/api/admit-card/${id}`, { headers }),
      ]);

      setFeeData(feeRes.data);
      setAdmitCards(admitRes.data.admitCards || []);

      // Fetch attendance
      try {
        const attendanceRes = await axios.get(`${API_URL}/api/attendance/by-student/${id}`, { headers });
        setAttendance(attendanceRes.data);
      } catch (err) {
        setAttendance(null);
      }

      // Fetch results
      try {
        const resultsRes = await axios.get(`${API_URL}/api/results/student/${id}`, { headers });
        setResults(resultsRes.data);
      } catch (err) {
        console.error('Error fetching results:', err);
        setResults(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyWallet = async (semester_number, academic_year) => {
    try {
      await axios.post(`${API_URL}/api/fees/wallet/apply`, {
        student_id: studentId,
        semester_number,
        academic_year
      }, { headers });
      fetchAllData(studentId);
      alert('✅ Wallet balance applied successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error applying wallet');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const walletBalance = feeData?.wallet?.balance || 0;
  const totalFeesPaid = feeData?.feeLedger?.reduce((sum, f) => sum + parseFloat(f.amount_paid), 0) || 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Student Dashboard</h1>
          <p style={styles.headerSubtitle}>Welcome back, {studentInfo?.full_name?.split(' ')[0] || 'Student'}!</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Welcome Card with Wallet */}
      <div style={styles.welcomeCard}>
        <div>
          <h2 style={styles.welcomeTitle}>Hello, {studentInfo?.full_name?.split(' ')[0] || 'Student'}! 👋</h2>
          <p style={styles.welcomeSubtitle}>Roll No: {studentInfo?.roll_number || 'N/A'} | Program: {studentInfo?.program || 'N/A'}</p>
        </div>
        <div style={styles.walletCard}>
          <span style={styles.walletLabel}>Wallet Balance</span>
          <span style={styles.walletAmount}>₹{parseFloat(walletBalance).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statValue}>₹{totalFeesPaid.toLocaleString('en-IN')}</div>
            <div style={styles.statLabel}>Total Fees Paid</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎫</div>
          <div>
            <div style={styles.statValue}>{admitCards.length}</div>
            <div style={styles.statLabel}>Admit Cards</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div>
            <div style={styles.statValue}>{attendance?.summary?.percentage || 0}%</div>
            <div style={styles.statLabel}>Attendance</div>
          </div>
        </div>
      </div>

      {/* Fee Status Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 Fee Status</h2>
        {feeData?.feeLedger?.length === 0 && <p style={styles.empty}>No fee records found</p>}
        <div style={styles.feeGrid}>
          {feeData?.feeLedger?.map(fee => {
            const balanceDue = parseFloat(fee.total_fee) - parseFloat(fee.amount_paid);
            return (
              <div key={fee.id} style={styles.feeCard}>
                <div style={styles.feeHeader}>
                  <span>Semester {fee.semester_number} — {fee.academic_year}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: fee.status === 'paid' ? '#dcfce7' : fee.status === 'partial' ? '#fef9c3' : '#fee2e2',
                    color: fee.status === 'paid' ? '#16a34a' : fee.status === 'partial' ? '#ca8a04' : '#dc2626'
                  }}>
                    {fee.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.feeRow}><span>Total Fee</span><span>₹{parseFloat(fee.total_fee).toLocaleString('en-IN')}</span></div>
                <div style={styles.feeRow}><span>Amount Paid</span><span>₹{parseFloat(fee.amount_paid).toLocaleString('en-IN')}</span></div>
                <div style={styles.feeRow}><span>Balance Due</span><span style={{color: '#dc2626', fontWeight: 600}}>₹{balanceDue.toLocaleString('en-IN')}</span></div>
                {fee.status !== 'paid' && walletBalance > 0 && (
                  <button style={styles.applyBtn} onClick={() => applyWallet(fee.semester_number, fee.academic_year)}>
                    💰 Apply Wallet (₹{parseFloat(walletBalance).toLocaleString('en-IN')} available)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admit Cards Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎫 Admit Cards</h2>
        <div style={styles.feeGrid}>
          {admitCards.length === 0 && <p style={styles.empty}>No admit cards generated yet</p>}
          {admitCards.map(card => (
            <div key={card.id} style={styles.admitCard}>
              <div style={styles.feeHeader}>
                <span>Semester {card.semester_number} — {card.academic_year}</span>
                <span style={{...styles.statusBadge, backgroundColor: '#dcfce7', color: '#16a34a'}}>{card.status.toUpperCase()}</span>
              </div>
              <div style={styles.feeRow}><span>Fee Cleared</span><span>{card.fee_cleared ? '✅ Yes' : '❌ No'}</span></div>
              <div style={styles.feeRow}><span>Generated On</span><span>{card.generated_at ? new Date(card.generated_at).toLocaleDateString() : 'N/A'}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 Attendance Summary</h2>
        {!attendance ? (
          <p style={styles.empty}>No attendance records found</p>
        ) : (
          <div style={styles.attendanceCard}>
            <div style={styles.attendanceGrid}>
              <div><span style={styles.attendanceLabel}>Total Classes</span><span style={styles.attendanceValue}>{attendance.summary.total_classes}</span></div>
              <div><span style={styles.attendanceLabel}>Present</span><span style={{...styles.attendanceValue, color: '#16a34a'}}>{attendance.summary.present}</span></div>
              <div><span style={styles.attendanceLabel}>Absent</span><span style={{...styles.attendanceValue, color: '#dc2626'}}>{attendance.summary.absent}</span></div>
              <div><span style={styles.attendanceLabel}>Percentage</span><span style={{...styles.attendanceValue, fontWeight: 700, color: attendance.summary.percentage >= 75 ? '#16a34a' : '#dc2626'}}>{attendance.summary.percentage}%</span></div>
            </div>
            {attendance.summary.alert && <div style={styles.alert}>{attendance.summary.alert}</div>}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && results.results && results.results.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 Academic Results</h2>
          <div style={styles.resultsCard}>
            <div style={styles.resultsHeader}>
              <h3 style={styles.resultsHeaderTitle}>Semester Results</h3>
              <div style={styles.overallCgpa}>
                Overall CGPA: <strong>{results.overall_cgpa}</strong>
              </div>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Semester</th>
                    <th style={styles.th}>Academic Year</th>
                    <th style={styles.th}>Total Marks</th>
                    <th style={styles.th}>Percentage</th>
                    <th style={styles.th}>CGPA</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((result, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.td}>{result.semester_number}</td>
                      <td style={styles.td}>{result.academic_year}</td>
                      <td style={styles.td}>{result.total_marks} / {result.total_max_marks}</td>
                      <td style={styles.td}>{parseFloat(result.percentage).toFixed(2)}%</td>
                      <td style={styles.td}>{result.cgpa}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.resultBadge,
                          backgroundColor: result.status === 'pass' ? '#10b981' : '#ef4444',
                          color: 'white'
                        }}>
                          {result.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f5f6fa' },
  header: {
    backgroundColor: '#1a1a2e',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  },
  headerTitle: { margin: 0, fontSize: '24px', fontWeight: '600' },
  headerSubtitle: { margin: '4px 0 0', fontSize: '14px', opacity: 0.7 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  welcomeCard: {
    backgroundColor: '#4f46e5',
    borderRadius: '16px',
    padding: '24px 32px',
    margin: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  },
  welcomeTitle: { fontSize: '24px', margin: 0, marginBottom: '8px' },
  welcomeSubtitle: { fontSize: '14px', opacity: 0.8, margin: 0 },
  walletCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '16px 24px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  walletLabel: { display: 'block', fontSize: '12px', opacity: 0.8, marginBottom: '4px' },
  walletAmount: { fontSize: '24px', fontWeight: '700' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    padding: '0 32px',
    marginBottom: '32px',
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
  statIcon: { fontSize: '32px' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: '14px', color: '#666' },
  section: { padding: '0 32px', marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' },
  feeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  feeCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  admitCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  feeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' },
  feeRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  applyBtn: { marginTop: '12px', width: '100%', padding: '10px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  attendanceCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  attendanceGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' },
  attendanceLabel: { display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' },
  attendanceValue: { fontSize: '24px', fontWeight: '600' },
  alert: { marginTop: '16px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', textAlign: 'center' },
  resultsCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' },
  resultsHeaderTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a2e' },
  overallCgpa: { fontSize: '16px', fontWeight: '600', color: '#4f46e5' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f0f0f0' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  resultBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px' },
  empty: { textAlign: 'center', padding: '40px', color: '#999', backgroundColor: 'white', borderRadius: '12px' },
};

export default StudentDashboard;