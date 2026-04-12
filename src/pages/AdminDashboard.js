import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const headers = { authorization: token };

  // Add Student form
  const [studentForm, setStudentForm] = useState({
    email: '', password: '', erp_id: '', roll_number: '',
    full_name: '', program: '', batch_year: '', phone: ''
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setMessage(''); setError(''); }, 3000);
  };

  // const addStudent = async () => {
  //   try {
  //     // First register user
  //     const userRes = await axios.post('http://localhost:5000/api/auth/register', {
  //       email: studentForm.email,
  //       password: studentForm.password,
  //       role: 'student'
  //     }, { headers });

  //     // Then create student profile
  //     await axios.post('http://localhost:5000/api/students', {
  //       user_id: userRes.data.user.id,
  //       erp_id: studentForm.erp_id,
  //       roll_number: studentForm.roll_number,
  //       full_name: studentForm.full_name,
  //       program: studentForm.program,
  //       batch_year: parseInt(studentForm.batch_year),
  //       email: studentForm.email,
  //       phone: studentForm.phone
  //     }, { headers });

  //     showMessage('Student added successfully');
  //     setStudentForm({
  //       email: '', password: '', erp_id: '', roll_number: '',
  //       full_name: '', program: '', batch_year: '', phone: ''
  //     });
  //   } catch (err) {
  //     showMessage(err.response?.data?.message || 'Error adding student', true);
  //   }
  // };
  const addStudent = async () => {
  try {
    await axios.post('http://localhost:5000/api/students', {
      full_name: studentForm.full_name,
      email: studentForm.email,
      password: studentForm.password,
      erp_id: studentForm.erp_id,
      roll_number: studentForm.roll_number,
      program: studentForm.program,
      batch_year: parseInt(studentForm.batch_year),
      phone: studentForm.phone
    }, { headers });

    showMessage('Student added successfully');
    setStudentForm({
      email: '', password: '', erp_id: '', roll_number: '',
      full_name: '', program: '', batch_year: '', phone: ''
    });
  } catch (err) {
    showMessage(err.response?.data?.message || 'Error adding student', true);
  }
};

  const createFeeLedger = async () => {
    try {
      await axios.post('http://localhost:5000/api/fees/ledger', {
        student_id: parseInt(feeForm.student_id),
        academic_year: feeForm.academic_year,
        semester_number: parseInt(feeForm.semester_number),
        total_fee: parseFloat(feeForm.total_fee)
      }, { headers });
      showMessage('Fee ledger created successfully');
      setFeeForm({ student_id: '', academic_year: '', semester_number: '', total_fee: '' });
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error creating fee ledger', true);
    }
  };

  const recordPayment = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/fees/payment', {
        student_id: parseInt(paymentForm.student_id),
        amount: parseFloat(paymentForm.amount),
        type: paymentForm.type,
        reference_number: paymentForm.reference_number,
        semester_number: parseInt(paymentForm.semester_number),
        academic_year: paymentForm.academic_year
      }, { headers });
      
      let msg = 'Payment recorded successfully';
      if (res.data.excessAddedToWallet) {
        msg += ` — ₹${res.data.excessAddedToWallet} added to wallet`;
      }
      showMessage(msg);
      setPaymentForm({
        student_id: '', amount: '', type: 'online',
        reference_number: '', semester_number: '', academic_year: ''
      });
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error recording payment', true);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['students', 'fees', 'payments'].map(tab => (
          <button
            key={tab}
            style={activeTab === tab ? {...styles.tab, ...styles.activeTab} : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {/* Add Student */}
        {activeTab === 'students' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Add New Student</h2>
            {[
              { key: 'full_name', label: 'Full Name', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'password', label: 'Password', type: 'password' },
              { key: 'erp_id', label: 'ERP ID', type: 'text' },
              { key: 'roll_number', label: 'Roll Number', type: 'text' },
              { key: 'program', label: 'Program (e.g. B.Tech CSE)', type: 'text' },
              { key: 'batch_year', label: 'Batch Year (e.g. 2022)', type: 'number' },
              { key: 'phone', label: 'Phone', type: 'text' }
            ].map(field => (
              <div key={field.key} style={styles.field}>
                <label style={styles.label}>{field.label}</label>
                <input
                  style={styles.input}
                  type={field.type}
                  value={studentForm[field.key]}
                  onChange={e => setStudentForm({...studentForm, [field.key]: e.target.value})}
                  placeholder={field.label}
                />
              </div>
            ))}
            <button style={styles.button} onClick={addStudent}>Add Student</button>
          </div>
        )}

        {/* Create Fee Ledger */}
        {activeTab === 'fees' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Create Fee Ledger</h2>
            {[
              { key: 'student_id', label: 'Student ID', type: 'number' },
              { key: 'academic_year', label: 'Academic Year (e.g. 2025-26)', type: 'text' },
              { key: 'semester_number', label: 'Semester Number', type: 'number' },
              { key: 'total_fee', label: 'Total Fee (₹)', type: 'number' }
            ].map(field => (
              <div key={field.key} style={styles.field}>
                <label style={styles.label}>{field.label}</label>
                <input
                  style={styles.input}
                  type={field.type}
                  value={feeForm[field.key]}
                  onChange={e => setFeeForm({...feeForm, [field.key]: e.target.value})}
                  placeholder={field.label}
                />
              </div>
            ))}
            <button style={styles.button} onClick={createFeeLedger}>Create Fee Ledger</button>
          </div>
        )}

        {/* Record Payment */}
        {activeTab === 'payments' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Record Payment</h2>
            {[
              { key: 'student_id', label: 'Student ID', type: 'number' },
              { key: 'amount', label: 'Amount (₹)', type: 'number' },
              { key: 'reference_number', label: 'Reference Number', type: 'text' },
              { key: 'semester_number', label: 'Semester Number', type: 'number' },
              { key: 'academic_year', label: 'Academic Year (e.g. 2025-26)', type: 'text' }
            ].map(field => (
              <div key={field.key} style={styles.field}>
                <label style={styles.label}>{field.label}</label>
                <input
                  style={styles.input}
                  type={field.type}
                  value={paymentForm[field.key]}
                  onChange={e => setPaymentForm({...paymentForm, [field.key]: e.target.value})}
                  placeholder={field.label}
                />
              </div>
            ))}
            <div style={styles.field}>
              <label style={styles.label}>Payment Type</label>
              <select
                style={styles.input}
                value={paymentForm.type}
                onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}
              >
                <option value="online">Online</option>
                <option value="challan">Challan</option>
                <option value="loan">Loan</option>
                <option value="concession">Concession</option>
              </select>
            </div>
            <button style={styles.button} onClick={recordPayment}>Record Payment</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: '#4f46e5',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: 'white', margin: 0, fontSize: '20px' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  tabs: {
    backgroundColor: 'white',
    padding: '0 32px',
    display: 'flex',
    borderBottom: '1px solid #e5e7eb'
  },
  tab: {
    padding: '16px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666'
  },
  activeTab: {
    color: '#4f46e5',
    borderBottom: '2px solid #4f46e5'
  },
  content: { maxWidth: '600px', margin: '0 auto', padding: '32px 16px' },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '600', color: '#1a1a2e' },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  }
};

export default AdminDashboard;