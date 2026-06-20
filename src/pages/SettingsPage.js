import { useState } from 'react';
import { useShop } from '../context/ShopContext';

function SettingsPage() {
  const { updateAdminPassword, clearMessage } = useShop();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    clearMessage();

    if (newPassword !== confirmPassword) {
      return;
    }

    const updated = updateAdminPassword(currentPassword, newPassword);
    if (!updated) {
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const mismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;

  return (
    <section className="card">
      <h2>Settings</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Current Admin Password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter current password"
            required
          />
        </label>

        <label>
          New Admin Password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter new password"
            minLength={4}
            required
          />
        </label>

        <label>
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter new password"
            minLength={4}
            required
          />
        </label>

        {mismatch ? <p style={{ color: '#b91c1c', margin: 0 }}>New password and confirmation do not match.</p> : null}

        <div className="btn-row">
          <button className="primary-btn" type="submit" disabled={mismatch}>
            Update Admin Password
          </button>
        </div>
      </form>
    </section>
  );
}

export default SettingsPage;
