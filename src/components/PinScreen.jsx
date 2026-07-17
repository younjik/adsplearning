import { useState } from 'react';

export default function PinScreen({ onSubmit, loading }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN은 숫자 4자리 이상이어야 해요');
      return;
    }
    setError('');
    onSubmit(pin);
  }

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <h1 className="pin-title">ADsP 학습</h1>
        <p className="pin-desc">PIN 번호로 진도를 저장하고<br />어떤 기기에서도 이어서 공부할 수 있어요.</p>
        <form onSubmit={handleSubmit} className="pin-form">
          <input
            className="pin-input"
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="숫자 4~8자리"
            autoFocus
            disabled={loading}
          />
          {error && <p className="pin-error">{error}</p>}
          <button className="pin-btn" type="submit" disabled={loading || pin.length < 4}>
            {loading ? '불러오는 중…' : '시작하기'}
          </button>
        </form>
        <p className="pin-hint">처음 입력하는 PIN이면 새 데이터로 시작해요.</p>
      </div>
    </div>
  );
}
