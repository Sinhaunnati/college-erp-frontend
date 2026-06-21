import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('studentList');
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, totalFeesCollected: 0, pendingFees: 0 });
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const headers = { authorization: token };

  // Add Student form
  const [studentForm, setStudentForm] = useState({
    full_name: '', email: '', password: '', erp_id: '', 
    roll_number: '', program: '', batch_year: '', phone: ''
  });

  // Fee Ledger form
  const [feeForm, setFeeForm] = useState({
    student_id: '', academic_year: '', semester_number: '', total_fee: ''
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    student_id: '', amount: '', type: 'online',
    reference_number: '', semester_number: '', academic_year: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/students/all`, { headers });
      setStudents(res.data.students || []);
      setStats(prev => ({ ...prev, totalStudents: res.data.students?.length || 0 }));
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/fees/stats`, { headers });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/analytics`, { headers });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setMessage(''); setError(''); }, 3000);
  };

  const addStudent = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/students`, {
        full_name: studentForm.full_name,
        email: studentForm.email,
        password: studentForm.password,
        erp_id: studentForm.erp_id,
        roll_number: studentForm.roll_number,
        program: studentForm.program,
        batch_year: parseInt(studentForm.batch_year),
        phone: studentForm.phone
      }, { headers });

      showMessage('✅ Student added successfully');
      setStudentForm({
        full_name: '', email: '', password: '', erp_id: '',
        roll_number: '', program: '', batch_year: '', phone: ''
      });
      fetchStudents();
      fetchStats();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error adding student', true);
    } finally {
      setLoading(false);
    }
  };

  const createFeeLedger = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/fees/ledger`, {
        student_id: parseInt(feeForm.student_id),
        academic_year: feeForm.academic_year,
        semester_number: parseInt(feeForm.semester_number),
        total_fee: parseFloat(feeForm.total_fee)
      }, { headers });

      showMessage('✅ Fee ledger created successfully');
      setFeeForm({ student_id: '', academic_year: '', semester_number: '', total_fee: '' });
      fetchStats();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error creating fee ledger', true);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/fees/payment`, {
        student_id: parseInt(paymentForm.student_id),
        amount: parseFloat(paymentForm.amount),
        type: paymentForm.type,
        reference_number: paymentForm.reference_number,
        semester_number: parseInt(paymentForm.semester_number),
        academic_year: paymentForm.academic_year
      }, { headers });
      
      let msg = '✅ Payment recorded successfully';
      if (res.data.excessAddedToWallet) {
        msg += ` — ₹${res.data.excessAddedToWallet} added to wallet`;
      }
      showMessage(msg);
      setPaymentForm({
        student_id: '', amount: '', type: 'online',
        reference_number: '', semester_number: '', academic_year: ''
      });
      fetchStats();
      fetchAnalytics();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error recording payment', true);
    } finally {
      setLoading(false);
    }
  };

  // Chart Data
  const feeChartData = {
    labels: analytics?.feeCollection?.map(item => 
      new Date(item.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Fees Collected (₹)',
        data: analytics?.feeCollection?.map(item => item.total) || [],
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
      },
    ],
  };

  const attendanceChartData = {
    labels: analytics?.attendance?.map(item => item.range) || [],
    datasets: [
      {
        label: 'Students',
        data: analytics?.attendance?.map(item => item.count) || [],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const feeStatusChartData = {
    labels: analytics?.feeStatus?.map(item => item.status) || [],
    datasets: [
      {
        label: 'Fee Status',
        data: analytics?.feeStatus?.map(item => item.count) || [],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const studentStatusChartData = {
    labels: analytics?.studentStatus?.map(item => item.status) || [],
    datasets: [
      {
        label: 'Students',
        data: analytics?.studentStatus?.map(item => item.count) || [],
        backgroundColor: ['#3b82f6', '#22c55e', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  // Student List Table
  const renderStudentList = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>📋 Student Directory</h2>
        <button style={styles.smallButton} onClick={() => setActiveTab('addStudent')}>+ Add New</button>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>ERP ID</th>
              <th>Roll No</th>
              <th>Full Name</th>
              <th>Program</th>
              <th>Batch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td><code>{student.erp_id}</code></td>
                <td>{student.roll_number}</td>
                <td><strong>{student.full_name}</strong></td>
                <td>{student.program}</td>
                <td>{student.batch_year}</td>
                <td><span style={styles.statusBadge}>{student.status}</span></td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="7" style={styles.emptyRow}>No students found. Add your first student!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Stats Cards
  const renderStats = () => (
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>👨‍🎓</div>
        <div>
          <div style={styles.statValue}>{stats.totalStudents}</div>
          <div style={styles.statLabel}>Total Students</div>
        </div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>💰</div>
        <div>
          <div style={styles.statValue}>₹{stats.totalFeesCollected?.toLocaleString() || 0}</div>
          <div style={styles.statLabel}>Fees Collected</div>
        </div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>⏳</div>
        <div>
          <div style={styles.statValue}>₹{stats.pendingFees?.toLocaleString() || 0}</div>
          <div style={styles.statLabel}>Pending Fees</div>
        </div>
      </div>
    </div>
  );

  // Analytics Charts
  const renderAnalytics = () => (
    <div style={styles.analyticsGrid}>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>📈 Fee Collection Trend</h3>
        <div style={styles.chartContainer}>
          <Bar 
            data={feeChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } },
              scales: {
                y: { beginAtZero: true },
              },
            }} 
          />
        </div>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>📊 Attendance Distribution</h3>
        <div style={styles.chartContainer}>
          <Pie 
            data={attendanceChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }} 
          />
        </div>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>💳 Fee Status</h3>
        <div style={styles.chartContainer}>
          <Doughnut 
            data={feeStatusChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }} 
          />
        </div>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>👥 Student Status</h3>
        <div style={styles.chartContainer}>
          <Pie 
            data={studentStatusChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }} 
          />
        </div>
      </div>
    </div>
  );

  // Tabs
  const tabs = [
    { id: 'studentList', label: '📋 Student List' },
    { id: 'addStudent', label: '➕ Add Student' },
    { id: 'feeLedger', label: '💰 Fee Ledger' },
    { id: 'payments', label: '💳 Payments' },
    { id: 'analytics', label: '📊 Analytics' },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Admin Dashboard</h1>
          <p style={styles.headerSubtitle}>Manage students, fees, and payments</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Stats Cards */}
      {renderStats()}

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={activeTab === tab.id ? {...styles.tab, ...styles.activeTab} : styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {/* Student List Tab */}
        {activeTab === 'studentList' && renderStudentList()}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && renderAnalytics()}

        {/* Add Student Tab */}
        {activeTab === 'addStudent' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Add New Student</h2>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Full Name" value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} />
              <input style={styles.input} placeholder="Email" type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
              <input style={styles.input} placeholder="Password" type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} />
              <input style={styles.input} placeholder="ERP ID" value={studentForm.erp_id} onChange={e => setStudentForm({...studentForm, erp_id: e.target.value})} />
              <input style={styles.input} placeholder="Roll Number" value={studentForm.roll_number} onChange={e => setStudentForm({...studentForm, roll_number: e.target.value})} />
              <input style={styles.input} placeholder="Program (e.g., B.Tech CSE)" value={studentForm.program} onChange={e => setStudentForm({...studentForm, program: e.target.value})} />
              <input style={styles.input} placeholder="Batch Year" type="number" value={studentForm.batch_year} onChange={e => setStudentForm({...studentForm, batch_year: e.target.value})} />
              <input style={styles.input} placeholder="Phone" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} />
            </div>
            <button style={styles.button} onClick={addStudent} disabled={loading}>
              {loading ? 'Adding...' : '➕ Add Student'}
            </button>
          </div>
        )}

        {/* Fee Ledger Tab */}
        {activeTab === 'feeLedger' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Create Fee Ledger</h2>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Student ID" type="number" value={feeForm.student_id} onChange={e => setFeeForm({...feeForm, student_id: e.target.value})} />
              <input style={styles.input} placeholder="Academic Year (e.g., 2025-26)" value={feeForm.academic_year} onChange={e => setFeeForm({...feeForm, academic_year: e.target.value})} />
              <input style={styles.input} placeholder="Semester Number" type="number" value={feeForm.semester_number} onChange={e => setFeeForm({...feeForm, semester_number: e.target.value})} />
              <input style={styles.input} placeholder="Total Fee (₹)" type="number" value={feeForm.total_fee} onChange={e => setFeeForm({...feeForm, total_fee: e.target.value})} />
            </div>
            <button style={styles.button} onClick={createFeeLedger} disabled={loading}>
              {loading ? 'Creating...' : '📝 Create Fee Ledger'}
            </button>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Record Payment</h2>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Student ID" type="number" value={paymentForm.student_id} onChange={e => setPaymentForm({...paymentForm, student_id: e.target.value})} />
              <input style={styles.input} placeholder="Amount (₹)" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              <input style={styles.input} placeholder="Reference Number" value={paymentForm.reference_number} onChange={e => setPaymentForm({...paymentForm, reference_number: e.target.value})} />
              <input style={styles.input} placeholder="Semester Number" type="number" value={paymentForm.semester_number} onChange={e => setPaymentForm({...paymentForm, semester_number: e.target.value})} />
              <input style={styles.input} placeholder="Academic Year (e.g., 2025-26)" value={paymentForm.academic_year} onChange={e => setPaymentForm({...paymentForm, academic_year: e.target.value})} />
              <select style={styles.input} value={paymentForm.type} onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}>
                <option value="online">💳 Online</option>
                <option value="challan">🏦 Challan</option>
                <option value="loan">🏧 Loan</option>
                <option value="concession">🎓 Concession</option>
              </select>
            </div>
            <button style={styles.button} onClick={recordPayment} disabled={loading}>
              {loading ? 'Processing...' : '💳 Record Payment'}
            </button>
          </div>
        )}
      </div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    padding: '24px 32px',
    backgroundColor: 'white',
    margin: '20px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: { fontSize: '40px' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: '14px', color: '#666' },
  tabs: {
    display: 'flex',
    gap: '8px',
    padding: '0 32px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.3s',
  },
  activeTab: {
    backgroundColor: '#4f46e5',
    color: 'white',
  },
  content: { padding: '0 32px 32px' },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a2e' },
  smallButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  input: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  tableContainer: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  statusBadge: {
    padding: '4px 10px',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    borderRadius: '20px',
    fontSize: '12px',
  },
  emptyRow: { textAlign: 'center', padding: '40px', color: '#999' },
  success: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 16px 0',
  },
  chartContainer: {
    height: '250px',
    position: 'relative',
  },
};

export default AdminDashboard;