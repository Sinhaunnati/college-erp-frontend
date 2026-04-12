import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [feeData, setFeeData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [admitCards, setAdmitCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const headers = { authorization: token };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      // Get student profile by user_id
      const res = await axios.get(`http://localhost:5000/api/students/by-user/${userId}`, { headers });
      const id = res.data.student.id;
      setStudentId(id);
      fetchAllData(id);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setLoading(false);
    }
  };

  const fetchAllData = async (id) => {
    try {
      const [feeRes, admitRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/fees/status/${id}`, { headers }),
        axios.get(`http://localhost:5000/api/admit-card/${id}`, { headers }),
      ]);

      setFeeData(feeRes.data);
      setAdmitCards(admitRes.data.admitCards);

      // Fetch attendance if student has enrollments
      try {
        const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/by-student/${id}`, { headers });
        setAttendance(attendanceRes.data);
      } catch (err) {
        setAttendance(null);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyWallet = async (semester_number, academic_year) => {
    try {
      await axios.post('http://localhost:5000/api/fees/wallet/apply', {
        student_id: studentId,
        semester_number,
        academic_year
      }, { headers });
      fetchAllData(studentId);
      alert('Wallet balance applied successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error applying wallet');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  if (!studentId) return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Student Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
      <div style={styles.content}>
        <p>Student profile not found. Please contact admin.</p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Student Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.content}>

        {feeData && (
          <div style={styles.walletCard}>
            <h3 style={styles.walletTitle}>Wallet Balance</h3>
            <p style={styles.walletAmount}>
              ₹{parseFloat(feeData.wallet?.balance || 0).toLocaleString('en-IN')}
            </p>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Fee Status</h2>
          {feeData?.feeLedger?.length === 0 && (
            <p style={styles.empty}>No fee records found</p>
          )}
          {feeData?.feeLedger?.map(fee => (
            <div key={fee.id} style={styles.card}>
              <div style={styles.cardRow}>
                <span style={styles.cardLabel}>Semester {fee.semester_number} — {fee.academic_year}</span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: fee.status === 'paid' ? '#dcfce7' : fee.status === 'partial' ? '#fef9c3' : '#fee2e2',
                  color: fee.status === 'paid' ? '#16a34a' : fee.status === 'partial' ? '#ca8a04' : '#dc2626'
                }}>
                  {fee.status.toUpperCase()}
                </span>
              </div>
              <div style={styles.cardRow}>
                <span>Total Fee</span>
                <span>₹{parseFloat(fee.total_fee).toLocaleString('en-IN')}</span>
              </div>
              <div style={styles.cardRow}>
                <span>Amount Paid</span>
                <span>₹{parseFloat(fee.amount_paid).toLocaleString('en-IN')}</span>
              </div>
              <div style={styles.cardRow}>
                <span>Balance Due</span>
                <span style={{color: '#dc2626', fontWeight: '600'}}>
                  ₹{(parseFloat(fee.total_fee) - parseFloat(fee.amount_paid)).toLocaleString('en-IN')}
                </span>
              </div>
              {fee.status !== 'paid' && feeData.wallet?.balance > 0 && (
                <button
                  style={styles.applyBtn}
                  onClick={() => applyWallet(fee.semester_number, fee.academic_year)}
                >
                  Apply Wallet Balance (₹{parseFloat(feeData.wallet.balance).toLocaleString('en-IN')} available)
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Admit Cards</h2>
          {admitCards.length === 0 && <p style={styles.empty}>No admit cards generated yet</p>}
          {admitCards.map(card => (
            <div key={card.id} style={styles.card}>
              <div style={styles.cardRow}>
                <span>Semester {card.semester_number} — {card.academic_year}</span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: card.status === 'generated' ? '#dcfce7' : '#fee2e2',
                  color: card.status === 'generated' ? '#16a34a' : '#dc2626'
                }}>
                  {card.status.toUpperCase()}
                </span>
              </div>
              <div style={styles.cardRow}>
                <span>Fee Cleared</span>
                <span>{card.fee_cleared ? '✅' : '❌'}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Attendance</h2>
          {!attendance ? (
            <p style={styles.empty}>No attendance records found</p>
          ) : (
            <div style={styles.card}>
              <div style={styles.cardRow}>
                <span>Total Classes</span>
                <span>{attendance.summary.total_classes}</span>
              </div>
              <div style={styles.cardRow}>
                <span>Present</span>
                <span style={{color: '#16a34a'}}>{attendance.summary.present}</span>
              </div>
              <div style={styles.cardRow}>
                <span>Absent</span>
                <span style={{color: '#dc2626'}}>{attendance.summary.absent}</span>
              </div>
              <div style={styles.cardRow}>
                <span>Percentage</span>
                <span style={{
                  fontWeight: '700',
                  color: attendance.summary.percentage >= 75 ? '#16a34a' : '#dc2626'
                }}>
                  {attendance.summary.percentage}%
                </span>
              </div>
              {attendance.summary.alert && (
                <div style={styles.alert}>{attendance.summary.alert}</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#4f46e5', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', margin: 0, fontSize: '20px' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  content: { maxWidth: '800px', margin: '0 auto', padding: '32px 16px' },
  walletCard: { backgroundColor: '#4f46e5', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' },
  walletTitle: { margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 },
  walletAmount: { margin: 0, fontSize: '36px', fontWeight: '700' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
  cardLabel: { fontWeight: '600', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  applyBtn: { marginTop: '12px', width: '100%', padding: '10px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  alert: { marginTop: '12px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px' },
  empty: { color: '#999', fontSize: '14px' }
};

export default StudentDashboard;