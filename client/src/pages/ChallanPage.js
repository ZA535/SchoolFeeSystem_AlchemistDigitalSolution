import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ChallanPrint from '../components/ChallanPrint.js';
import LoadingPanel from '../components/LoadingPanel.js';
import { DefaultAppName } from '../enums/defaults.js';

export default function ChallanPage() {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getVoucher(id)
      .then(setVoucher)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div className="toolbar no-print" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print challan
        </button>
        <Link to="/vouchers" className="btn secondary">
          Back to vouchers
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {voucher && (
        <ChallanPrint
          voucher={voucher}
          schoolName={
            import.meta.env.VITE_SCHOOL_NAME || DefaultAppName.YOUR_SCHOOL_NAME
          }
        />
      )}
      {loading && !error && <LoadingPanel label="Loading challan…" minHeight="14rem" />}
    </div>
  );
}
