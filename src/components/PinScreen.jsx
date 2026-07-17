import { useState } from 'react';

export default function PinScreen({ onSubmit, loading, error }) {
  const [isNew, setIsNew] = useState(false);
  const [pin, setPin] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (pin.length < 4) return;
    onSubmit(pin, isNew);
  }

  function handleTabChange(newTab) {
    setIsNew(newTab);
    setPin('');
  }

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <h1 className="pin-title">ADsP 학습</h1>
        <div className="pin-tabs">
          <button
            type="button"
            className={`pin-tab ${!isNew ? 'active' : ''}`}
            onClick={() => handleTabChange(false)}
          >
            기존 사용자
          </button>
          <button
            type="button"
            className={`pin-tab ${isNew ? 'active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            처음이신가요?
          </button>
        </div>
        <p className="pin-desc">
          {isNew
            ? '사용할 PIN 번호를 정해주세요.\n어떤 기기에서도 이 번호로 이어서 공부할 수 있어요.'
            : '등록한 PIN 번호를 입력하면\n이전 진도를 이어서 공부할 수 있어요.'}
        </p>
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
            {loading ? '확인 중…' : isNew ? 'PIN 만들기' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
